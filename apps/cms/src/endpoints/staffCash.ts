import { logoutOperation, type Endpoint, type PayloadRequest } from 'payload'
import {
  authorizeCashStaff,
  cashStaffAuthority,
  CASH_STAFF_EMAIL,
  CASH_STAFF_SESSION_SECONDS,
} from '../utilities/cashStaffAccess'
import { cashConfirmationInput, confirmCash } from '../utilities/confirmCash'

const response = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function allowedOrigin(req: PayloadRequest) {
  const origin = req.headers.get('origin')
  return Boolean(
    origin &&
    (origin === new URL(req.payload.config.serverURL).origin ||
      req.payload.config.csrf.includes(origin)),
  )
}

async function cashOrder(req: PayloadRequest) {
  const reference = req.routeParams?.reference
  if (
    typeof reference !== 'string' ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(reference)
  )
    return null
  return (
    (
      await req.payload.find({
        collection: 'orders',
        where: {
          and: [
            { publicReference: { equals: reference } },
            { paymentMethod: { equals: 'cash' } },
            { fulfillmentMode: { equals: 'local_collection' } },
          ],
        },
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
      })
    ).docs[0] ?? null
  )
}

function protectedHandler(handler: Endpoint['handler'], mutate = false): Endpoint['handler'] {
  return async (req) => {
    if (mutate && !allowedOrigin(req)) return response({ code: 'origin' }, 403)
    try {
      if (!(await authorizeCashStaff(req))) return response({ code: 'unauthorized' }, 401)
      return await handler(req)
    } catch {
      return response({ code: 'unavailable' }, 503)
    }
  }
}

export const staffCashEndpoints: Endpoint[] = [
  {
    path: '/storefront-staff/login',
    method: 'post',
    handler: async (req) => {
      if (!allowedOrigin(req)) return response({ code: 'origin' }, 403)
      try {
        const input: unknown = await req.json?.()
        if (
          !input ||
          typeof input !== 'object' ||
          !('password' in input) ||
          typeof input.password !== 'string' ||
          input.password.length < 1 ||
          input.password.length > 128
        )
          return response({ code: 'unauthorized' }, 401)
        const result = await req.payload.login({
          collection: 'users',
          data: { email: CASH_STAFF_EMAIL, password: input.password },
          req,
          context: { cashStaffAuthority },
          depth: 0,
        })
        if (!result.token) return response({ code: 'unauthorized' }, 401)
        return response({ token: result.token, expiresIn: CASH_STAFF_SESSION_SECONDS })
      } catch {
        return response({ code: 'unauthorized' }, 401)
      }
    },
  },
  {
    path: '/storefront-staff/session',
    method: 'get',
    handler: protectedHandler(async () => response({ authenticated: true })),
  },
  {
    path: '/storefront-staff/logout',
    method: 'post',
    handler: protectedHandler(async (req) => {
      await logoutOperation({ collection: req.payload.collections.users, req })
      return response({ success: true })
    }, true),
  },
  {
    path: '/storefront-staff/orders/:reference',
    method: 'get',
    handler: protectedHandler(async (req) => {
      const order = await cashOrder(req)
      if (!order) return response({ code: 'notFound' }, 404)
      const buyer = order.buyerContact
      const buyerName =
        buyer &&
        typeof buyer === 'object' &&
        !Array.isArray(buyer) &&
        typeof buyer.name === 'string'
          ? buyer.name
          : null
      return response({
        order: {
          reference: order.publicReference,
          amount: order.amount,
          currency: order.currency,
          status: order.paymentStatus,
          buyerName,
        },
      })
    }),
  },
  {
    path: '/storefront-staff/orders/:reference/confirm',
    method: 'post',
    handler: protectedHandler(async (req) => {
      const order = await cashOrder(req)
      if (!order) return response({ code: 'notFound' }, 404)
      let input
      try {
        input = cashConfirmationInput(await req.json?.())
      } catch {
        return response({ code: 'invalid' }, 400)
      }
      return confirmCash(req, input, order.id)
    }, true),
  },
]
