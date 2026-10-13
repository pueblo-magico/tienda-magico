import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

import { relationID } from '../collections/sellableItems'
import {
  assertManualPayoutConfirmation,
  assertPayoutConfirmation,
  ManualPayoutConfirmationError,
  PayoutConfirmationError,
  supplierObligationUpdateForPayout,
} from '../lib/supplierFinance/policy'
import { activeTransaction } from './transferWriteLock'

type ManualPayoutInput = {
  acknowledged: true
  paidAt: string
  reference: string
}

export function manualSupplierPayoutInput(value: unknown): ManualPayoutInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ManualPayoutConfirmationError('confirmation_required')
  if (
    Object.keys(value).length !== 3 ||
    !('acknowledged' in value) ||
    value.acknowledged !== true ||
    !('reference' in value) ||
    typeof value.reference !== 'string' ||
    !('paidAt' in value) ||
    typeof value.paidAt !== 'string'
  )
    throw new ManualPayoutConfirmationError('confirmation_required')
  return {
    acknowledged: true,
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
    const settlementID = relationID(payout.settlement)
    const profileID = relationID(payout.paymentProfile)
    const supplierID = relationID(payout.supplier)
    if (settlementID == null || profileID == null || supplierID == null)
      throw new ManualPayoutConfirmationError('settlement')
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
      relationID(settlement.supplier) !== supplierID ||
      relationID(profile.supplier) !== supplierID
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
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const obligationUpdate = supplierObligationUpdateForPayout('succeeded')
    const obligationTotal = obligations.docs.reduce(
      (total, obligation) => total + Number(obligation.outstandingMinor),
      0,
    )
    if (
      !obligationUpdate ||
      obligations.hasNextPage ||
      obligations.docs.length === 0 ||
      !Number.isSafeInteger(obligationTotal) ||
      obligationTotal !== payout.amountMinor ||
      obligations.docs.some((obligation) => obligation.status !== 'approved')
    )
      throw new ManualPayoutConfirmationError('amount')

    const recordedAt = new Date().toISOString()
    for (const obligation of obligations.docs) {
      await req.payload.update({
        collection: 'supplier-obligations',
        id: obligation.id,
        data: obligationUpdate,
        overrideAccess: true,
        req,
      })
    }
    await req.payload.update({
      collection: 'supplier-settlements',
      id: settlementID,
      data: { outstandingMinor: 0, status: 'paid' },
      overrideAccess: true,
      req,
    })
    await req.payload.update({
      collection: 'supplier-payouts',
      id: payoutID,
      data: {
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
    await req.payload.db.commitTransaction(transactionID)
    return Response.json({ reconciled: true, status: 'succeeded' })
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
