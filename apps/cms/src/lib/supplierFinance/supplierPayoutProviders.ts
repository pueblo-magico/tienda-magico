import {
  SupplierPayoutProviderError,
  type SupplierPayoutProvider,
  type SupplierPayoutNotification,
  type SupplierPayoutRequest,
  type SupplierPayoutStatus,
} from './payoutProvider'
import { getMercadoPagoPayoutStatus, submitMercadoPagoPayout } from './mercadoPagoPayouts'

type MercadoPagoProviderOptions = {
  accessToken: string
  testMode: true
  notificationURL?: string
  fetch?: typeof fetch
}

type SupplierPayoutEnvironment = {
  [key: string]: string | undefined
  MERCADOPAGO_PAYOUTS_ACCESS_TOKEN?: string
  MERCADOPAGO_PAYOUTS_TEST_MODE?: string
  MERCADOPAGO_PAYOUTS_WEBHOOK_URL?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const providerIDPattern = /^[A-Za-z0-9_-]{3,100}$/
const externalReferencePattern = /^[A-Za-z0-9_-]{1,50}$/
const providerStatusPattern = /^[a-z_]{1,50}$/

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function parsePayoutNotification(input: unknown): SupplierPayoutNotification {
  const value = object(input)
  const payout = object(value.payout)
  const transactionID = value.id
  const payoutID = payout.id
  const externalReference = value.external_reference
  const payoutExternalReference = payout.external_reference
  const providerStatus = value.status
  const providerStatusDetail = value.status_detail ?? null
  const updatedAt = value.last_updated_date
  if (
    typeof transactionID !== 'string' ||
    !providerIDPattern.test(transactionID) ||
    typeof payoutID !== 'string' ||
    !providerIDPattern.test(payoutID) ||
    typeof externalReference !== 'string' ||
    !externalReferencePattern.test(externalReference) ||
    payoutExternalReference !== externalReference ||
    typeof providerStatus !== 'string' ||
    !providerStatusPattern.test(providerStatus) ||
    (providerStatusDetail !== null &&
      (typeof providerStatusDetail !== 'string' ||
        !providerStatusPattern.test(providerStatusDetail))) ||
    typeof updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(updatedAt))
  )
    throw new SupplierPayoutProviderError('invalid')
  return {
    payoutID,
    transactionID,
    externalReference,
    providerStatus,
    providerStatusDetail,
    occurredAt: new Date(updatedAt).toISOString(),
  }
}

function validateEmailRecipient(recipient: SupplierPayoutRequest['recipient']): void {
  if (recipient.kind !== 'email' || !emailPattern.test(recipient.value))
    throw new SupplierPayoutProviderError('invalid')
}

export function createMercadoPagoPayoutProvider(
  options: MercadoPagoProviderOptions,
): SupplierPayoutProvider {
  return {
    id: 'mercado-pago',
    capabilities: {
      submit: true,
      queryStatus: true,
      notifications: true,
      cancel: false,
    },
    validateRecipient: validateEmailRecipient,
    async submit(request) {
      validateEmailRecipient(request.recipient)
      return submitMercadoPagoPayout(
        {
          externalReference: request.externalReference,
          description: request.description,
          recipientEmail: request.recipient.value,
          amountMinor: request.amountMinor,
          currency: request.currency,
          notificationURL: request.notificationURL ?? options.notificationURL,
        },
        {
          accessToken: options.accessToken,
          idempotencyKey: request.idempotencyKey,
          testMode: options.testMode,
          fetch: options.fetch,
        },
      )
    },
    getStatus(input) {
      return getMercadoPagoPayoutStatus(input, options)
    },
    parseNotification: parsePayoutNotification,
  }
}

const unsupportedOperation = async (): Promise<never> => {
  throw new SupplierPayoutProviderError('unsupported')
}

const unsupportedNotification = (): never => {
  throw new SupplierPayoutProviderError('unsupported')
}

export function createManualPayoutProvider(): SupplierPayoutProvider {
  return {
    id: 'manual',
    capabilities: {
      submit: false,
      queryStatus: false,
      notifications: false,
      cancel: false,
    },
    validateRecipient: validateEmailRecipient,
    submit: unsupportedOperation,
    getStatus: unsupportedOperation,
    parseNotification: unsupportedNotification,
  }
}

export function createFakePayoutProvider(options?: {
  status?: SupplierPayoutStatus['status']
}): SupplierPayoutProvider {
  const submissions = new Map<string, Awaited<ReturnType<SupplierPayoutProvider['submit']>>>()
  const requests = new Map<string, SupplierPayoutRequest>()
  const status = options?.status ?? 'processing'
  return {
    id: 'fake',
    capabilities: {
      submit: true,
      queryStatus: true,
      notifications: true,
      cancel: false,
    },
    validateRecipient: validateEmailRecipient,
    async submit(request) {
      validateEmailRecipient(request.recipient)
      const existing = submissions.get(request.idempotencyKey)
      if (existing) return existing
      const suffix = String(submissions.size + 1).padStart(4, '0')
      const submission = {
        provider: 'fake' as const,
        payoutID: `FAKE-PAYOUT-${suffix}`,
        transactionID: `FAKE-TRANSACTION-${suffix}`,
        status: 'submitted' as const,
        providerStatus: 'created',
      }
      submissions.set(request.idempotencyKey, submission)
      requests.set(request.idempotencyKey, request)
      return submission
    },
    async getStatus(input) {
      const known = [...submissions.entries()].find(
        ([, submission]) =>
          submission.payoutID === input.payoutID &&
          submission.transactionID === input.transactionID,
      )
      if (!known) throw new SupplierPayoutProviderError('provider')
      const request = requests.get(known[0])
      if (!request) throw new SupplierPayoutProviderError('provider')
      return {
        status,
        providerStatus: status === 'succeeded' ? 'success' : status,
        providerStatusDetail: status === 'succeeded' ? 'accredited' : null,
        externalReference: request.externalReference,
        amountMinor: request.amountMinor,
        currency: request.currency,
      }
    },
    parseNotification: parsePayoutNotification,
  }
}

export function resolveConfiguredSupplierPayoutProvider(
  provider: string,
  environment: SupplierPayoutEnvironment = process.env,
): SupplierPayoutProvider {
  if (provider === 'manual') return createManualPayoutProvider()
  if (provider !== 'mercado-pago') throw new SupplierPayoutProviderError('configuration')
  const accessToken = environment.MERCADOPAGO_PAYOUTS_ACCESS_TOKEN?.trim()
  if (!accessToken || environment.MERCADOPAGO_PAYOUTS_TEST_MODE !== 'true')
    throw new SupplierPayoutProviderError('configuration')
  return createMercadoPagoPayoutProvider({
    accessToken,
    testMode: true,
    notificationURL: environment.MERCADOPAGO_PAYOUTS_WEBHOOK_URL?.trim() || undefined,
  })
}
