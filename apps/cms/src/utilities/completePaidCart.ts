import { sql } from '@payloadcms/db-postgres'
import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type PayloadRequest,
} from 'payload'
import { activeTransaction } from './transferWriteLock'

export const completePaidCart: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc.paymentStatus !== 'approved' || typeof doc.cartReference !== 'string') return doc
  const [id, secret, extra] = doc.cartReference.split('::')
  if (!/^[1-9]\d*$/.test(id) || !secret || extra !== undefined) return doc
  const transaction = await activeTransaction(req)
  await transaction.execute(sql`
    UPDATE carts SET purchased_at = COALESCE(purchased_at, NOW()), updated_at = NOW()
    WHERE id = ${id} AND secret = ${secret} AND purchased_at IS NULL
  `)
  return doc
}

async function assertActiveCart(req: PayloadRequest, id: string | number) {
  const transaction = await activeTransaction(req)
  const result = await transaction.execute(
    sql`SELECT purchased_at FROM carts WHERE id = ${id} FOR UPDATE`,
  )
  if (result.rows[0]?.purchased_at)
    throw new APIError('Este carrito ya está pagado. Iniciá una nueva compra.', 409)
}

export const protectCompletedCart: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (data.purchasedAt != null && data.purchasedAt !== originalDoc?.purchasedAt)
    throw new APIError('El carrito se completa únicamente al confirmar el pago.', 403)
  if (originalDoc?.id) await assertActiveCart(req, originalDoc.id)
  return data
}

export const preserveCompletedCart: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await assertActiveCart(req, id)
}
