import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook, Field, PayloadRequest } from 'payload'

function reject(req: PayloadRequest, path: string, es: string, en: string): never {
  throw new ValidationError({ errors: [{ path, message: req.locale === 'en' ? en : es }] })
}

export function relationID(value: unknown): string | number | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return relationID(value.id)
  return null
}

export function configuredVariantTypes(values: unknown): string[] {
  return Array.isArray(values)
    ? [
        ...new Set(
          values
            .map(relationID)
            .filter((id) => id != null)
            .map(String),
        ),
      ].sort()
    : []
}

export function hasCompleteVariantOptions(expected: string[], actual: string[]): boolean {
  return expected.length > 0 && JSON.stringify([...actual].sort()) === JSON.stringify(expected)
}

export const sellableFields: Field[] = [
  {
    name: 'sku',
    type: 'text',
    unique: true,
    label: { es: 'SKU', en: 'SKU' },
    admin: {
      description: {
        es: 'Identificador único y estable del artículo vendible. No se puede editar después de guardarlo.',
        en: 'Unique, stable identifier for this sellable item. It cannot be edited after saving.',
      },
      components: {
        Field: {
          path: '@/components/StableSKUField',
          exportName: 'default',
        },
      },
    },
  },
  { name: 'barcode', type: 'text', label: { es: 'Código de barras', en: 'Barcode' } },
  {
    name: 'oneOfAKind',
    type: 'checkbox',
    defaultValue: false,
    label: { es: 'Pieza única', en: 'One of a kind' },
  },
  {
    name: 'netContent',
    type: 'number',
    min: 0,
    label: { es: 'Contenido neto', en: 'Net content' },
  },
  {
    name: 'netContentUnit',
    type: 'select',
    options: ['g', 'ml', 'unit'],
    label: { es: 'Unidad de contenido neto', en: 'Net content unit' },
  },
  {
    name: 'salesUnit',
    type: 'select',
    defaultValue: 'unit',
    options: [
      { label: { es: 'Unidad', en: 'Unit' }, value: 'unit' },
      { label: { es: 'Paquete', en: 'Pack' }, value: 'pack' },
    ],
    label: { es: 'Unidad de venta', en: 'Sales unit' },
  },
  ...['packedWeightGrams', 'packageLengthMm', 'packageWidthMm', 'packageHeightMm'].map(
    (name): Field => ({
      name,
      type: 'number',
      min: 0,
      label: {
        packedWeightGrams: 'Peso embalado (g)',
        packageLengthMm: 'Largo del paquete (mm)',
        packageWidthMm: 'Ancho del paquete (mm)',
        packageHeightMm: 'Alto del paquete (mm)',
      }[name],
      access: { read: ({ req }) => Boolean(req.user?.roles?.includes('admin')) },
    }),
  ),
]

