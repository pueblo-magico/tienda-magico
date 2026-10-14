export type SupplierObligationInput = {
  mode: 'purchase' | 'consignment'
  method?: 'percentage' | 'fixed' | null
  shareBps?: number | null
  fixedMinor?: number | null
  agreementCurrency?: string | null
  saleCurrency: string
  eligibleBaseMinor: number
  quantity: number
}

export type SupplierObligationResult =
  | { kind: 'none'; reason: 'purchase' }
  | { kind: 'review'; reason: 'currency_mismatch' | 'invalid_terms' }
  | { kind: 'obligation'; supplierAmountMinor: number; storeAmountMinor: number }

export function calculateSupplierObligation(
  input: SupplierObligationInput,
): SupplierObligationResult {
  if (input.mode === 'purchase') return { kind: 'none', reason: 'purchase' }
  if (
    !Number.isSafeInteger(input.eligibleBaseMinor) ||
    input.eligibleBaseMinor < 0 ||
    !Number.isSafeInteger(input.quantity) ||
    input.quantity <= 0
  )
    return { kind: 'review', reason: 'invalid_terms' }
  if (!input.agreementCurrency || input.agreementCurrency !== input.saleCurrency)
    return { kind: 'review', reason: 'currency_mismatch' }

  let supplierAmountMinor: number
  if (
    input.method === 'percentage' &&
    Number.isSafeInteger(input.shareBps) &&
    (input.shareBps ?? 0) > 0 &&
    (input.shareBps ?? 0) <= 10_000
  ) {
    const rounded = (BigInt(input.eligibleBaseMinor) * BigInt(input.shareBps!) + 5_000n) / 10_000n
    supplierAmountMinor = Number(rounded)
  } else if (
    input.method === 'fixed' &&
    Number.isSafeInteger(input.fixedMinor) &&
    (input.fixedMinor ?? 0) > 0
  ) {
    const total = BigInt(input.fixedMinor!) * BigInt(input.quantity)
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) return { kind: 'review', reason: 'invalid_terms' }
    supplierAmountMinor = Number(total)
  } else {
    return { kind: 'review', reason: 'invalid_terms' }
  }

  if (supplierAmountMinor > input.eligibleBaseMinor)
    return { kind: 'review', reason: 'invalid_terms' }
  return {
    kind: 'obligation',
    supplierAmountMinor,
    storeAmountMinor: input.eligibleBaseMinor - supplierAmountMinor,
  }
}

export type PayoutConfirmationInput = {
  actorRoles: string[]
  settlementStatus: string
  settlementCurrency: string
  outstandingMinor: number
  profileStatus: string
  profileCurrency: string
  amountMinor: number
  acknowledged: boolean
}

export type PayoutConfirmationCode =
  'forbidden' | 'confirmation_required' | 'settlement' | 'profile' | 'currency' | 'amount'

export class PayoutConfirmationError extends Error {
  constructor(readonly code: PayoutConfirmationCode) {
    super(code)
  }
}

export type SupplierPayoutExecutionPolicy = {
  emergencyStop?: boolean | null
  outboundProviderPaymentsEnabled?: boolean | null
  automaticProviderPaymentsEnabled?: boolean | null
}

export type SupplierPayoutExecutionMode = 'confirmed' | 'automatic'

export type SupplierPayoutExecutionPolicyCode =
  'emergency_stop' | 'outbound_disabled' | 'automatic_disabled'

export class SupplierPayoutExecutionPolicyError extends Error {
  constructor(readonly code: SupplierPayoutExecutionPolicyCode) {
    super(code)
  }
}

export function assertSupplierPayoutExecutionPolicy(
  policy: SupplierPayoutExecutionPolicy,
  mode: SupplierPayoutExecutionMode,
): void {
  if (policy.emergencyStop !== false) throw new SupplierPayoutExecutionPolicyError('emergency_stop')
  if (policy.outboundProviderPaymentsEnabled !== true)
    throw new SupplierPayoutExecutionPolicyError('outbound_disabled')
  if (mode === 'automatic' && policy.automaticProviderPaymentsEnabled !== true)
    throw new SupplierPayoutExecutionPolicyError('automatic_disabled')
}

export function assertPayoutConfirmation(input: PayoutConfirmationInput): void {
  if (!input.actorRoles.includes('admin')) throw new PayoutConfirmationError('forbidden')
  if (input.acknowledged !== true) throw new PayoutConfirmationError('confirmation_required')
  if (!['approved', 'partially_paid'].includes(input.settlementStatus))
    throw new PayoutConfirmationError('settlement')
  if (input.profileStatus !== 'verified') throw new PayoutConfirmationError('profile')
  if (
    !input.settlementCurrency ||
    input.profileCurrency !== input.settlementCurrency ||
    input.settlementCurrency !== 'ARS'
  )
    throw new PayoutConfirmationError('currency')
  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < 100 ||
    !Number.isSafeInteger(input.outstandingMinor) ||
    input.outstandingMinor <= 0 ||
    input.amountMinor !== input.outstandingMinor
  )
    throw new PayoutConfirmationError('amount')
}

export type ManualPayoutConfirmationInput = {
  actorRoles: string[]
  payoutStatus: string
  settlementStatus: string
  settlementApprovedAt: string
  settlementCurrency: string
  outstandingMinor: number
  amountMinor: number
  reference: string
  paidAt: string
  acknowledged: boolean
}

export type ManualPayoutConfirmationCode =
  | 'forbidden'
  | 'confirmation_required'
  | 'payout'
  | 'settlement'
  | 'currency'
  | 'amount'
  | 'reference'
  | 'duplicate_reference'
  | 'paid_at'

