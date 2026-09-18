import { sql } from '@payloadcms/db-postgres'
import { isDeepStrictEqual } from 'node:util'
import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { paymentConfirmationAuthority } from './confirmTransfer'
import { activeTransaction } from './transferWriteLock'

export const replacePendingCash: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || data.paymentMethod !== 'cash') return data
  if (typeof data.cartReference !== 'string' || !data.cartReference)
    throw new APIError('El pedido requiere un carrito válido.', 400)
  const transaction = await activeTransaction(req)
  await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${data.cartReference}`}, 0))`,
  )
  const paid = await req.payload.find({
    collection: 'orders',
    where: {
      and: [
        { cartReference: { equals: data.cartReference } },
        { paymentStatus: { equals: 'approved' } },
      ],
    },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })
  if (paid.docs.length) throw new APIError('Este carrito ya tiene un pago confirmado.', 409)
  const pending = await req.payload.find({
    collection: 'orders',
    where: {
      and: [
        { cartReference: { equals: data.cartReference } },
        { paymentMethod: { equals: 'cash' } },
        { paymentStatus: { in: ['pending', 'unverified'] } },
      ],
    },
    pagination: false,
    depth: 0,
    req,
    overrideAccess: true,
  })
  const context = { paymentConfirmation: paymentConfirmationAuthority }
  for (const order of pending.docs) {
    if (order.paymentStatus !== 'pending')
      throw new APIError('El pedido anterior necesita revisión antes de reemplazarlo.', 409)
    const sales = await req.payload.find({
      collection: 'localSales',
      where: { order: { equals: order.id } },
      limit: 2,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (
      sales.docs.length !== 1 ||
      sales.docs[0].paymentStatus !== 'pending' ||
      sales.docs[0].status !== 'pending_payment' ||
      sales.docs[0].paymentMethod !== 'cash' ||
      sales.docs[0].idempotencyKey !== `local-sale:${order.id}` ||
      !isDeepStrictEqual(sales.docs[0].snapshot, order.commercialSnapshot) ||
      sales.docs[0].paymentEvidence
    )
      throw new APIError('La venta local anterior necesita revisión.', 409)
    const previousContext = { ...req.context }
    try {
      await req.payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentStatus: 'cancelled' },
        context,
        req,
        overrideAccess: true,
      })
      await req.payload.update({
        collection: 'localSales',
        id: sales.docs[0].id,
        data: { paymentStatus: 'cancelled', status: 'cancelled' },
        context,
        req,
        overrideAccess: true,
      })
    } finally {
      req.context = previousContext
    }
  }
  return data
}