export const validateSellableItem: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  collection,
  req,
}) => {
  if (!data) return data
  const next = { ...originalDoc, ...data }
  const isVariant = collection.slug === 'variants'
  if (!isVariant && next.enableVariants === true) return data
  const sku = typeof next.sku === 'string' ? next.sku.trim().toUpperCase() : ''
  if (!sku && next._status === 'published')
    reject(req, 'sku', 'Ingresá un SKU antes de publicar.', 'Enter a SKU before publishing.')
  if (next._status === 'published' && (next.priceInARSEnabled !== true || next.priceInARS == null))
    reject(
      req,
      'priceInARS',
      'Activá ARS y cargá un precio antes de publicar.',
      'Enable ARS and enter a price before publishing.',
    )
  if (originalDoc?.sku && sku !== originalDoc.sku)
    reject(
      req,
      'sku',
      'El SKU es estable y no se puede cambiar.',
      'The SKU is stable and cannot be changed.',
    )
  if (sku) {
    for (const slug of ['products', 'variants'] as const) {
      const result = await req.payload.find({
        collection: slug,
        req,
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: {
          and: [
            { sku: { equals: sku } },
            ...(slug === collection.slug && originalDoc?.id
              ? [{ id: { not_equals: originalDoc.id } }]
              : []),
          ],
        },
      })
      if (result.docs.length)
        reject(req, 'sku', 'Este SKU ya está en uso.', 'This SKU is already in use.')
    }
  }
  if (next.priceInARS != null && (!Number.isSafeInteger(next.priceInARS) || next.priceInARS <= 0))
    reject(
      req,
      'priceInARS',
      'El precio debe ser un entero positivo en centavos ARS. No se permiten artículos gratuitos.',
      'Price must be a positive integer in ARS minor units. Free items are not supported.',
    )
  for (const field of [
    'netContent',
    'packedWeightGrams',
    'packageLengthMm',
    'packageWidthMm',
    'packageHeightMm',
  ]) {
    const value = next[field]
    if (
      value != null &&
      (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        (field === 'netContent' && value === 0))
    )
      reject(
        req,
        field,
        'Ingresá una medida válida; el contenido neto debe ser mayor que cero.',
        'Enter a valid measurement; net content must be greater than zero.',
      )
  }
  if ((next.netContent != null) !== Boolean(next.netContentUnit))
    reject(
      req,
      'netContent',
      'Completá el contenido neto y su unidad juntos.',
      'Provide net content and its unit together.',
    )
  if (next.inventory != null && (!Number.isSafeInteger(next.inventory) || next.inventory < 0))
    reject(
      req,
      'inventory',
      'El stock debe ser un entero no negativo.',
      'Inventory must be a nonnegative integer.',
    )
  if (next.oneOfAKind && (next.inventory > 1 || next.allowBackorder || next.allowBackorders))
    reject(
      req,
      'oneOfAKind',
      'Una pieza única admite stock máximo de uno y no permite pedidos sin stock.',
      'A one-of-a-kind item allows stock of at most one and no backorders.',
    )
  let combinationKey: string | undefined
  if (isVariant) {
    const canSaveIncompleteDraft = next._status !== 'published' && !originalDoc?.combinationKey
    const productID = relationID(next.product)
    if (productID == null && canSaveIncompleteDraft)
      return { ...data, sku: sku || null, combinationKey: null }
    if (productID == null) reject(req, 'product', 'Seleccioná un producto.', 'Select a product.')
    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      req,
      overrideAccess: true,
      depth: 0,
      draft: next._status !== 'published',
    })
    const expected = configuredVariantTypes(product.variantTypes)
    const options: unknown[] = Array.isArray(next.options) ? next.options : []
    if (!options.length && canSaveIncompleteDraft)
      return { ...data, sku: sku || null, combinationKey: null }
    if (product.enableVariants !== true || !expected.length)
      reject(
        req,
        'product',
        'Activá las variantes y configurá sus tipos de opción en el producto. Si el producto ya está publicado, publicá esos cambios antes de publicar la variante.',
        'Enable variants and configure their option types on the product. If the product is already published, publish those changes before publishing the variant.',
      )
    const ids = options.map(relationID)
    const types: string[] = []
    for (const id of ids) {
      if (id == null)
        reject(req, 'options', 'Seleccioná opciones válidas.', 'Select valid options.')
      const option = await req.payload.findByID({
        collection: 'variantOptions',
        id,
        req,
        overrideAccess: true,
        depth: 0,
      })
      const typeID = relationID(option.variantType)
      if (typeID == null)
        reject(
          req,
          'options',
          'Seleccioná opciones con un tipo válido.',
          'Select options with a valid type.',
        )
      types.push(String(typeID))
    }
    const hasCompleteOptions = hasCompleteVariantOptions(expected, types)
    if (
      !hasCompleteOptions &&
      canSaveIncompleteDraft &&
      new Set(types).size === types.length &&
      types.every((type) => expected.includes(type))
    )
      return { ...data, sku: sku || null, combinationKey: null }
    if (!hasCompleteOptions)
      reject(
        req,
        'options',
        'Elegí exactamente un valor por tipo de opción del producto.',
        'Choose exactly one value per product option type.',
      )
    combinationKey = `${productID}:${ids.map(String).sort().join(',')}`
    if (originalDoc?.combinationKey && originalDoc.combinationKey !== combinationKey)
      reject(
        req,
        'options',
        'La combinación es estable. Creá otra variante para vender otras opciones.',
        'The combination is stable. Create another variant for different options.',
      )
    const duplicates = await req.payload.find({
      collection: 'variants',
      req,
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: {
        and: [
          { combinationKey: { equals: combinationKey } },
          { deletedAt: { equals: null } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    })
    if (duplicates.docs.length)
      reject(req, 'options', 'Esta combinación ya existe.', 'This combination already exists.')
  }
  return { ...data, sku: sku || null, ...(isVariant ? { combinationKey } : {}) }
}
