import type { Endpoint, PayloadRequest } from 'payload'
import { confirmTransfer } from './confirmTransfer'
import { normalizeTransferIdentification } from './transferIdentification'

export const reconcileTransferEndpoint: Endpoint = {
  path: '/reconcile',
  method: 'post',
  handler: async (req) => {
    try {
      return await reconcileTransfer(req)
    } catch {
      return Response.json({ code: 'unavailable' }, { status: 503 })
    }
  },
}

async function reconcileTransfer(req: PayloadRequest): Promise<Response> {
  if (
    !req.user ||
    !('_strategy' in req.user) ||
    req.user._strategy !== 'api-key' ||
    !req.user.roles?.includes('admin')
  )
    return Response.json({ code: 'forbidden' }, { status: 403 })
  const actor = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    depth: 0,
    overrideAccess: true,
  })
  if (!actor.roles?.includes('admin')) return Response.json({ code: 'forbidden' }, { status: 403 })
  let body: unknown
  try {
    body = await req.json?.()
  } catch {
    return Response.json({ code: 'invalid' }, { status: 400 })
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('idempotencyKey' in body) ||
    typeof body.idempotencyKey !== 'string' ||
    !/^[a-f0-9]{64}$/.test(body.idempotencyKey)
  )
    return Response.json({ code: 'invalid' }, { status: 400 })
  const result = await req.payload.find({
    collection: 'payment-notifications',
    where: { idempotencyKey: { equals: body.idempotencyKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const notification = result.docs[0]
  if (!notification) return Response.json({ code: 'missing' }, { status: 404 })
  if (notification.reconciliation) return Response.json({ reconciled: true })
  const identification = normalizeTransferIdentification({
    type: notification.payerType,
    number: notification.payerNumber,
  })
  let outcome = 'manual_review:insufficient_evidence'
  if (
    notification.paymentStatus === 'approved' &&
    notification.statusDetail === 'accredited' &&
    notification.paymentType === 'bank_transfer' &&
    notification.refundedAmount === 0 &&
    Number.isSafeInteger(notification.amount) &&
    notification.amount > 0 &&
    notification.currency === 'ARS' &&
    notification.approvedAt &&
    Date.parse(notification.approvedAt) <= Date.parse(notification.providerUpdatedAt) &&
    Date.parse(notification.approvedAt) <= Date.now() &&
    identification
  ) {
    const response = await confirmTransfer(
      req,
      { reference: notification.resourceId, amount: notification.amount, acceptLate: false },
      undefined,
      {
        payerType: identification.type,
        payerNumber: identification.number,
        amount: notification.amount,
        currency: notification.currency,
        publicReference: notification.publicReference ?? null,
        approvedAt: notification.approvedAt,
        idempotencyKey: notification.idempotencyKey,
        providerUpdatedAt: notification.providerUpdatedAt,
      },
    )
    if (response.status >= 500) return response
    const confirmation = await response.json()
    outcome = response.ok ? 'confirmed' : `manual_review:${confirmation.code}`
  }
  await req.payload.update({
    collection: 'payment-notifications',
    id: notification.id,
    data: { reconciliation: outcome },
    overrideAccess: true,
  })
  return Response.json({ reconciled: true })
}
