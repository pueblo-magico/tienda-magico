import { sql } from '@payloadcms/db-postgres'
import { isDeepStrictEqual } from 'node:util'
import { type Endpoint, type PayloadRequest } from 'payload'
import { deferredCatalogRevalidation, notifyStorefront } from '../hooks/revalidateStorefrontCatalog'
import { confirmOrderInventory } from './confirmOrderInventory'
import { paymentConfirmationAuthority } from './confirmTransfer'
import { TransferConfirmationError } from './transferConfirmationPolicy'
import { activeTransaction } from './transferWriteLock'

type CashConfirmationInput = { amount: number; received: true; note: string | null }

export function cashConfirmationInput(value: unknown): CashConfirmationInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TransferConfirmationError('invalid')
  const input = value as Record<string, unknown>
  const amount = input.amount
  if (
    typeof amount !== 'number' ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    input.received !== true
  )
    throw new TransferConfirmationError('invalid')
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 500) : ''
  return { amount, received: true, note: note || null }
}

export const confirmCashEndpoint: Endpoint = {
  path: '/:id/confirm-cash',
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
      const actor = await req.payload.findByID({
        collection: 'users',
        id: req.user.id,
        overrideAccess: true,
        depth: 0,
      })
      if (!actor.roles?.includes('admin'))
        return Response.json({ code: 'forbidden' }, { status: 403 })
    } catch {
      return Response.json({ code: 'forbidden' }, { status: 403 })
    }
    let input: CashConfirmationInput
    try {
      input = cashConfirmationInput(await req.json?.())
    } catch {
      return Response.json({ code: 'invalid' }, { status: 400 })
    }
    return confirmCash(req, input, id)
  },
}

export async function confirmCash(
  req: PayloadRequest,
  input: CashConfirmationInput,
  orderID: number,
): Promise<Response> {
  if (!req.user) return Response.json({ code: 'forbidden' }, { status: 403 })
  const transactionID = await req.payload.db.beginTransaction().catch(() => null)
  if (!transactionID) return Response.json({ code: 'unavailable' }, { status: 503 })
  req.transactionID = transactionID
  const previousContext = { ...req.context }
  try {
    const transaction = await activeTransaction(req)
    await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
    const initial = await req.payload.findByID({
      collection: 'orders',
      id: orderID,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (!initial.cartReference) throw new TransferConfirmationError('invalid')
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${initial.cartReference}`}, 0))`,
    )
    await transaction.execute(sql`SELECT id FROM orders WHERE id = ${orderID} FOR UPDATE`)
    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderID,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (order.paymentStatus === 'approved') {
      if (
        order.paymentMethod !== 'cash' ||
        !order.cashVerification ||
        order.amount !== input.amount
      )
        throw new TransferConfirmationError('state')
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ confirmed: true, alreadyConfirmed: true })
    }
    if (
      order.paymentMethod !== 'cash' ||
      order.fulfillmentMode !== 'local_collection' ||
      !['pending', 'unverified'].includes(order.paymentStatus) ||
      order.status !== 'processing'
    )
      throw new TransferConfirmationError('state')
    if (order.currency !== 'ARS' || order.amount !== input.amount)
      throw new TransferConfirmationError('amount')
    if (order.paymentExpiresAt && Date.parse(order.paymentExpiresAt) <= Date.now())
      throw new TransferConfirmationError('expired')
    if (!order.cartReference) throw new TransferConfirmationError('invalid')
    const duplicates = await req.payload.find({
      collection: 'orders',
      where: {
        and: [
          { cartReference: { equals: order.cartReference } },
          { paymentStatus: { equals: 'approved' } },
        ],
      },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (duplicates.docs.length) throw new TransferConfirmationError('duplicate')
    const sales = await req.payload.find({
      collection: 'localSales',
      where: { order: { equals: orderID } },
      limit: 2,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (sales.docs.length !== 1) throw new TransferConfirmationError('localSale')
    await transaction.execute(
      sql`SELECT id FROM local_sales WHERE id = ${sales.docs[0].id} FOR UPDATE`,
    )
    const sale = await req.payload.findByID({
      collection: 'localSales',
      id: sales.docs[0].id,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (
      sale.status !== 'pending_payment' ||
      !['pending', 'unverified'].includes(sale.paymentStatus) ||
      sale.paymentMethod !== 'cash' ||
      sale.fulfillmentMode !== 'local_collection' ||
      sale.idempotencyKey !== `local-sale:${orderID}` ||
      !isDeepStrictEqual(sale.snapshot, order.commercialSnapshot) ||
      sale.paymentEvidence
    )
      throw new TransferConfirmationError('localSale')
    req.context.catalogRevalidation = deferredCatalogRevalidation
    const inventory = await confirmOrderInventory(req, transaction, order)
    const verifiedAt = new Date().toISOString()
    await req.payload.update({
      collection: 'localSales',
      id: sales.docs[0].id,
      data: {
        status: 'paid',
        paymentStatus: 'approved',
        paymentEvidence: { order: orderID, method: 'cash', receivedAt: verifiedAt },
      },
      context: { paymentConfirmation: paymentConfirmationAuthority },
      req,
      overrideAccess: true,
    })
    await req.payload.update({
      collection: 'orders',
      id: orderID,
      data: {
        paymentStatus: 'approved',
        cashVerification: {
          verifiedBy: req.user.id,
          verifiedAt,
          amount: input.amount,
          currency: order.currency,
          note: input.note,
          stockMovements: inventory.movements,
        },
      },
      context: { paymentConfirmation: paymentConfirmationAuthority },
      req,
      overrideAccess: true,
    })
    await req.payload.db.commitTransaction(transactionID)
    await notifyStorefront('product', inventory.products, req.payload.logger)
    return Response.json({ confirmed: true })
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID)
    if (error instanceof TransferConfirmationError)
      return Response.json({ code: error.code }, { status: 409 })
    req.payload.logger.error({ msg: 'No se pudo confirmar el pago en efectivo.', orderID })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
    req.context = previousContext
  }
}
