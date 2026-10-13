import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook, Field, FieldHook } from 'payload'

import { purchasingFinanceFieldAccess } from '../access/purchasingFinanceAccess'

export type CommercialTerms = {
  mode?: 'inherit' | 'purchase' | 'consignment' | null
  method?: 'percentage' | 'fixed' | null
  shareBps?: number | null
  percentageBasis?: PercentageBasis | null
  fixedMinor?: number | null
  currency?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export type PercentageBasis = {
  productDiscounts?: 'deduct' | 'ignore' | null
  orderDiscounts?: 'deduct_allocated' | 'ignore' | null
  taxes?: 'include' | 'exclude' | null
  shipping?: 'include_allocated' | 'exclude' | null
  tipsDonations?: 'include_allocated' | 'exclude' | null
  paymentFees?: 'deduct_actual' | 'store_absorbs' | null
}

type PurchaseCost = {
  amountMinor?: number | null
  currency?: string | null
  baseQuantity?: number | null
  baseUnit?: string | null
  updatedAt?: string | null
}

type PurchasingData = {
  supplier?: unknown
  supplierSKU?: string | null
  purchaseCost?: PurchaseCost | null
  termsOverride?: CommercialTerms | null
  purchasingNotes?: string | null
  [key: string]: unknown
}

export type AgreementLifecycle = {
  reference?: string | null
  supplier?: unknown
  product?: unknown
  variant?: unknown
  revision?: number | null
  previousAgreement?: unknown
  status?: 'draft' | 'active' | 'expired' | 'terminated' | null
  terms?: CommercialTerms | null
  approvedBy?: unknown
  approvedAt?: string | null
  terminatedAt?: string | null
  terminationReason?: string | null
  [key: string]: unknown
}

type AgreementActor = {
  id?: number | string
  roles?: string[] | null
} | null

type AgreementTransitionArgs = {
  original?: AgreementLifecycle | null
  data: AgreementLifecycle
  user?: AgreementActor
  now?: string
}

const privateAccess = {
  create: purchasingFinanceFieldAccess,
  read: purchasingFinanceFieldAccess,
  update: purchasingFinanceFieldAccess,
}

function validationError(message: string, path = 'termsOverride'): never {
  throw new ValidationError({ errors: [{ message, path }] })
}

export function validateAgreementLifecycle(value: AgreementLifecycle): AgreementLifecycle {
  if (!value.supplier) validationError('Seleccioná el proveedor del acuerdo.', 'supplier')
  if (!Number.isSafeInteger(value.revision) || (value.revision ?? 0) <= 0)
    validationError('La revisión debe ser un entero positivo.', 'revision')
  if ((value.revision ?? 1) > 1 && !value.previousAgreement)
    validationError('Vinculá la revisión contractual anterior.', 'previousAgreement')
  if (value.variant && !value.product)
    validationError('Seleccioná el producto al definir una variante.', 'product')

  const allowedStatuses = ['draft', 'active', 'expired', 'terminated']
  if (!value.status || !allowedStatuses.includes(value.status))
    validationError('Seleccioná un estado contractual válido.', 'status')
  validateCommercialTerms(value.terms, { allowInherit: false, pathPrefix: 'terms' })

  if (value.status !== 'draft') {
    if (!value.terms?.effectiveFrom || !Number.isFinite(Date.parse(value.terms.effectiveFrom)))
      validationError(
        'Un acuerdo aprobado necesita una fecha válida de inicio de vigencia.',
        'terms.effectiveFrom',
      )
    if (!value.approvedBy) validationError('Falta la persona que aprobó el acuerdo.', 'approvedBy')
    if (!value.approvedAt || !Number.isFinite(Date.parse(value.approvedAt)))
      validationError('Falta una fecha válida de aprobación.', 'approvedAt')
  }
  if (value.status === 'terminated') {
    if (!value.terminationReason?.trim())
      validationError('Indicá el motivo de terminación.', 'terminationReason')
    if (!value.terminatedAt || !Number.isFinite(Date.parse(value.terminatedAt)))
      validationError('Falta una fecha válida de terminación.', 'terminatedAt')
  }
  return value
}

const immutableAgreementFields = [
  'reference',
  'supplier',
  'product',
  'variant',
  'revision',
  'previousAgreement',
  'terms',
] as const

const immutableRelationFields = new Set<keyof AgreementLifecycle>([
  'supplier',
  'product',
  'variant',
  'previousAgreement',
])

function relationIdentity(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }
  return ''
}

