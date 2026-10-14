import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

import { relationID } from '../collections/sellableItems'
import {
  SupplierPayoutProviderError,
  type SupplierPayoutProvider,
} from '../lib/supplierFinance/payoutProvider'
import { resolveConfiguredSupplierPayoutProvider } from '../lib/supplierFinance/supplierPayoutProviders'
import { allocateSupplierPayment } from '../lib/supplierFinance/policy'
import { activeTransaction } from './transferWriteLock'
import { appendSupplierFinanceEvent } from './appendSupplierFinanceEvent'

export const reconcileSupplierPayoutEndpoint: Endpoint = {
  path: '/:id/reconcile',
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
    return reconcileSupplierPayout(req, id)
  },
}

export async function reconcileSupplierPayout(
  req: PayloadRequest,
  payoutID: number,
  resolveProvider: (
    provider: string,
  ) => SupplierPayoutProvider = resolveConfiguredSupplierPayoutProvider,
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
    if (!actor.roles?.includes('admin')) return rollback(req, transactionID, 'forbidden', 403)

    const payout = await req.payload.findByID({
      collection: 'supplier-payouts',
      id: payoutID,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (payout.status === 'succeeded') {
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ reconciled: true, status: 'succeeded', alreadyReconciled: true })
    }
    if (!['submitted', 'processing', 'reconciliation_required'].includes(payout.status))
      return rollback(req, transactionID, 'state', 409)
    if (!payout.providerPayoutId || !payout.providerTransactionId)
      return rollback(req, transactionID, 'provider_reference', 409)
    const settlementID = Number(relationID(payout.settlement))
    const supplierID = Number(relationID(payout.supplier))
    if (
      !Number.isSafeInteger(settlementID) ||
      settlementID <= 0 ||
      !Number.isSafeInteger(supplierID) ||
      supplierID <= 0
    )
      return rollback(req, transactionID, 'settlement', 409)

    let provider: SupplierPayoutProvider
    try {
      provider = resolveProvider(payout.paymentMethod)
      if (provider.id !== payout.paymentMethod || provider.id !== 'mercado-pago')
        throw new SupplierPayoutProviderError('configuration')
    } catch (error) {
      if (error instanceof SupplierPayoutProviderError)
        return rollback(req, transactionID, error.code, 503)
      throw error
    }
    if (!provider.capabilities.queryStatus)
      return rollback(req, transactionID, 'configuration', 503)

    let result
    try {
      result = await provider.getStatus({
        payoutID: payout.providerPayoutId,
        transactionID: payout.providerTransactionId,
      })
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
        eventKey: `reconcile-error:${payoutID}:${payout.status}:${failureCode}`,
        eventType: 'reconciliation_required',
        supplier: supplierID,
        settlement: settlementID,
        payout: payoutID,
        provider: 'mercado-pago',
        amountMinor: payout.amountMinor,
        appliedMinor: 0,
        outstandingAfterMinor: payout.amountMinor,
        feeMinor: 0,
        feeResponsibility: 'unknown',
        currency: 'ARS',
        previousStatus: payout.status,
        nextStatus: 'reconciliation_required',
        actor: Number(actor.id),
        occurredAt: new Date().toISOString(),
        correlationKey: `payout:${payoutID}`,
        externalReference: payout.providerTransactionId,
        reason: failureCode,
      })
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ code: 'reconciliation_required' }, { status: 502 })
    }

    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-settlement:${settlementID}`}, 0))`,
    )
    const settlement = await req.payload.findByID({
      collection: 'supplier-settlements',
      id: settlementID,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (result.status === 'succeeded') {
      if (settlement.outstandingMinor !== payout.amountMinor)
        return rollback(req, transactionID, 'amount', 409)
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
        amountMinor: payout.amountMinor,
        obligations: activeObligations,
      })
      if (
        obligations.hasNextPage ||
        !allocation ||
        allocation.outstandingMinor !== 0 ||
        activeObligations.reduce((total, obligation) => total + obligation.outstandingMinor, 0) !==
          settlement.outstandingMinor
      )
        return rollback(req, transactionID, 'obligations', 409)
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
        data: { outstandingMinor: 0, status: 'paid' },
        overrideAccess: true,
        req,
      })
    } else if (result.status === 'failed') {
      await req.payload.update({
        collection: 'supplier-settlements',
        id: settlementID,
        data: {
          status:
            settlement.outstandingMinor < settlement.amountMinor ? 'partially_paid' : 'approved',
        },
        overrideAccess: true,
        req,
      })
    }
    await req.payload.update({
      collection: 'supplier-payouts',
      id: payoutID,
      data: {
        status: result.status,
        providerStatus: result.providerStatus,
        failureCode: result.status === 'failed' ? result.providerStatusDetail : null,
      },
      overrideAccess: true,
      req,
    })
    const eventType = result.status === 'processing' ? 'provider_status_checked' : result.status
    await appendSupplierFinanceEvent(req, {
      eventKey: `reconcile:${payoutID}:${payout.status}:${result.status}:${result.providerStatus}:${result.providerStatusDetail ?? 'none'}`,
      eventType,
      supplier: supplierID,
      settlement: settlementID,
      payout: payoutID,
      provider: 'mercado-pago',
      amountMinor: payout.amountMinor,
      appliedMinor: result.status === 'succeeded' ? payout.amountMinor : 0,
      outstandingAfterMinor: result.status === 'succeeded' ? 0 : settlement.outstandingMinor,
      receivedMinor: result.status === 'succeeded' ? payout.amountMinor : undefined,
      feeMinor: 0,
      feeResponsibility: 'unknown',
      currency: 'ARS',
      previousStatus: payout.status,
      nextStatus: result.status,
      actor: Number(actor.id),
      occurredAt: new Date().toISOString(),
      correlationKey: `payout:${payoutID}`,
      externalReference: payout.providerTransactionId,
      reason: result.providerStatusDetail ?? undefined,
    })
    await req.payload.db.commitTransaction(transactionID)
    return Response.json({ reconciled: true, status: result.status })
  } catch {
    await req.payload.db.rollbackTransaction(transactionID)
    req.payload.logger.error({
      msg: 'No se pudo conciliar el pago al proveedor.',
      payoutID,
    })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
  }
}

async function rollback(
  req: PayloadRequest,
  transactionID: string | number,
  code: string,
  status: number,
) {
  await req.payload.db.rollbackTransaction(transactionID)
  return Response.json({ code }, { status })
}
