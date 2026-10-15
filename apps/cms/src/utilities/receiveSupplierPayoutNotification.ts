import type { Endpoint, PayloadRequest } from 'payload'

import {
  SupplierPayoutProviderError,
  type SupplierPayoutProvider,
} from '../lib/supplierFinance/payoutProvider'
import { resolveConfiguredSupplierPayoutProvider } from '../lib/supplierFinance/supplierPayoutProviders'
import { reconcileSupplierPayout } from './reconcileSupplierPayout'

type NotificationDependencies = {
  resolveProvider: (provider: string) => SupplierPayoutProvider
  reconcile: (
    req: PayloadRequest,
    payoutID: number,
    provider: SupplierPayoutProvider,
  ) => Promise<Response>
}

const defaultDependencies: NotificationDependencies = {
  resolveProvider: resolveConfiguredSupplierPayoutProvider,
  reconcile: (req, payoutID, provider) =>
    reconcileSupplierPayout(req, payoutID, () => provider, 'system'),
}

export const receiveSupplierPayoutNotificationEndpoint: Endpoint = {
  path: '/webhooks/mercado-pago',
  method: 'post',
  handler: receiveSupplierPayoutNotification,
}

export async function receiveSupplierPayoutNotification(
  req: PayloadRequest,
  dependencies: NotificationDependencies = defaultDependencies,
): Promise<Response> {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return Response.json({ received: false }, { status: 415 })
  const contentLength = req.headers.get('content-length')
  if (contentLength && (!/^\d{1,6}$/.test(contentLength) || Number(contentLength) > 16_384))
    return Response.json({ received: false }, { status: 413 })

  let provider: SupplierPayoutProvider
  let notification
  try {
    provider = dependencies.resolveProvider('mercado-pago')
    if (provider.id !== 'mercado-pago' || !provider.capabilities.notifications)
      throw new SupplierPayoutProviderError('configuration')
    const body = await req.json?.()
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 16_384)
      return Response.json({ received: false }, { status: 413 })
    notification = provider.parseNotification(body)
  } catch (error) {
    if (error instanceof SupplierPayoutProviderError) {
      const status = error.code === 'invalid' ? 400 : 503
      return Response.json({ received: false }, { status })
    }
    return Response.json({ received: false }, { status: 400 })
  }

  const payouts = await req.payload.find({
    collection: 'supplier-payouts',
    where: {
      and: [
        { providerPayoutId: { equals: notification.payoutID } },
        { providerTransactionId: { equals: notification.transactionID } },
        { paymentMethod: { equals: 'mercado-pago' } },
      ],
    },
    limit: 2,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (
    payouts.docs.length !== 1 ||
    notification.externalReference !== `supplier_payout_${payouts.docs[0]?.id}`
  )
    return Response.json({ received: true, matched: false })

  const result = await dependencies.reconcile(req, Number(payouts.docs[0].id), provider)
  if (!result.ok) return result
  const reconciliation = (await result.json()) as Record<string, unknown>
  return Response.json({ received: true, ...reconciliation })
}