function immutableAgreementValueChanged(
  field: (typeof immutableAgreementFields)[number],
  nextValue: unknown,
  previousValue: unknown,
): boolean {
  if (immutableRelationFields.has(field))
    return relationIdentity(nextValue) !== relationIdentity(previousValue)
  return JSON.stringify(nextValue) !== JSON.stringify(previousValue)
}

const allowedAgreementTransitions: Record<string, string[]> = {
  draft: ['draft', 'active'],
  active: ['active', 'expired', 'terminated'],
  expired: ['expired'],
  terminated: ['terminated'],
}

export function applyAgreementTransition({
  original,
  data,
  user,
  now = new Date().toISOString(),
}: AgreementTransitionArgs): AgreementLifecycle {
  const next: AgreementLifecycle = { ...(original ?? {}), ...data }
  const previousStatus = original?.status
  const nextStatus = next.status ?? 'draft'

  if (previousStatus && !(allowedAgreementTransitions[previousStatus] ?? []).includes(nextStatus))
    validationError(`No se puede pasar un acuerdo de ${previousStatus} a ${nextStatus}.`, 'status')

  if (original?.status && original.status !== 'draft') {
    for (const field of immutableAgreementFields) {
      if (!(field in data)) continue
      if (immutableAgreementValueChanged(field, data[field], original[field]))
        validationError('Creá una nueva revisión para modificar un acuerdo activo.', String(field))
    }
  }
  if (
    original?.status === 'terminated' &&
    'terminationReason' in data &&
    data.terminationReason !== original.terminationReason
  )
    validationError(
      'El motivo de terminación forma parte del historial y no se puede reescribir.',
      'terminationReason',
    )

  const isStatusChange = previousStatus !== nextStatus
  if (isStatusChange && nextStatus !== 'draft') {
    const canApprove = user?.roles?.some((role) => role === 'admin' || role === 'finance')
    if (!canApprove)
      validationError('Solo finanzas o administración puede aprobar o cerrar acuerdos.', 'status')
  }

  if (nextStatus === 'active' && previousStatus !== 'active') {
    if (!user?.id) validationError('No se pudo identificar a la persona aprobadora.', 'approvedBy')
    next.approvedBy = user.id
    next.approvedAt = now
  }
  if (isStatusChange && (nextStatus === 'expired' || nextStatus === 'terminated')) {
    const configuredEnd = next.terms?.effectiveTo
    const closesAt =
      configuredEnd && Date.parse(configuredEnd) <= Date.parse(now) ? configuredEnd : now
    next.terms = { ...next.terms, effectiveTo: closesAt }
  }
  if (nextStatus === 'terminated' && previousStatus !== 'terminated') next.terminatedAt = now

  validateAgreementLifecycle(next)
  return next
}

const percentageBasisOptions = {
  productDiscounts: ['deduct', 'ignore'],
  orderDiscounts: ['deduct_allocated', 'ignore'],
  taxes: ['include', 'exclude'],
  shipping: ['include_allocated', 'exclude'],
  tipsDonations: ['include_allocated', 'exclude'],
  paymentFees: ['deduct_actual', 'store_absorbs'],
} as const

function validatePercentageBasis(
  value: PercentageBasis | null | undefined,
  pathPrefix: string,
): PercentageBasis {
  if (!value)
    validationError('Definí qué conceptos forman la base del porcentaje del proveedor.', pathPrefix)

  for (const [field, options] of Object.entries(percentageBasisOptions)) {
    const selected = value[field as keyof PercentageBasis]
    if (!selected || !(options as readonly string[]).includes(selected))
      validationError(
        'Seleccioná un tratamiento explícito para este concepto.',
        `${pathPrefix}.${field}`,
      )
  }
  return value
}

