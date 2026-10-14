import {
  SupplierPayoutProviderError,
  type SupplierPayoutProvider,
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
  }
}

const unsupportedOperation = async (): Promise<never> => {
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
  }
}

export function createFakePayoutProvider(options?: {
  status?: SupplierPayoutStatus['status']
}): SupplierPayoutProvider {
  const submissions = new Map<string, Awaited<ReturnType<SupplierPayoutProvider['submit']>>>()
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
      return submission
    },
    async getStatus(input) {
      const known = [...submissions.values()].some(
        (submission) =>
          submission.payoutID === input.payoutID &&
          submission.transactionID === input.transactionID,
      )
      if (!known) throw new SupplierPayoutProviderError('provider')
      return {
        status,
        providerStatus: status === 'succeeded' ? 'success' : status,
        providerStatusDetail: status === 'succeeded' ? 'accredited' : null,
      }
    },
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
