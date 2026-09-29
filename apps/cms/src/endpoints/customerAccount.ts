import { logoutOperation, type Endpoint, type PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { activeTransaction } from '../utilities/transferWriteLock'
import { isCashStaff } from '../utilities/cashStaffAccess'

const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function customer(req: PayloadRequest) {
  if (!req.user || !('_sid' in req.user) || typeof req.user._sid !== 'string') return null
  const user = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (isCashStaff(user) || user.roles.length !== 1 || user.roles[0] !== 'customer') return null
  const sessionID = req.user._sid
  const session = user.sessions?.find((entry) => entry.id === sessionID)
  if (
    !session ||
    !Number.isFinite(Date.parse(session.expiresAt)) ||
    Date.parse(session.expiresAt) <= Date.now()
  )
    return null
  return user
}
function endpoint(
  path: string,
  method: 'get' | 'post',
  handler: (req: PayloadRequest, id: number) => Promise<Response>,
): Endpoint {
  return {
    path: `/storefront-customer/${path}`,
    method,
    handler: async (req) => {
      try {
        if (method === 'post') {
          const origin = req.headers.get('origin')
          if (!origin || !req.payload.config.csrf.includes(origin))
            return reply({ error: 'forbidden' }, 403)
        }
        const user = await customer(req)
        if (!user) return reply({ error: 'unauthorized' }, 401)
        return await handler(req, user.id)
      } catch {
        return reply({ error: 'unavailable' }, 503)
      }
    },
  }
}
export const customerAccountEndpoints: Endpoint[] = [
  endpoint('session', 'get', async (req, id) => {
    const user = await req.payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      req,
      overrideAccess: true,
    })
    return reply({ customer: { id, name: user.name ?? '', email: user.email } })
  }),
  endpoint('logout', 'post', async (req) => {
    await logoutOperation({ collection: req.payload.collections.users, req })
    return reply({ ok: true })
  }),
  endpoint('references', 'get', async (req, id) => {
    const references = new Set<string>()
    let page = 1
    while (true) {
      const orders = await req.payload.find({
        collection: 'orders',
        where: { customer: { equals: id } },
        depth: 0,
        limit: 100,
        page,
        overrideAccess: true,
        req,
      })
      for (const order of orders.docs) if (order.cartReference) references.add(order.cartReference)
      if (!orders.hasNextPage) break
      page++
    }
    return reply({ references: [...references] })
  }),
  endpoint('link', 'post', async (req, id) => {
    const input: unknown = await req.json?.()
    if (
      !input ||
      typeof input !== 'object' ||
      !('references' in input) ||
      !Array.isArray(input.references) ||
      input.references.length > 20 ||
      !input.references.every(
        (value) => typeof value === 'string' && /^[1-9]\d*::[a-f0-9]{40}$/.test(value),
      )
    )
      return reply({ error: 'invalid' }, 400)
    const transactionID = await req.payload.db.beginTransaction()
    if (!transactionID) return reply({ error: 'unavailable' }, 503)
    const previous = req.transactionID
    req.transactionID = transactionID
    try {
      const transaction = await activeTransaction(req)
      await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
      for (const reference of [...new Set(input.references as string[])].sort()) {
        await transaction.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${reference}`}, 0))`,
        )
        await transaction.execute(sql`UPDATE orders SET customer_id = ${id}
          WHERE cart_reference = ${reference} AND customer_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM orders AS owned
            WHERE owned.cart_reference = ${reference} AND owned.customer_id <> ${id})`)
      }
      await req.payload.db.commitTransaction(transactionID)
      return reply({ ok: true })
    } catch {
      await req.payload.db.rollbackTransaction(transactionID)
      return reply({ error: 'unavailable' }, 503)
    } finally {
      req.transactionID = previous
    }
  }),
]
