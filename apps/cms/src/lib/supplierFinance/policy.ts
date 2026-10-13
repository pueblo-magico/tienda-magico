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

export function assertPayoutConfirmation(input: PayoutConfirmationInput): void {
  if (!input.actorRoles.includes('admin')) throw new PayoutConfirmationError('forbidden')
  if (input.acknowledged !== true) throw new PayoutConfirmationError('confirmation_required')
  if (input.settlementStatus !== 'approved') throw new PayoutConfirmationError('settlement')
  if (input.profileStatus !== 'verified') throw new PayoutConfirmationError('profile')
  if (
    !input.settlementCurrency ||
    input.profileCurrency !== input.settlementCurrency ||
    input.settlementCurrency !== 'ARS'
  )
    throw new PayoutConfirmationError('currency')
  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor <= 0 ||
    !Number.isSafeInteger(input.outstandingMinor) ||
    input.outstandingMinor <= 0 ||
    input.amountMinor !== input.outstandingMinor
  )
    throw new PayoutConfirmationError('amount')
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
