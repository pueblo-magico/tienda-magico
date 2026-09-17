import { sql } from '@payloadcms/db-postgres'
import { isDeepStrictEqual } from 'node:util'
import {
  APIError,
  type CollectionBeforeChangeHook,
  type Endpoint,
  type PayloadRequest,
} from 'payload'
import { selectTransferOrder } from './transferMatching'
import {
  confirmationInput,
  TransferConfirmationError,
  validateTransfer,
} from './transferConfirmationPolicy'
import { confirmOrderInventory } from './confirmOrderInventory'
import { deferredCatalogRevalidation, notifyStorefront } from '../hooks/revalidateStorefrontCatalog'
import { activeTransaction } from './transferWriteLock'

const confirmationAuthority = Symbol('transfer-confirmation')
const protectedFields = [
  'status',
  'paymentStatus',
  'transferVerification',
  'transferBankReference',
  'items',
  'amount',
  'currency',
  'commercialSnapshot',
  'cartReference',
  'paymentMethod',
  'paymentExpiresAt',
  'fulfillmentMode',
  'checkoutKey',
  'publicReference',
  'transferIdentification',
]

export const protectTransfer: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (req.context.transferConfirmation === confirmationAuthority) return data
  if (operation === 'create') {
    if (
      data.transferVerification ||
      data.transferBankReference ||
      (data.paymentMethod === 'bank-transfer' && data.paymentStatus !== 'pending')
    )
      throw new APIError('La transferencia debe crearse pendiente de verificación.', 400)
  } else if (
    originalDoc.paymentMethod === 'bank-transfer' ||
    data.paymentMethod === 'bank-transfer'
  ) {
    if (req.context.transferBulkWrite)
      throw new APIError('Actualizá las transferencias individualmente.', 400)
    for (const field of protectedFields) {
      if (
        data[field] !== undefined &&
        JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field])
      )
        throw new APIError(
          'Usá la acción de verificación para confirmar una transferencia. Los datos del pedido son inmutables.',
          403,
        )
    }
  }
  return data
}

export const protectLocalTransfer: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (req.context.transferConfirmation === confirmationAuthority) return data
  if (
    operation === 'create' &&
    data.paymentMethod === 'bank-transfer' &&
    (data.paymentStatus !== 'pending' || data.status !== 'pending_payment' || data.paymentEvidence)
  )
    throw new APIError('La venta local debe crearse pendiente de pago.', 403)
  if (
    operation === 'update' &&
    (originalDoc.paymentMethod === 'bank-transfer' || data.paymentMethod === 'bank-transfer')
  ) {
    if (req.context.transferBulkWrite)
      throw new APIError('Actualizá las transferencias individualmente.', 400)
    for (const field of [
      'order',
      'status',
      'paymentStatus',
      'paymentMethod',
      'snapshot',
      'paymentEvidence',
    ]) {
      if (
        data[field] !== undefined &&
        JSON.stringify(data[field]) !== JSON.stringify(originalDoc[field])
      )
        throw new APIError('Confirmá la transferencia desde el pedido vinculado.', 403)
    }
  }
  return data
}

export const confirmTransferEndpoint: Endpoint = {
  path: '/:id/confirm-transfer',
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
    let input: ReturnType<typeof confirmationInput>
    try {
      input = confirmationInput(await req.json?.())
    } catch {
      return Response.json({ code: 'invalid' }, { status: 400 })
    }
    return confirmTransfer(req, input, id)
  },
}

