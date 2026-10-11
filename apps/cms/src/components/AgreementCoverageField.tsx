'use client'

import { Banner, useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import {
  normalizeAgreementCoverage,
  type AgreementCoverage,
} from '@/lib/suppliers/agreementCoverage'

function relationID(value: unknown): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object') {
    if ('value' in value) return relationID(value.value)
    if ('id' in value) return relationID(value.id)
  }
  return null
}

const scopeLabels = {
  es: { supplier: 'proveedor', product: 'producto', variant: 'variante' },
  en: { supplier: 'supplier', product: 'product', variant: 'variant' },
} as const

const modeLabels = {
  es: { purchase: 'compra', consignment: 'consignación' },
  en: { purchase: 'purchase', consignment: 'consignment' },
} as const

export default function AgreementCoverageField() {
  const { id } = useDocumentInfo()
  const supplierValue = useFormFields(([fields]) => fields.supplier?.value)
  const supplier = relationID(supplierValue)
  const { i18n } = useTranslation()
  const language = i18n.language === 'en' ? 'en' : 'es'
  const requestKey = supplier == null ? null : `${String(supplier)}:${String(id ?? '')}`
  const [result, setResult] = useState<{ key: string; coverage: AgreementCoverage } | null>(null)

  useEffect(() => {
    if (supplier == null || requestKey == null) return
    const controller = new AbortController()
    const query = new URLSearchParams({ supplier: String(supplier) })
    if (id != null) query.set('product', String(id))
    fetch(`/api/supplier-agreements/effective?${query}`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json()
        setResult({ key: requestKey, coverage: normalizeAgreementCoverage(body) })
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError'))
          setResult({ key: requestKey, coverage: { kind: 'missing' } })
      })
    return () => controller.abort()
  }, [id, requestKey, supplier])

  if (supplier == null)
    return (
      <Banner type="info">
        {language === 'en'
          ? 'Select a supplier to review contractual coverage.'
          : 'Seleccioná un proveedor para revisar la cobertura contractual.'}
      </Banner>
    )
  if (!result || result.key !== requestKey)
    return (
      <Banner type="info">
        {language === 'en' ? 'Checking contractual coverage…' : 'Revisando cobertura contractual…'}
      </Banner>
    )
  const { coverage } = result
  if (coverage.kind === 'missing')
    return (
      <Banner type="error">
        {language === 'en'
          ? 'No current agreement covers this product. Create and activate a supplier agreement before publishing.'
          : 'No hay un acuerdo vigente que cubra este producto. Creá y activá un acuerdo antes de publicar.'}
      </Banner>
    )
  if (coverage.kind === 'ambiguous')
    return (
      <Banner type="error">
        {language === 'en'
          ? 'More than one current agreement applies. Finance must resolve the overlap.'
          : 'Hay más de un acuerdo vigente aplicable. Finanzas debe resolver la superposición.'}
      </Banner>
    )
  if (coverage.kind === 'legacy')
    return (
      <Banner type="info">
        {language === 'en'
          ? `Legacy ${scopeLabels.en[coverage.scope]} terms provide ${modeLabels.en[coverage.terms.mode ?? 'purchase']} coverage. Create a versioned agreement to replace this compatibility fallback.`
          : `Los términos legados de ${scopeLabels.es[coverage.scope]} brindan cobertura de ${modeLabels.es[coverage.terms.mode ?? 'purchase']}. Creá un acuerdo versionado para reemplazar esta compatibilidad.`}
      </Banner>
    )

  const mode = coverage.agreement.mode ?? 'purchase'
  const reference = coverage.agreement.reference ?? String(coverage.agreement.id ?? '')
  return (
    <Banner
      type="success"
      to={
        coverage.agreement.id == null
          ? undefined
          : `/admin/collections/supplier-agreements/${coverage.agreement.id}`
      }
    >
      {language === 'en'
        ? `Current ${scopeLabels.en[coverage.scope]} agreement: ${reference}, revision ${coverage.agreement.revision ?? '—'}, ${modeLabels.en[mode]}.`
        : `Acuerdo vigente de ${scopeLabels.es[coverage.scope]}: ${reference}, revisión ${coverage.agreement.revision ?? '—'}, ${modeLabels.es[mode]}.`}
    </Banner>
  )
}
