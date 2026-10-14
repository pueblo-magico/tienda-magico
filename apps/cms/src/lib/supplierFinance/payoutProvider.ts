export type SupplierPayoutProviderID = 'mercado-pago' | 'manual' | 'fake'

export type SupplierPayoutProviderErrorCode =
  'invalid' | 'configuration' | 'provider' | 'uncertain' | 'unsupported'

export type SupplierPayoutRecipient = {
  kind: 'email'
  value: string
}

export type SupplierPayoutRequest = {
  externalReference: string
  description: string
  recipient: SupplierPayoutRecipient
  amountMinor: number
  currency: 'ARS'
  idempotencyKey: string
  notificationURL?: string
}

export type SupplierPayoutSubmission = {
  provider: SupplierPayoutProviderID
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

export type SupplierPayoutProviderCapabilities = {
  submit: boolean
  queryStatus: boolean
  notifications: boolean
  cancel: boolean
}

export class SupplierPayoutProviderError extends Error {
  constructor(
    readonly code: SupplierPayoutProviderErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options)
  }
}

export interface SupplierPayoutProvider {
  readonly id: SupplierPayoutProviderID
  readonly capabilities: SupplierPayoutProviderCapabilities
  validateRecipient(recipient: SupplierPayoutRecipient): void
  submit(request: SupplierPayoutRequest): Promise<SupplierPayoutSubmission>
  getStatus(input: { payoutID: string; transactionID: string }): Promise<SupplierPayoutStatus>
}
