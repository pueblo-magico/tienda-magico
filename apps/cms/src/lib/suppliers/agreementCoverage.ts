export type AgreementCoverage =
  | {
      kind: 'resolved'
      scope: 'supplier' | 'product' | 'variant'
      agreement: {
        id: number | string | null
        reference: string | null
        revision: number | null
        mode: 'purchase' | 'consignment' | null
      }
    }
  | {
      kind: 'legacy'
      scope: 'supplier' | 'product'
      terms: { mode: 'purchase' | 'consignment' | null }
    }
  | { kind: 'ambiguous'; scope: 'supplier' | 'product' | 'variant' }
  | { kind: 'missing' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isScope(value: unknown): value is 'supplier' | 'product' | 'variant' {
  return value === 'supplier' || value === 'product' || value === 'variant'
}

function isMode(value: unknown): value is 'purchase' | 'consignment' | null {
  return value === 'purchase' || value === 'consignment' || value === null
}

export function normalizeAgreementCoverage(value: unknown): AgreementCoverage {
  if (!isRecord(value)) return { kind: 'missing' }
  if (value.kind === 'missing') return { kind: 'missing' }
  if (value.kind === 'ambiguous' && isScope(value.scope)) {
    return { kind: 'ambiguous', scope: value.scope }
  }
  if (
    value.kind === 'legacy' &&
    (value.scope === 'supplier' || value.scope === 'product') &&
    isRecord(value.terms) &&
    isMode(value.terms.mode)
  ) {
    return { kind: 'legacy', scope: value.scope, terms: { mode: value.terms.mode } }
  }
  if (
    value.kind === 'resolved' &&
    isScope(value.scope) &&
    isRecord(value.agreement) &&
    (typeof value.agreement.id === 'number' ||
      typeof value.agreement.id === 'string' ||
      value.agreement.id === null) &&
    (typeof value.agreement.reference === 'string' || value.agreement.reference === null) &&
    (typeof value.agreement.revision === 'number' || value.agreement.revision === null) &&
    isMode(value.agreement.mode)
  ) {
    return {
      kind: 'resolved',
      scope: value.scope,
      agreement: {
        id: value.agreement.id,
        reference: value.agreement.reference,
        revision: value.agreement.revision,
        mode: value.agreement.mode,
      },
    }
  }
  return { kind: 'missing' }
}