export class ManualPayoutConfirmationError extends Error {
  constructor(readonly code: ManualPayoutConfirmationCode) {
    super(code)
  }
}

export function assertManualPayoutConfirmation(input: ManualPayoutConfirmationInput): void {
  if (!input.actorRoles.includes('admin')) throw new ManualPayoutConfirmationError('forbidden')
  if (input.acknowledged !== true) throw new ManualPayoutConfirmationError('confirmation_required')
  if (input.payoutStatus !== 'awaiting_approval') throw new ManualPayoutConfirmationError('payout')
  if (!['approved', 'partially_paid'].includes(input.settlementStatus))
    throw new ManualPayoutConfirmationError('settlement')
  if (input.settlementCurrency !== 'ARS') throw new ManualPayoutConfirmationError('currency')
  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < 100 ||
    !Number.isSafeInteger(input.outstandingMinor) ||
    input.outstandingMinor <= 0 ||
    input.amountMinor > input.outstandingMinor
  )
    throw new ManualPayoutConfirmationError('amount')
  if (input.reference.trim().length < 3 || input.reference.trim().length > 120)
    throw new ManualPayoutConfirmationError('reference')
  const paidAt = Date.parse(input.paidAt)
  const approvedAt = Date.parse(input.settlementApprovedAt)
  if (!Number.isFinite(paidAt) || !Number.isFinite(approvedAt) || paidAt > Date.now())
    throw new ManualPayoutConfirmationError('paid_at')
  const paidDate = new Date(paidAt).toISOString().slice(0, 10)
  const approvedDate = new Date(approvedAt).toISOString().slice(0, 10)
  if (paidDate < approvedDate) throw new ManualPayoutConfirmationError('paid_at')
}

export type SupplierPaymentObligation = {
  id: number
  status: string
  outstandingMinor: number
}

export type SupplierPaymentAllocation = {
  id: number
  appliedMinor: number
  outstandingMinor: number
  status: 'partially_paid' | 'paid'
}

export function allocateSupplierPayment(input: {
  amountMinor: number
  obligations: SupplierPaymentObligation[]
}): {
  allocations: SupplierPaymentAllocation[]
  outstandingMinor: number
  status: 'partially_paid' | 'paid'
} | null {
  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor <= 0 ||
    !input.obligations.length
  )
    return null

  let totalOutstanding = 0
  for (const obligation of input.obligations) {
    if (
      !Number.isSafeInteger(obligation.id) ||
      obligation.id <= 0 ||
      !['approved', 'partially_paid'].includes(obligation.status) ||
      !Number.isSafeInteger(obligation.outstandingMinor) ||
      obligation.outstandingMinor <= 0
    )
      return null
    totalOutstanding += obligation.outstandingMinor
    if (!Number.isSafeInteger(totalOutstanding)) return null
  }
  if (input.amountMinor > totalOutstanding) return null

  let remainingPayment = input.amountMinor
  const allocations: SupplierPaymentAllocation[] = []
  for (const obligation of input.obligations) {
    if (remainingPayment === 0) break
    const appliedMinor = Math.min(remainingPayment, obligation.outstandingMinor)
    const outstandingMinor = obligation.outstandingMinor - appliedMinor
    allocations.push({
      id: obligation.id,
      appliedMinor,
      outstandingMinor,
      status: outstandingMinor === 0 ? 'paid' : 'partially_paid',
    })
    remainingPayment -= appliedMinor
  }
  if (remainingPayment !== 0) return null
  const outstandingMinor = totalOutstanding - input.amountMinor
  return {
    allocations,
    outstandingMinor,
    status: outstandingMinor === 0 ? 'paid' : 'partially_paid',
  }
}

export type SettlementObligationInput = {
  supplier: number
  currency: string
  amountMinor: number
  status: string
}

export function validateSettlementObligations(input: {
  settlementSupplier: number
  settlementCurrency: string
  settlementAmountMinor: number
  obligations: SettlementObligationInput[]
}): boolean {
  if (
    !input.obligations.length ||
    !Number.isSafeInteger(input.settlementSupplier) ||
    input.settlementSupplier <= 0 ||
    !Number.isSafeInteger(input.settlementAmountMinor) ||
    input.settlementAmountMinor <= 0
  )
    return false

  let total = 0
  for (const obligation of input.obligations) {
    if (
      obligation.status !== 'eligible' ||
      obligation.supplier !== input.settlementSupplier ||
      obligation.currency !== input.settlementCurrency ||
      !Number.isSafeInteger(obligation.amountMinor) ||
      obligation.amountMinor <= 0
    )
      return false
    total += obligation.amountMinor
    if (!Number.isSafeInteger(total)) return false
  }
  return total === input.settlementAmountMinor
}

export type AutomaticPayoutProfile = {
  id: number
  supplier: number
  currency: string
  status: string
}

export function automaticPayoutProfileID(input: {
  supplier: number
  currency: string
  profiles: AutomaticPayoutProfile[]
}): number | null {
  const compatible = input.profiles.filter(
    (profile) =>
      Number.isSafeInteger(profile.id) &&
      profile.id > 0 &&
      profile.supplier === input.supplier &&
      profile.currency === input.currency &&
      profile.status === 'verified',
  )
  return compatible.length === 1 ? compatible[0].id : null
}

export function supplierObligationUpdateForPayout(
  payoutStatus: string,
): { status: 'paid'; outstandingMinor: 0 } | null {
  return payoutStatus === 'succeeded' ? { status: 'paid', outstandingMinor: 0 } : null
}