export async function confirmTransfer(
  req: PayloadRequest,
  input: ReturnType<typeof confirmationInput>,
  orderID?: number,
  matching?: Parameters<typeof selectTransferOrder>[1] & {
    idempotencyKey: string
    providerUpdatedAt: string
  },
): Promise<Response> {
  let id = orderID
  if (!req.user) return Response.json({ code: 'forbidden' }, { status: 403 })
  let transactionID
  try {
    transactionID = await req.payload.db.beginTransaction()
  } catch {
    return Response.json({ code: 'unavailable' }, { status: 503 })
  }
  if (!transactionID) return Response.json({ code: 'unavailable' }, { status: 503 })
  req.transactionID = transactionID
  const previousContext = { ...req.context }
  try {
    const transaction = await activeTransaction(req)
    await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`transfer:${input.reference}`}, 0))`,
    )
    if (matching) {
      const superseding = await req.payload.find({
        collection: 'payment-notifications',
        where: {
          and: [
            { resourceId: { equals: input.reference } },
            { idempotencyKey: { not_equals: matching.idempotencyKey } },
            { providerUpdatedAt: { greater_than_equal: matching.providerUpdatedAt } },
          ],
        },
        limit: 1,
        depth: 0,
        req,
        overrideAccess: true,
      })
      if (superseding.docs.length) throw new TransferConfirmationError('superseded_notification')
      await transaction.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`payer:${matching.payerType}:${matching.payerNumber}`}, 0))`,
      )
      const candidates = await transaction.execute(
        sql`SELECT id FROM orders WHERE transfer_identification->>'type' = ${matching.payerType} AND transfer_identification->>'number' = ${matching.payerNumber} LIMIT 101`,
      )
      if (candidates.rows.length > 100) throw new TransferConfirmationError('ambiguous')
      const orders = await Promise.all(
        candidates.rows.map((row) =>
          req.payload.findByID({
            collection: 'orders',
            id: Number(row.id),
            depth: 0,
            req,
            overrideAccess: true,
          }),
        ),
      )
      id = selectTransferOrder(orders, matching) ?? undefined
      if (!id) throw new TransferConfirmationError('unmatched_or_ambiguous')
    }
    if (!id) throw new TransferConfirmationError('invalid')
    await transaction.execute(sql`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`)
    const order = await req.payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (order.paymentStatus === 'approved') {
      if (
        order.paymentMethod !== 'bank-transfer' ||
        !order.transferVerification ||
        order.transferBankReference !== input.reference ||
        order.amount !== input.amount
      )
        throw new TransferConfirmationError('state')
      await req.payload.db.commitTransaction(transactionID)
      return Response.json({ confirmed: true, alreadyConfirmed: true })
    }
    const late = validateTransfer(order, input, Date.now())
    if (!order.cartReference) throw new TransferConfirmationError('invalid')
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${order.cartReference}`}, 0))`,
    )
    const duplicates = await req.payload.find({
      collection: 'orders',
      where: {
        or: [
          { transferBankReference: { equals: input.reference } },
          {
            and: [
              { cartReference: { equals: order.cartReference } },
              { paymentStatus: { equals: 'approved' } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (duplicates.docs.length) throw new TransferConfirmationError('duplicate')
    req.context.catalogRevalidation = deferredCatalogRevalidation
    const inventory = await confirmOrderInventory(req, transaction, order)
    const verification = {
      verifiedBy: req.user.id,
      verifiedAt: new Date().toISOString(),
      amount: input.amount,
      currency: order.currency,
      late,
      method: matching ? 'mercado-pago' : 'manual',
      reason: matching
        ? 'verified_payer_transfer'
        : late
          ? 'manual_late_transfer_confirmation'
          : 'manual_transfer_confirmation',
      fulfillmentMode: order.fulfillmentMode,
      stockMovements: inventory.movements,
    }
    if (order.fulfillmentMode === 'local_collection') {
      const sales = await req.payload.find({
        collection: 'localSales',
        where: { order: { equals: id } },
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
        sale.paymentMethod !== order.paymentMethod ||
        sale.fulfillmentMode !== order.fulfillmentMode ||
        sale.idempotencyKey !== `local-sale:${id}` ||
        !isDeepStrictEqual(sale.snapshot, order.commercialSnapshot) ||
        sale.paymentEvidence
      )
        throw new TransferConfirmationError('localSale')
      await req.payload.update({
        collection: 'localSales',
        id: sales.docs[0].id,
        data: {
          status: 'paid',
          paymentStatus: 'approved',
          paymentEvidence: { order: id, method: matching ? 'mercado-pago' : 'manual' },
        },
        context: { transferConfirmation: confirmationAuthority },
        req,
        overrideAccess: true,
      })
    }
    await req.payload.update({
      collection: 'orders',
      id,
      data: {
        paymentStatus: 'approved',
        transferBankReference: input.reference,
        transferVerification: verification,
      },
      context: { transferConfirmation: confirmationAuthority },
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
    req.payload.logger.error({ msg: 'No se pudo confirmar la transferencia.', orderID: id })
    return Response.json({ code: 'unavailable' }, { status: 500 })
  } finally {
    delete req.transactionID
    req.context = previousContext
  }
}
