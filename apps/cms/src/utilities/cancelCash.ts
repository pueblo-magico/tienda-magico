import { sql } from '@payloadcms/db-postgres'
import { type Endpoint } from 'payload'
import { activeTransaction } from './transferWriteLock'
import { paymentConfirmationAuthority } from './confirmTransfer'
import { isDeepStrictEqual } from 'node:util'
import { TransferConfirmationError } from './transferConfirmationPolicy'

export const cancelCashEndpoint: Endpoint = {
  path: '/:id/cancel-cash',
  method: 'post',
  handler: async (req) => {
    if (!req.user?.roles?.includes('admin'))
      return Response.json({ code: 'forbidden' }, { status: 403 })
    if (
      !req.headers.get('authorization')?.includes(' API-Key ') &&
      (!req.payload.config.serverURL ||
        req.headers.get('origin') !== new URL(req.payload.config.serverURL).origin)
    )
      return Response.json({ code: 'origin' }, { status: 403 })
    const id = Number(req.routeParams?.id)
    if (!Number.isSafeInteger(id) || id <= 0)
      return Response.json({ code: 'invalid' }, { status: 400 })
    const actor = await req.payload
      .findByID({ collection: 'users', id: req.user.id, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!actor?.roles?.includes('admin'))
      return Response.json({ code: 'forbidden' }, { status: 403 })
    const transactionID = await req.payload.db.beginTransaction().catch(() => null)
    if (!transactionID) return Response.json({ code: 'unavailable' }, { status: 503 })
    req.transactionID = transactionID
    const previousContext = { ...req.context }
    try {
      const transaction = await activeTransaction(req)
      await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
      const initial = await req.payload.findByID({
        collection: 'orders',
        id,
        req,
        depth: 0,
        overrideAccess: true,
      })
      if (!initial.cartReference) throw new TransferConfirmationError('state')
      await transaction.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${initial.cartReference}`}, 0))`,
      )
      await transaction.execute(sql`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`)
      const order = await req.payload.findByID({
        collection: 'orders',
        id,
        req,
        depth: 0,
        overrideAccess: true,
      })
      if (order.paymentMethod !== 'cash') throw new TransferConfirmationError('state')
      if (order.paymentStatus === 'cancelled') {
        await req.payload.db.commitTransaction(transactionID)
        return Response.json({ cancelled: true })
      }
      if (
        order.paymentStatus !== 'pending' ||
        order.status !== 'processing' ||
        order.cashVerification
      )
        throw new TransferConfirmationError('state')
      const sales = await req.payload.find({
        collection: 'localSales',
        where: { order: { equals: id } },
        limit: 2,
        depth: 0,
        req,
        overrideAccess: true,
      })
      if (sales.docs.length !== 1) throw new TransferConfirmationError('state')
      await transaction.execute(
        sql`SELECT id FROM local_sales WHERE id = ${sales.docs[0].id} FOR UPDATE`,
      )
      const sale = await req.payload.findByID({
        collection: 'localSales',
        id: sales.docs[0].id,
        req,
        depth: 0,
        overrideAccess: true,
      })
      if (
        sale.paymentMethod !== 'cash' ||
        sale.paymentStatus !== 'pending' ||
        sale.status !== 'pending_payment' ||
        sale.paymentEvidence ||
        sale.idempotencyKey !== `local-sale:${id}` ||
        !isDeepStrictEqual(sale.snapshot, order.commercialSnapshot)
      )
        throw new TransferConfirmationError('state')
      const context = { paymentConfirmation: paymentConfirmationAuthority }
      await req.payload.update({
        collection: 'orders',
        id,
        data: { paymentStatus: 'cancelled' },
        context,
        req,
        overrideAccess: true,
      })
      await req.payload.update({
        collection: 'localSales',
        id: sale.id,
        data: { paymentStatus: 'cancelled', status: 'cancelled' },
        context,
        req,
        overrideAccess: true,
      })
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ cancelled: true })
    } catch (error) {
      await req.payload.db.rollbackTransaction(transactionID)
      if (error instanceof TransferConfirmationError)
        return Response.json({ code: error.code }, { status: 409 })
      req.payload.logger.error({ msg: 'No se pudo cancelar el pedido en efectivo.', orderID: id })
      return Response.json({ code: 'unavailable' }, { status: 503 })
    } finally {
      delete req.transactionID
      req.context = previousContext
    }
  },
}
