import type { Field, FieldHook } from 'payload'

import { purchasingFinanceFieldAccess } from '../access/purchasingFinanceAccess'

export type CommercialTerms = {
  mode?: 'inherit' | 'purchase' | 'consignment' | null
  method?: 'percentage' | 'fixed' | null
  shareBps?: number | null
  fixedMinor?: number | null
  currency?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

const privateAccess = {
  create: purchasingFinanceFieldAccess,
  read: purchasingFinanceFieldAccess,
  update: purchasingFinanceFieldAccess,
}

function validationError(message: string): never {
  throw new Error(message)
}

export function validateCommercialTerms(
  value: CommercialTerms | null | undefined,
  { allowInherit }: { allowInherit: boolean },
): CommercialTerms {
  const terms = value ?? {}
  const mode = terms.mode ?? (allowInherit ? 'inherit' : null)
  if (!mode || (!allowInherit && mode === 'inherit'))
    validationError('Seleccioná compra o consignación.')

  if (terms.effectiveFrom && terms.effectiveTo) {
    const from = Date.parse(terms.effectiveFrom)
    const to = Date.parse(terms.effectiveTo)
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to)
      validationError('La fecha de finalización debe ser posterior al inicio de vigencia.')
  }

  if (mode === 'inherit' || mode === 'purchase') return { ...terms, mode }

  if (!terms.method)
    validationError('Definí cómo se calcula la parte del proveedor en consignación.')
  if (terms.method === 'percentage') {
    if (
      !Number.isInteger(terms.shareBps) ||
      (terms.shareBps ?? 0) <= 0 ||
      (terms.shareBps ?? 0) > 10_000
    )
      validationError('El porcentaje debe estar entre 0,01 % y 100 %.')
  }
  if (terms.method === 'fixed') {
    if (!Number.isSafeInteger(terms.fixedMinor) || (terms.fixedMinor ?? 0) <= 0)
      validationError('El importe fijo debe expresarse en unidades monetarias menores enteras.')
    if (!terms.currency || !/^[A-Z]{3}$/.test(terms.currency))
      validationError('Indicá una moneda ISO de tres letras para el importe fijo.')
  }
  return { ...terms, mode }
}

export const validateSupplierCommercialTerms: FieldHook = ({ value }) =>
  validateCommercialTerms(value as CommercialTerms, { allowInherit: false })

export const validateProductCommercialTerms: FieldHook = ({ value }) =>
  validateCommercialTerms(value as CommercialTerms, { allowInherit: true })

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
      label: { es: 'Porcentaje (puntos básicos)', en: 'Percentage (basis points)' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'percentage',
        description: { es: '3500 equivale a 35,00 %.', en: '3500 equals 35.00%.' },
      },
    },
    {
      name: 'fixedMinor',
      type: 'number',
      min: 1,
      label: { es: 'Importe fijo en unidades menores', en: 'Fixed amount in minor units' },
      admin: {
        condition: (_, siblingData) =>
          siblingData?.mode === 'consignment' && siblingData?.method === 'fixed',
        description: {
          es: 'Ejemplo: 125050 representa ARS 1.250,50.',
          en: 'Example: 125050 represents ARS 1,250.50.',
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
        label: { es: 'Importe en unidades menores', en: 'Amount in minor units' },
      },
      { name: 'currency', type: 'text', label: { es: 'Moneda ISO', en: 'ISO currency' } },
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
