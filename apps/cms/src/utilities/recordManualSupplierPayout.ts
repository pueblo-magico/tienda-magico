import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'
import { randomUUID } from 'node:crypto'

import { relationID } from '../collections/sellableItems'
import {
  assertManualPayoutConfirmation,
  assertPayoutConfirmation,
  allocateSupplierPayment,
  ManualPayoutConfirmationError,
  PayoutConfirmationError,
} from '../lib/supplierFinance/policy'
import { activeTransaction } from './transferWriteLock'
import { appendSupplierFinanceEvent } from './appendSupplierFinanceEvent'

type ManualPayoutInput = {
  acknowledged: true
  amountMinor: number
  paidAt: string
  reference: string
}

export function manualSupplierPayoutInput(value: unknown): ManualPayoutInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ManualPayoutConfirmationError('confirmation_required')
  if (
    Object.keys(value).length !== 4 ||
    !('acknowledged' in value) ||
    value.acknowledged !== true ||
    !('reference' in value) ||
    typeof value.reference !== 'string' ||
    !('amountMinor' in value) ||
    !Number.isSafeInteger(value.amountMinor) ||
    !('paidAt' in value) ||
    typeof value.paidAt !== 'string'
  )
    throw new ManualPayoutConfirmationError('confirmation_required')
  return {
    acknowledged: true,
    amountMinor: Number(value.amountMinor),
    reference: value.reference.trim(),
    paidAt: value.paidAt,
  }
}

export const recordManualSupplierPayoutEndpoint: Endpoint = {
  path: '/:id/record-manual',
  method: 'post',
  handler: async (req) => {
    if (!req.user?.roles?.includes('admin'))
      return Response.json({ code: 'forbidden' }, { status: 403 })
    if (
      !req.payload.config.serverURL ||
      req.headers.get('origin') !== new URL(req.payload.config.serverURL).origin
    )
      return Response.json({ code: 'origin' }, { status: 403 })
    const id = Number(req.routeParams?.id)
    if (!Number.isSafeInteger(id) || id <= 0)
      return Response.json({ code: 'invalid' }, { status: 400 })
    let input: ManualPayoutInput
    try {
      input = manualSupplierPayoutInput(await req.json?.())
    } catch {
      return Response.json({ code: 'confirmation_required' }, { status: 400 })
    }
    return recordManualSupplierPayout(req, id, input)
  },
}

