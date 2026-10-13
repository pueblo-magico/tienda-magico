import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

import { relationID } from '../collections/sellableItems'
import {
  getMercadoPagoPayoutStatus,
  SupplierPayoutProviderError,
} from '../lib/supplierFinance/mercadoPagoPayouts'
import { supplierObligationUpdateForPayout } from '../lib/supplierFinance/policy'
import { activeTransaction } from './transferWriteLock'

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

async function reconcileSupplierPayout(req: PayloadRequest, payoutID: number): Promise<Response> {
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

    const accessToken = process.env.MERCADOPAGO_PAYOUTS_ACCESS_TOKEN?.trim()
    if (!accessToken || process.env.MERCADOPAGO_PAYOUTS_TEST_MODE !== 'true')
      return rollback(req, transactionID, 'configuration', 503)

    let result
    try {
      result = await getMercadoPagoPayoutStatus(
        {
          payoutID: payout.providerPayoutId,
          transactionID: payout.providerTransactionId,
        },
        { accessToken, testMode: true },
      )
    } catch (error) {
      const failureCode = error instanceof SupplierPayoutProviderError ? error.code : 'uncertain'
      await req.payload.update({
        collection: 'supplier-payouts',
        id: payoutID,
        data: { status: 'reconciliation_required', failureCode },
        overrideAccess: true,
        req,
      })
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ code: 'reconciliation_required' }, { status: 502 })
    }

    const settlementID = relationID(payout.settlement)
    if (settlementID == null) return rollback(req, transactionID, 'settlement', 409)
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
      await req.payload.update({
        collection: 'supplier-settlements',
        id: settlementID,
        data: { outstandingMinor: 0, status: 'paid' },
        overrideAccess: true,
        req,
      })
      const obligationUpdate = supplierObligationUpdateForPayout(result.status)
      const obligations = await req.payload.find({
        collection: 'supplier-obligations',
        where: { settlement: { equals: settlementID } },
        limit: 1000,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (!obligationUpdate || obligations.hasNextPage || obligations.docs.length === 0)
        return rollback(req, transactionID, 'obligations', 409)
      for (const obligation of obligations.docs) {
        if (obligation.status !== 'approved')
          return rollback(req, transactionID, 'obligations', 409)
        await req.payload.update({
          collection: 'supplier-obligations',
          id: obligation.id,
          data: obligationUpdate,
          overrideAccess: true,
          req,
        })
      }
    } else if (result.status === 'failed') {
      await req.payload.update({
        collection: 'supplier-settlements',
        id: settlementID,
        data: { status: 'approved' },
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
