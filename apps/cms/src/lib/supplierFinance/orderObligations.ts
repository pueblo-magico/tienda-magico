import type { CommercialTerms } from '../../collections/commercialAgreements'
import { calculateSupplierObligation } from './policy'

export function moneyStringToMinor(value: string): number {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) throw new Error('invalid_money')
  const minor = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0')
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('invalid_money')
  return Number(minor)
}

export type DerivedOrderObligation =
  | { kind: 'none'; reason: 'purchase'; eligibleBaseMinor: number }
  | { kind: 'review'; reason: string; eligibleBaseMinor: number }
  | {
      kind: 'eligible'
      eligibleBaseMinor: number
      supplierAmountMinor: number
      storeAmountMinor: number
    }

export function deriveSupplierObligation(input: {
  currency: string
  totalAmount: string
  quantity: number
  terms: CommercialTerms | null
}): DerivedOrderObligation {
  const eligibleBaseMinor = moneyStringToMinor(input.totalAmount)
  if (!input.terms) return { kind: 'review', reason: 'missing_agreement', eligibleBaseMinor }
  if (
    input.terms.mode === 'consignment' &&
    input.terms.method === 'percentage' &&
    (input.terms.percentageBasis?.productDiscounts !== 'deduct' ||
      input.terms.percentageBasis.orderDiscounts !== 'deduct_allocated' ||
      input.terms.percentageBasis.taxes !== 'exclude' ||
      input.terms.percentageBasis.shipping !== 'exclude' ||
      input.terms.percentageBasis.tipsDonations !== 'exclude' ||
      input.terms.percentageBasis.paymentFees !== 'store_absorbs')
  )
    return { kind: 'review', reason: 'unsupported_basis', eligibleBaseMinor }
  const result = calculateSupplierObligation({
    mode: input.terms.mode === 'purchase' ? 'purchase' : 'consignment',
    method: input.terms.method,
    shareBps: input.terms.shareBps,
    fixedMinor: input.terms.fixedMinor,
    agreementCurrency: input.terms.currency,
    saleCurrency: input.currency,
    eligibleBaseMinor,
    quantity: input.quantity,
  })
  if (result.kind === 'none') return { ...result, eligibleBaseMinor }
  if (result.kind === 'review') return { ...result, eligibleBaseMinor }
  return {
    kind: 'eligible',
    eligibleBaseMinor,
    supplierAmountMinor: result.supplierAmountMinor,
    storeAmountMinor: result.storeAmountMinor,
  }
}
