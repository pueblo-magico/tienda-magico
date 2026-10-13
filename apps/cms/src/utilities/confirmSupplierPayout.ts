import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

import { relationID } from '../collections/sellableItems'
import { PayoutConfirmationError, assertPayoutConfirmation } from '../lib/supplierFinance/policy'
import {
  SupplierPayoutProviderError,
  submitMercadoPagoPayout,
} from '../lib/supplierFinance/mercadoPagoPayouts'
import { activeTransaction } from './transferWriteLock'
import { appendSupplierFinanceEvent } from './appendSupplierFinanceEvent'

export function supplierPayoutConfirmationInput(value: unknown): { acknowledged: true } {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !('acknowledged' in value) ||
    value.acknowledged !== true
  )
    throw new PayoutConfirmationError('confirmation_required')
  return { acknowledged: true }
}

export const confirmSupplierPayoutEndpoint: Endpoint = {
  path: '/:id/confirm',
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
    try {
      supplierPayoutConfirmationInput(await req.json?.())
    } catch {
      return Response.json({ code: 'confirmation_required' }, { status: 400 })
    }
    return confirmSupplierPayout(req, id)
  },
}

export async function confirmSupplierPayout(
  req: PayloadRequest,
  payoutID: number,
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
    if (!actor.roles?.includes('admin')) throw new PayoutConfirmationError('forbidden')
    const payout = await req.payload.findByID({
      collection: 'supplier-payouts',
      id: payoutID,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (payout.status !== 'awaiting_approval') throw new PayoutConfirmationError('settlement')
    const settlementID = relationID(payout.settlement)
    const profileID = relationID(payout.paymentProfile)
    const supplierID = relationID(payout.supplier)
    if (settlementID == null || profileID == null || supplierID == null)
      throw new PayoutConfirmationError('settlement')
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
      acknowledged: true,
    })
    const accessToken = process.env.MERCADOPAGO_PAYOUTS_ACCESS_TOKEN?.trim()
    if (!accessToken || process.env.MERCADOPAGO_PAYOUTS_TEST_MODE !== 'true')
      return await rollbackResponse(req, transactionID, 'configuration', 503)

    const confirmedAt = new Date().toISOString()
    await req.payload.update({
      collection: 'supplier-payouts',
      id: payoutID,
      data: {
        status: 'submitting',
        confirmedBy: actor.id,
        confirmedAt,
        destinationSnapshot: {
          provider: profile.provider,
          recipientEmail: profile.recipientEmail,
          currency: profile.currency,
          verifiedAt: profile.verifiedAt,
        },
      },
      overrideAccess: true,
      req,
    })
    await appendSupplierFinanceEvent(req, {
      eventKey: `submission-started:${payout.idempotencyKey}`,
      eventType: 'submission_started',
      supplier: Number(supplierID),
      settlement: Number(settlementID),
      payout: payoutID,
      provider: 'mercado-pago',
      amountMinor: payout.amountMinor,
      appliedMinor: 0,
      outstandingAfterMinor: settlement.outstandingMinor,
      feeMinor: 0,
      feeResponsibility: 'unknown',
      currency: 'ARS',
      previousStatus: 'awaiting_approval',
      nextStatus: 'submitting',
      actor: Number(actor.id),
      occurredAt: confirmedAt,
      correlationKey: `payout:${payoutID}`,
    })
    try {
      const submission = await submitMercadoPagoPayout(
        {
          externalReference: `supplier_payout_${payoutID}`,
          description: `Pago proveedor ${supplierID}`,
          recipientEmail: profile.recipientEmail,
          amountMinor: payout.amountMinor,
          currency: 'ARS',
          notificationURL: process.env.MERCADOPAGO_PAYOUTS_WEBHOOK_URL?.trim() || undefined,
        },
        {
          accessToken,
          idempotencyKey: payout.idempotencyKey,
          testMode: true,
        },
      )
      await req.payload.update({
        collection: 'supplier-payouts',
        id: payoutID,
        data: {
          status: submission.status,
          providerPayoutId: submission.payoutID,
          providerTransactionId: submission.transactionID,
          providerStatus: submission.providerStatus,
        },
        overrideAccess: true,
        req,
      })
      await appendSupplierFinanceEvent(req, {
        eventKey: `submitted:${payout.idempotencyKey}`,
        eventType: 'submitted',
        supplier: Number(supplierID),
        settlement: Number(settlementID),
        payout: payoutID,
        provider: 'mercado-pago',
        amountMinor: payout.amountMinor,
        appliedMinor: 0,
        outstandingAfterMinor: settlement.outstandingMinor,
        feeMinor: 0,
        feeResponsibility: 'unknown',
        currency: 'ARS',
        previousStatus: 'submitting',
        nextStatus: submission.status,
        actor: Number(actor.id),
        occurredAt: new Date().toISOString(),
        correlationKey: `payout:${payoutID}`,
        externalReference: submission.transactionID,
      })
      await req.payload.update({
        collection: 'supplier-settlements',
        id: settlementID,
        data: { status: 'payment_pending' },
        overrideAccess: true,
        req,
      })
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ submitted: true, status: submission.status })
    } catch (error) {
      const failureCode = error instanceof SupplierPayoutProviderError ? error.code : 'uncertain'
      await req.payload.update({
        collection: 'supplier-payouts',
        id: payoutID,
        data: { status: 'reconciliation_required', failureCode },
        overrideAccess: true,
        req,
      })
      await appendSupplierFinanceEvent(req, {
        eventKey: `submission-uncertain:${payout.idempotencyKey}`,
        eventType: 'reconciliation_required',
        supplier: Number(supplierID),
        settlement: Number(settlementID),
        payout: payoutID,
        provider: 'mercado-pago',
        amountMinor: payout.amountMinor,
        appliedMinor: 0,
        outstandingAfterMinor: settlement.outstandingMinor,
        feeMinor: 0,
        feeResponsibility: 'unknown',
        currency: 'ARS',
        previousStatus: 'submitting',
        nextStatus: 'reconciliation_required',
        actor: Number(actor.id),
        occurredAt: new Date().toISOString(),
        correlationKey: `payout:${payoutID}`,
        reason: failureCode,
      })
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ code: 'reconciliation_required' }, { status: 502 })
    }
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID)
    if (error instanceof PayoutConfirmationError) {
      const status = error.code === 'forbidden' ? 403 : 409
      return Response.json({ code: error.code }, { status })
    }
    req.payload.logger.error({ msg: 'No se pudo confirmar el pago al proveedor.', payoutID })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
  }
}

async function rollbackResponse(
  req: PayloadRequest,
  transactionID: string | number,
  code: string,
  status: number,
) {
  await req.payload.db.rollbackTransaction(transactionID)
  return Response.json({ code }, { status })
}