export function validateCommercialTerms(
  value: CommercialTerms | null | undefined,
  { allowInherit, pathPrefix = '' }: { allowInherit: boolean; pathPrefix?: string },
): CommercialTerms {
  const path = (field: string) => (pathPrefix ? `${pathPrefix}.${field}` : field)
  const terms = value ?? {}
  const mode = terms.mode ?? (allowInherit ? 'inherit' : null)
  if (!mode || (!allowInherit && mode === 'inherit'))
    validationError('Seleccioná compra o consignación.', path('mode'))

  const from = terms.effectiveFrom ? Date.parse(terms.effectiveFrom) : null
  const to = terms.effectiveTo ? Date.parse(terms.effectiveTo) : null
  if (terms.effectiveFrom && !Number.isFinite(from))
    validationError('Indicá una fecha válida de inicio de vigencia.', path('effectiveFrom'))
  if (terms.effectiveTo && !Number.isFinite(to))
    validationError('Indicá una fecha válida de finalización.', path('effectiveTo'))
  if (from != null && to != null) {
    if (from >= to)
      validationError(
        'La fecha de finalización debe ser posterior al inicio de vigencia.',
        path('effectiveTo'),
      )
  }

  if (mode === 'inherit' || mode === 'purchase') return { ...terms, mode }

  if (!terms.method)
    validationError(
      'Definí cómo se calcula la parte del proveedor en consignación.',
      path('method'),
    )
  if (terms.method === 'percentage') {
    if (
      !Number.isInteger(terms.shareBps) ||
      (terms.shareBps ?? 0) <= 0 ||
      (terms.shareBps ?? 0) > 10_000
    )
      validationError('El porcentaje debe estar entre 0,01 % y 100 %.', path('shareBps'))
    validatePercentageBasis(terms.percentageBasis, path('percentageBasis'))
  }
  if (terms.method === 'fixed') {
    if (!Number.isSafeInteger(terms.fixedMinor) || (terms.fixedMinor ?? 0) <= 0)
      validationError(
        'El importe fijo debe expresarse en unidades monetarias menores enteras.',
        path('fixedMinor'),
      )
    if (!terms.currency || !/^[A-Z]{3}$/.test(terms.currency))
      validationError(
        'Indicá una moneda ISO de tres letras para el importe fijo.',
        path('currency'),
      )
  }
  return { ...terms, mode }
}

export const validateSupplierCommercialTerms: FieldHook = ({ path, value }) =>
  validateCommercialTerms(value as CommercialTerms, {
    allowInherit: false,
    pathPrefix: path.map(String).join('.'),
  })

export const validateProductCommercialTerms: FieldHook = ({ path, value }) =>
  validateCommercialTerms(value as CommercialTerms, {
    allowInherit: true,
    pathPrefix: path.map(String).join('.'),
  })

function isActiveAt(terms: CommercialTerms, timestamp: number): boolean {
  const from = terms.effectiveFrom ? Date.parse(terms.effectiveFrom) : null
  const to = terms.effectiveTo ? Date.parse(terms.effectiveTo) : null
  return (from == null || from <= timestamp) && (to == null || timestamp < to)
}

export function agreementPeriodsOverlap(
  left: Pick<CommercialTerms, 'effectiveFrom' | 'effectiveTo'>,
  right: Pick<CommercialTerms, 'effectiveFrom' | 'effectiveTo'>,
): boolean {
  const leftFrom = left.effectiveFrom ? Date.parse(left.effectiveFrom) : Number.NEGATIVE_INFINITY
  const leftTo = left.effectiveTo ? Date.parse(left.effectiveTo) : Number.POSITIVE_INFINITY
  const rightFrom = right.effectiveFrom ? Date.parse(right.effectiveFrom) : Number.NEGATIVE_INFINITY
  const rightTo = right.effectiveTo ? Date.parse(right.effectiveTo) : Number.POSITIVE_INFINITY
  return leftFrom < rightTo && rightFrom < leftTo
}

export function resolveEffectiveCommercialTerms(
  productTerms: CommercialTerms | null | undefined,
  supplierTerms: CommercialTerms | null | undefined,
  effectiveAt: string | Date,
): { source: 'product' | 'supplier'; terms: CommercialTerms } {
  const timestamp = effectiveAt instanceof Date ? effectiveAt.getTime() : Date.parse(effectiveAt)
  if (!Number.isFinite(timestamp))
    validationError('La fecha de resolución del acuerdo no es válida.')

  const product = validateCommercialTerms(productTerms, { allowInherit: true })
  const source = product.mode === 'inherit' ? 'supplier' : 'product'
  const terms =
    source === 'supplier'
      ? validateCommercialTerms(supplierTerms, { allowInherit: false })
      : product
  if (!isActiveAt(terms, timestamp))
    validationError('No existe un acuerdo comercial vigente para la fecha indicada.')
  return { source, terms }
}

