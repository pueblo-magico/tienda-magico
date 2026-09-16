import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import {
  APIError,
  type CollectionBeforeOperationHook,
  type CollectionBeforeDeleteHook,
  type PayloadRequest,
} from 'payload'

export async function activeTransaction(req: PayloadRequest) {
  if (req.payload.db.name !== 'postgres' || !req.transactionID)
    throw new APIError('Se requiere una transacción PostgreSQL activa.', 503)
  const adapter = req.payload.db as unknown as PostgresAdapter
  const transaction = adapter.sessions[await req.transactionID]?.db
  if (!transaction) throw new APIError('No hay una transacción activa.', 503)
  return transaction
}

export const lockTransferWrite: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (operation !== 'update' && operation !== 'delete') return args
  const { req, collection } = args
  const id = 'id' in args ? args.id : undefined
  if (typeof id !== 'string' && typeof id !== 'number') {
    req.context.transferBulkWrite = true
    return args
  }
  const transaction = await activeTransaction(req)
  const table = collection.config.slug === 'orders' ? 'orders' : 'local_sales'
  await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
  await transaction.execute(
    sql`SELECT id FROM ${sql.identifier(table)} WHERE id = ${id} FOR UPDATE`,
  )
  return args
}

export const protectTransferDeletion: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  const transaction = await activeTransaction(req)
  const table = collection.slug === 'orders' ? 'orders' : 'local_sales'
  const result = await transaction.execute(
    sql`SELECT payment_method FROM ${sql.identifier(table)} WHERE id = ${id} FOR UPDATE`,
  )
  if (result.rows[0]?.payment_method === 'bank-transfer')
    throw new APIError(
      'Los registros de transferencia se conservan para auditoría; no se pueden eliminar.',
      403,
    )
}
