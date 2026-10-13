import { sql } from '@payloadcms/db-postgres'
import type { Endpoint, PayloadRequest } from 'payload'

import { activeTransaction } from './transferWriteLock'

export const approveSupplierSettlementEndpoint: Endpoint = {
  path: '/:id/approve',
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
    return approveSupplierSettlement(req, id)
  },
}

async function approveSupplierSettlement(req: PayloadRequest, settlementID: number) {
  const transactionID = await req.payload.db.beginTransaction().catch(() => null)
  if (!transactionID) return Response.json({ code: 'unavailable' }, { status: 503 })
  req.transactionID = transactionID
  try {
    const transaction = await activeTransaction(req)
    await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-settlement:${settlementID}`}, 0))`,
    )
    const actor = await req.payload.findByID({
      collection: 'users',
      id: req.user!.id,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!actor.roles?.includes('admin')) {
      await req.payload.db.rollbackTransaction(transactionID)
      return Response.json({ code: 'forbidden' }, { status: 403 })
    }
    const settlement = await req.payload.findByID({
      collection: 'supplier-settlements',
      id: settlementID,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (settlement.status === 'approved') {
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ approved: true, alreadyApproved: true })
    }
    if (
      settlement.status !== 'draft' ||
      settlement.currency !== 'ARS' ||
      !Number.isSafeInteger(settlement.amountMinor) ||
      settlement.amountMinor <= 0 ||
      settlement.outstandingMinor !== settlement.amountMinor
    ) {
      await req.payload.db.rollbackTransaction(transactionID)
      return Response.json({ code: 'state' }, { status: 409 })
    }
    await req.payload.update({
      collection: 'supplier-settlements',
      id: settlementID,
      data: {
        status: 'approved',
        approvedBy: actor.id,
        approvedAt: new Date().toISOString(),
      },
      overrideAccess: true,
      req,
    })
    await req.payload.db.commitTransaction(transactionID)
    return Response.json({ approved: true })
  } catch {
    await req.payload.db.rollbackTransaction(transactionID)
    req.payload.logger.error({
      msg: 'No se pudo aprobar la liquidación del proveedor.',
      settlementID,
    })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
  }
}