export const validatePurchasingData: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data
  const current: PurchasingData = { ...(originalDoc ?? {}), ...data }
  if ('termsOverride' in current)
    validateCommercialTerms(current.termsOverride, {
      allowInherit: true,
      pathPrefix: 'termsOverride',
    })

  const cost = current.purchaseCost
  if (cost) {
    const hasCostValue = Object.values(cost).some((value) => value != null && value !== '')
    if (hasCostValue && !current.supplier)
      validationError('Seleccioná un proveedor antes de guardar un costo de compra.', 'supplier')
    if (hasCostValue && (!Number.isSafeInteger(cost.amountMinor) || (cost.amountMinor ?? 0) <= 0))
      validationError(
        'El costo debe expresarse en unidades monetarias menores enteras.',
        'purchaseCost.amountMinor',
      )
    if (hasCostValue && (!cost.currency || !/^[A-Z]{3}$/.test(cost.currency)))
      validationError(
        'Indicá una moneda ISO de tres letras para el costo.',
        'purchaseCost.currency',
      )
    if (
      hasCostValue &&
      (typeof cost.baseQuantity !== 'number' ||
        !Number.isFinite(cost.baseQuantity) ||
        cost.baseQuantity <= 0)
    )
      validationError(
        'Indicá una cantidad base positiva para el costo.',
        'purchaseCost.baseQuantity',
      )
    if (hasCostValue && !cost.baseUnit?.trim())
      validationError('Indicá la unidad base del costo.', 'purchaseCost.baseUnit')
    if (hasCostValue && (!cost.updatedAt || !Number.isFinite(Date.parse(cost.updatedAt))))
      validationError(
        'Indicá una fecha válida de actualización del costo.',
        'purchaseCost.updatedAt',
      )
  }

  if (current.termsOverride?.mode && current.termsOverride.mode !== 'inherit' && !current.supplier)
    validationError(
      'Seleccioná un proveedor antes de definir una excepción contractual.',
      'supplier',
    )
  return data
}

export function commercialTermsFields({ allowInherit }: { allowInherit: boolean }): Field[] {
  return [
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: allowInherit ? 'inherit' : 'purchase',
      options: [
        ...(allowInherit
          ? [
              {
                label: { es: 'Heredar del proveedor', en: 'Inherit from supplier' },
                value: 'inherit',
              },
            ]
          : []),
        { label: { es: 'Compra', en: 'Purchase' }, value: 'purchase' },
        { label: { es: 'Consignación', en: 'Consignment' }, value: 'consignment' },
      ],
    },
    {
      name: 'method',
      type: 'select',
      options: [
        { label: { es: 'Porcentaje de la venta', en: 'Percentage of sale' }, value: 'percentage' },
        { label: { es: 'Importe fijo por unidad', en: 'Fixed amount per unit' }, value: 'fixed' },
      ],
      admin: { condition: (_, siblingData) => siblingData?.mode === 'consignment' },
    },
    {
      name: 'shareBps',
      type: 'number',
      min: 1,
      max: 10_000,
      label: { es: 'Porcentaje del proveedor', en: 'Supplier percentage' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'percentage',
        components: { Field: '@/components/PercentageInputField' },
        description: { es: 'Ingresá 35 para 35,00 %.', en: 'Enter 35 for 35.00%.' },
      },
    },
    {
      name: 'percentageBasis',
      type: 'group',
      label: { es: 'Base del porcentaje', en: 'Percentage basis' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'percentage',
        description: {
          es: 'Definí explícitamente qué importes aumentan o reducen la base antes de calcular la parte del proveedor.',
          en: 'Explicitly define which amounts increase or reduce the base before calculating the supplier share.',
        },
      },
      fields: [
        {
          name: 'productDiscounts',
          dbName: 'pct_product_discounts',
          type: 'select',
          required: true,
          defaultValue: 'deduct',
          label: { es: 'Descuentos del producto', en: 'Product discounts' },
          options: [
            { label: { es: 'Restar de la base', en: 'Deduct from basis' }, value: 'deduct' },
            { label: { es: 'No afectan la base', en: 'Do not affect basis' }, value: 'ignore' },
          ],
        },
        {
          name: 'orderDiscounts',
          dbName: 'pct_order_discounts',
          type: 'select',
          required: true,
          defaultValue: 'deduct_allocated',
          label: { es: 'Descuentos generales', en: 'Order discounts' },
          options: [
            {
              label: { es: 'Restar la parte asignada', en: 'Deduct allocated share' },
              value: 'deduct_allocated',
            },
            { label: { es: 'No afectan la base', en: 'Do not affect basis' }, value: 'ignore' },
          ],
        },
        {
          name: 'taxes',
          dbName: 'pct_taxes',
          type: 'select',
          required: true,
          defaultValue: 'exclude',
          label: { es: 'Impuestos', en: 'Taxes' },
          options: [
            { label: { es: 'Incluir', en: 'Include' }, value: 'include' },
            { label: { es: 'Excluir', en: 'Exclude' }, value: 'exclude' },
          ],
        },
        {
          name: 'shipping',
          dbName: 'pct_shipping',
          type: 'select',
          required: true,
          defaultValue: 'exclude',
          label: { es: 'Envío', en: 'Shipping' },
          options: [
            {
              label: { es: 'Incluir la parte asignada', en: 'Include allocated share' },
              value: 'include_allocated',
            },
            { label: { es: 'Excluir', en: 'Exclude' }, value: 'exclude' },
          ],
        },
        {
          name: 'tipsDonations',
          dbName: 'pct_tips_donations',
          type: 'select',
          required: true,
          defaultValue: 'exclude',
          label: { es: 'Propinas y donaciones', en: 'Tips and donations' },
          options: [
            {
              label: { es: 'Incluir la parte asignada', en: 'Include allocated share' },
              value: 'include_allocated',
            },
            { label: { es: 'Excluir', en: 'Exclude' }, value: 'exclude' },
          ],
        },
        {
          name: 'paymentFees',
          dbName: 'pct_payment_fees',
          type: 'select',
          required: true,
          defaultValue: 'store_absorbs',
          label: { es: 'Comisiones de cobro', en: 'Payment fees' },
          options: [
            {
              label: { es: 'Restar la comisión real', en: 'Deduct actual fee' },
              value: 'deduct_actual',
            },
            {
              label: { es: 'Las absorbe la tienda', en: 'Store absorbs fees' },
              value: 'store_absorbs',
            },
          ],
        },
      ],
    },
    {
      name: 'fixedMinor',
      type: 'number',
      min: 1,
      label: { es: 'Importe fijo por unidad', en: 'Fixed amount per unit' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'fixed',
        components: { Field: '@/components/MoneyInputField' },
        description: {
          es: 'Ingresá el importe en la moneda seleccionada, con hasta dos decimales.',
          en: 'Enter the amount in the selected currency, with up to two decimals.',
        },
      },
    },
    {
      name: 'currency',
      type: 'text',
      label: { es: 'Moneda ISO', en: 'ISO currency' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'fixed',
        components: { Field: '@/components/IsoCurrencySelectField' },
      },
    },
    { name: 'effectiveFrom', type: 'date', label: { es: 'Vigente desde', en: 'Effective from' } },
    { name: 'effectiveTo', type: 'date', label: { es: 'Vigente hasta', en: 'Effective to' } },
  ]
}