async function recordManualSupplierPayout(
  req: PayloadRequest,
  payoutID: number,
  input: ManualPayoutInput,
): Promise<Response> {
  const transactionID = await req.payload.db.beginTransaction().catch(() => null)
  if (!transactionID) return Response.json({ code: 'unavailable' }, { status: 503 })
  req.transactionID = transactionID
  try {
    const transaction = await activeTransaction(req)
    await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-payout:${payoutID}`}, 0))`,
    )
    const actor = await req.payload.findByID({
      collection: 'users',
      id: req.user!.id,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!actor.roles?.includes('admin')) throw new ManualPayoutConfirmationError('forbidden')

    const payout = await req.payload.findByID({
      collection: 'supplier-payouts',
      id: payoutID,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (payout.status === 'succeeded' && payout.paymentMethod === 'manual') {
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ reconciled: true, status: 'succeeded', alreadyReconciled: true })
    }
    const settlementID = Number(relationID(payout.settlement))
    const profileID = Number(relationID(payout.paymentProfile))
    const supplierID = Number(relationID(payout.supplier))
    if (
      !Number.isSafeInteger(settlementID) ||
      settlementID <= 0 ||
      !Number.isSafeInteger(profileID) ||
      profileID <= 0 ||
      !Number.isSafeInteger(supplierID) ||
      supplierID <= 0
    )
      throw new ManualPayoutConfirmationError('settlement')
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-settlement:${settlementID}`}, 0))`,
    )
    const [settlement, profile] = await Promise.all([
      req.payload.findByID({
        collection: 'supplier-settlements',
        id: settlementID,
        depth: 0,
        overrideAccess: true,
        req,
      }),
      req.payload.findByID({
        collection: 'supplier-payment-profiles',
        id: profileID,
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])
    if (
      Number(relationID(settlement.supplier)) !== supplierID ||
      Number(relationID(profile.supplier)) !== supplierID
    )
      throw new PayoutConfirmationError('profile')

    assertPayoutConfirmation({
      actorRoles: actor.roles ?? [],
      settlementStatus: settlement.status,
      settlementCurrency: settlement.currency,
      outstandingMinor: settlement.outstandingMinor,
      profileStatus: profile.status,
      profileCurrency: profile.currency,
      amountMinor: payout.amountMinor,
      acknowledged: input.acknowledged,
    })
    assertManualPayoutConfirmation({
      actorRoles: actor.roles ?? [],
      payoutStatus: payout.status,
      settlementStatus: settlement.status,
      settlementApprovedAt: String(settlement.approvedAt ?? ''),
      settlementCurrency: settlement.currency,
      outstandingMinor: settlement.outstandingMinor,
      amountMinor: payout.amountMinor,
      reference: input.reference,
      paidAt: input.paidAt,
      acknowledged: input.acknowledged,
    })

    const duplicateReference = await req.payload.find({
      collection: 'supplier-payouts',
      where: { manualReference: { equals: input.reference } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (duplicateReference.docs.some((existing) => existing.id !== payout.id))
      throw new ManualPayoutConfirmationError('duplicate_reference')

    const obligations = await req.payload.find({
      collection: 'supplier-obligations',
      where: { settlement: { equals: settlementID } },
      sort: 'id',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const activeObligations = obligations.docs
      .filter((obligation) => Number(obligation.outstandingMinor) > 0)
      .map((obligation) => ({
        id: Number(obligation.id),
        status: obligation.status,
        outstandingMinor: Number(obligation.outstandingMinor),
      }))
    const allocation = allocateSupplierPayment({
      amountMinor: input.amountMinor,
      obligations: activeObligations,
    })
    const obligationTotal = activeObligations.reduce(
      (total, obligation) => total + obligation.outstandingMinor,
      0,
    )
    if (obligations.hasNextPage || obligationTotal !== settlement.outstandingMinor || !allocation)
      throw new ManualPayoutConfirmationError('amount')

    const recordedAt = new Date().toISOString()
    for (const obligation of allocation.allocations) {
      await req.payload.update({
        collection: 'supplier-obligations',
        id: obligation.id,
        data: { status: obligation.status, outstandingMinor: obligation.outstandingMinor },
        overrideAccess: true,
        req,
      })
    }
    await req.payload.update({
      collection: 'supplier-settlements',
      id: settlementID,
      data: { outstandingMinor: allocation.outstandingMinor, status: allocation.status },
      overrideAccess: true,
      req,
    })
    await req.payload.update({
      collection: 'supplier-payouts',
      id: payoutID,
      data: {
        amountMinor: input.amountMinor,
        status: 'succeeded',
        paymentMethod: 'manual',
        providerStatus: 'manual_reconciled',
        manualReference: input.reference,
        manualPaidAt: new Date(input.paidAt).toISOString(),
        manualRecordedBy: actor.id,
        confirmedBy: actor.id,
        confirmedAt: recordedAt,
        destinationSnapshot: {
          provider: 'manual',
          recipientEmail: profile.recipientEmail,
          currency: profile.currency,
          verifiedAt: profile.verifiedAt,
        },
      },
      overrideAccess: true,
      req,
    })
    await appendSupplierFinanceEvent(req, {
      eventKey: `manual:${payoutID}:${input.reference}`,
      eventType: allocation.outstandingMinor > 0 ? 'partial_payment' : 'manual_reconciled',
      supplier: supplierID,
      settlement: settlementID,
      payout: payoutID,
      provider: 'manual',
      amountMinor: input.amountMinor,
      appliedMinor: input.amountMinor,
      outstandingAfterMinor: allocation.outstandingMinor,
      receivedMinor: input.amountMinor,
      feeMinor: 0,
      feeResponsibility: 'unknown',
      currency: 'ARS',
      previousStatus: payout.status,
      nextStatus: 'succeeded',
      actor: Number(actor.id),
      occurredAt: recordedAt,
      correlationKey: `payout:${payoutID}`,
      externalReference: input.reference,
    })
    if (allocation.outstandingMinor > 0) {
      const nextPayout = await req.payload.create({
        collection: 'supplier-payouts',
        data: {
          supplier: supplierID,
          settlement: settlementID,
          paymentProfile: profileID,
          amountMinor: allocation.outstandingMinor,
          currency: 'ARS',
          paymentMethod: 'mercado-pago',
          status: 'awaiting_approval',
          idempotencyKey: randomUUID(),
        },
        overrideAccess: true,
        req,
      })
      await appendSupplierFinanceEvent(req, {
        eventKey: `prepared:${nextPayout.idempotencyKey}`,
        eventType: 'payout_prepared',
        supplier: supplierID,
        settlement: settlementID,
        payout: Number(nextPayout.id),
        provider: 'mercado-pago',
        amountMinor: allocation.outstandingMinor,
        appliedMinor: 0,
        outstandingAfterMinor: allocation.outstandingMinor,
        feeMinor: 0,
        feeResponsibility: 'unknown',
        currency: 'ARS',
        nextStatus: 'awaiting_approval',
        actor: Number(actor.id),
        occurredAt: recordedAt,
        correlationKey: `settlement:${settlementID}`,
      })
    }
    await req.payload.db.commitTransaction(transactionID)
    return Response.json({
      reconciled: true,
      status: 'succeeded',
      settlementStatus: allocation.status,
      outstandingMinor: allocation.outstandingMinor,
    })
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID)
    if (
      error instanceof ManualPayoutConfirmationError ||
      error instanceof PayoutConfirmationError
    ) {
      const status = error.code === 'forbidden' ? 403 : 409
      return Response.json({ code: error.code }, { status })
    }
    req.payload.logger.error({
      msg: 'No se pudo registrar el pago manual al proveedor.',
      payoutID,
    })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
  }
}
