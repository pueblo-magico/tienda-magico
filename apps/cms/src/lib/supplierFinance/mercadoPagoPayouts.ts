export type MercadoPagoPayoutRequest = {
  externalReference: string
  description: string
  recipientEmail: string
  amountMinor: number
  currency: 'ARS'
  notificationURL?: string
}

export type SupplierPayoutSubmission = {
  provider: 'mercado-pago'
  payoutID: string
  transactionID: string
  status: 'submitted'
  providerStatus: string
}

export type SupplierPayoutStatus = {
  status: 'processing' | 'succeeded' | 'failed' | 'reconciliation_required'
  providerStatus: string
  providerStatusDetail: string | null
}

type MercadoPagoPayoutResponse = {
  id?: unknown
  status?: unknown
  transactions?: Array<{ id?: unknown }> | null
}

export class SupplierPayoutProviderError extends Error {
  constructor(
    readonly code: 'invalid' | 'configuration' | 'provider' | 'uncertain',
    options?: { cause?: unknown },
  ) {
    super(code, options)
  }
}

function validatedInput(input: MercadoPagoPayoutRequest): MercadoPagoPayoutRequest {
  if (
    !/^[A-Za-z0-9_-]{1,50}$/.test(input.externalReference) ||
    !/^[A-Za-z0-9 _-]{1,100}$/.test(input.description) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipientEmail) ||
    input.currency !== 'ARS' ||
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < 100 ||
    input.amountMinor > 1_000_000_000_000
  )
    throw new SupplierPayoutProviderError('invalid')
  if (input.notificationURL) {
    let url: URL
    try {
      url = new URL(input.notificationURL)
    } catch (cause) {
      throw new SupplierPayoutProviderError('invalid', { cause })
    }
    if (url.protocol !== 'https:') throw new SupplierPayoutProviderError('invalid')
  }
  return input
}

export function buildMercadoPagoPayoutBody(input: MercadoPagoPayoutRequest): unknown {
  const value = validatedInput(input)
  return {
    external_reference: value.externalReference,
    description: value.description,
    ...(value.notificationURL ? { config: { notification_url: value.notificationURL } } : {}),
    transactions: [
      {
        type: 'account',
        description: value.description,
        account: { email: value.recipientEmail },
        amount: { currency: value.currency, value: value.amountMinor / 100 },
        external_reference: value.externalReference,
      },
    ],
  }
}

export async function submitMercadoPagoPayout(
  input: MercadoPagoPayoutRequest,
  options: {
    accessToken: string
    idempotencyKey: string
    testMode: true
    fetch?: typeof fetch
  },
): Promise<SupplierPayoutSubmission> {
  if (!options.accessToken.trim() || !/^[A-Za-z0-9-]{20,100}$/.test(options.idempotencyKey))
    throw new SupplierPayoutProviderError('configuration')
  const send = options.fetch ?? fetch
  let response: Response
  try {
    response = await send('https://api.mercadopago.com/v1/payouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken.trim()}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': options.idempotencyKey,
        'X-enforce-signature': 'false',
        'X-test-token': 'true',
      },
      body: JSON.stringify(buildMercadoPagoPayoutBody(input)),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (cause) {
    throw new SupplierPayoutProviderError('uncertain', { cause })
  }
  let data: MercadoPagoPayoutResponse
  try {
    data = (await response.json()) as MercadoPagoPayoutResponse
  } catch (cause) {
    throw new SupplierPayoutProviderError(response.ok ? 'uncertain' : 'provider', { cause })
  }
  if (response.status !== 202) throw new SupplierPayoutProviderError('provider')
  const payoutID = typeof data.id === 'string' ? data.id : ''
  const transactionID =
    Array.isArray(data.transactions) && typeof data.transactions[0]?.id === 'string'
      ? data.transactions[0].id
      : ''
  const providerStatus = typeof data.status === 'string' ? data.status : ''
  if (!payoutID || !transactionID || !providerStatus)
    throw new SupplierPayoutProviderError('uncertain')
  return {
    provider: 'mercado-pago',
    payoutID,
    transactionID,
    status: 'submitted',
    providerStatus,
  }
}

export async function getMercadoPagoPayoutStatus(
  input: { payoutID: string; transactionID: string },
  options: { accessToken: string; testMode: true; fetch?: typeof fetch },
): Promise<SupplierPayoutStatus> {
  if (
    !options.accessToken.trim() ||
    !/^[A-Za-z0-9_-]{3,100}$/.test(input.payoutID) ||
    !/^[A-Za-z0-9_-]{3,100}$/.test(input.transactionID)
  )
    throw new SupplierPayoutProviderError('configuration')
  const send = options.fetch ?? fetch
  let response: Response
  try {
    response = await send(
      `https://api.mercadopago.com/v1/payouts/${encodeURIComponent(input.payoutID)}/transactions/${encodeURIComponent(input.transactionID)}`,
      {
        headers: {
          Authorization: `Bearer ${options.accessToken.trim()}`,
          'Content-Type': 'application/json',
          'X-test-token': 'true',
        },
        signal: AbortSignal.timeout(10_000),
      },
    )
  } catch (cause) {
    throw new SupplierPayoutProviderError('uncertain', { cause })
  }
  let data: { id?: unknown; status?: unknown; status_detail?: unknown }
  try {
    data = (await response.json()) as typeof data
  } catch (cause) {
    throw new SupplierPayoutProviderError(response.ok ? 'uncertain' : 'provider', { cause })
  }
  if (!response.ok) throw new SupplierPayoutProviderError('provider')
  if (data.id !== input.transactionID || typeof data.status !== 'string')
    throw new SupplierPayoutProviderError('uncertain')
  const providerStatusDetail = typeof data.status_detail === 'string' ? data.status_detail : null
  let status: SupplierPayoutStatus['status'] = 'reconciliation_required'
  if (data.status === 'success' && providerStatusDetail === 'accredited') status = 'succeeded'
  else if (
    ['created', 'approved', 'transaction_in_process'].includes(data.status) ||
    (data.status === 'success' && providerStatusDetail === 'in_progress')
  )
    status = 'processing'
  else if (['error', 'rejected', 'canceled', 'refunded'].includes(data.status)) status = 'failed'
  return { status, providerStatus: data.status, providerStatusDetail }
}