export const purchasingFields: Field[] = [
  {
    name: 'supplier',
    type: 'relationship',
    relationTo: 'suppliers',
    access: privateAccess,
    label: { es: 'Proveedor', en: 'Supplier' },
  },
  {
    name: 'agreementCoverage',
    type: 'ui',
    admin: { components: { Field: '@/components/AgreementCoverageField' } },
  },
  {
    name: 'supplierSKU',
    type: 'text',
    access: privateAccess,
    label: { es: 'SKU del proveedor', en: 'Supplier SKU' },
  },
  {
    name: 'purchaseCost',
    type: 'group',
    access: privateAccess,
    label: { es: 'Costo de compra', en: 'Purchase cost' },
    fields: [
      {
        name: 'amountMinor',
        type: 'number',
        min: 1,
        label: { es: 'Importe', en: 'Amount' },
        admin: {
          components: { Field: '@/components/MoneyInputField' },
          description: {
            es: 'Ingresá el costo en la moneda seleccionada, con hasta dos decimales.',
            en: 'Enter the cost in the selected currency, with up to two decimals.',
          },
        },
      },
      {
        name: 'currency',
        type: 'text',
        label: { es: 'Moneda ISO', en: 'ISO currency' },
        admin: { components: { Field: '@/components/IsoCurrencySelectField' } },
      },
      {
        name: 'baseQuantity',
        type: 'number',
        min: 0.000001,
        label: { es: 'Cantidad base', en: 'Base quantity' },
      },
      { name: 'baseUnit', type: 'text', label: { es: 'Unidad base', en: 'Base unit' } },
      { name: 'updatedAt', type: 'date', label: { es: 'Costo actualizado', en: 'Cost updated' } },
    ],
  },
  {
    name: 'termsOverride',
    type: 'group',
    access: privateAccess,
    label: { es: 'Excepción del acuerdo comercial', en: 'Commercial agreement override' },
    hooks: { beforeValidate: [validateProductCommercialTerms] },
    fields: commercialTermsFields({ allowInherit: true }),
  },
  {
    name: 'purchasingNotes',
    type: 'textarea',
    access: privateAccess,
    label: { es: 'Notas privadas de compras', en: 'Private purchasing notes' },
  },
]
