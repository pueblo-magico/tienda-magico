import { ValidationError } from 'payload'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionBeforeChangeHook, Field } from 'payload'
import { configuredVariantTypes, hasCompleteVariantOptions, relationID } from './sellableItems'

export const validateCartItems: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const next = { ...originalDoc, ...data }
  const fail = (): never => {
    throw new ValidationError({
      errors: [
        {
          path: 'items',
          message:
            req.locale === 'en'
              ? 'Review your cart: an item, price or quantity is no longer available. Remove the affected item and try again.'
              : 'Revisá tu carrito: un artículo, precio o cantidad ya no está disponible. Quitá el artículo afectado y volvé a intentar.',
        },
      ],
    })
  }
  if (next.currency !== 'ARS') fail()
  const isRemoval =
    Array.isArray(originalDoc?.items) &&
    Array.isArray(next.items) &&
    next.items.length < originalDoc.items.length &&
    next.items.every(
      (line: { id?: unknown; product?: unknown; variant?: unknown; quantity?: unknown }) =>
        originalDoc.items.some(
          (original: { id?: unknown; product?: unknown; variant?: unknown; quantity?: unknown }) =>
            original.id === line.id &&
            String(relationID(original.product)) === String(relationID(line.product)) &&
            String(relationID(original.variant)) === String(relationID(line.variant)) &&
            original.quantity === line.quantity,
        ),
    )
  if (isRemoval)
    return {
      ...data,
      currency: 'ARS',
      items: next.items.map((line: { id?: unknown }) => ({
        ...line,
        amount:
          originalDoc.items.find((original: { id?: unknown }) => original.id === line.id)?.amount ??
          null,
      })),
    }
  const quantities = new Map<string, number>()
  for (const line of next.items ?? []) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) fail()
    const productID = relationID(line.product)
    if (productID == null) return fail()
    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      req,
      overrideAccess: true,
      depth: 0,
      draft: false,
    })
    const variantID = relationID(line.variant)
    if (Boolean(product.enableVariants) !== (variantID != null)) fail()
    const item =
      variantID == null
        ? product
        : await req.payload.findByID({
            collection: 'variants',
            id: variantID,
            req,
            overrideAccess: true,
            depth: 1,
            draft: false,
          })
    if ('product' in item && String(relationID(item.product)) !== String(productID)) fail()
    if (variantID != null) {
      const expected = configuredVariantTypes(product.variantTypes)
      const options = 'options' in item && Array.isArray(item.options) ? item.options : []
      const actual = options
        .map((option) =>
          typeof option === 'object' && option ? String(relationID(option.variantType)) : '',
        )
        .sort()
      if (!hasCompleteVariantOptions(expected, actual)) fail()
    }
    const key = `${productID}:${variantID ?? ''}`
    const quantity = (quantities.get(key) ?? 0) + line.quantity
    quantities.set(key, quantity)
    if (
      product._status !== 'published' ||
      product.lifecycleStatus === 'discontinued' ||
      item._status !== 'published' ||
      item.lifecycleStatus === 'discontinued' ||
      item.priceInARSEnabled !== true ||
      !Number.isSafeInteger(item.priceInARS) ||
      (item.priceInARS ?? 0) <= 0 ||
      !Number.isSafeInteger(item.inventory) ||
      (item.inventory ?? 0) < quantity ||
      (item.oneOfAKind && quantity > 1)
    )
      fail()
    const original = originalDoc?.items?.find(
      (previous: { id?: unknown; product?: unknown; variant?: unknown }) =>
        previous.id === line.id &&
        String(relationID(previous.product)) === String(productID) &&
        String(relationID(previous.variant)) === String(variantID),
    )
    line.amount =
      !original || data.acceptCurrentPrices === true ? item.priceInARS : (original.amount ?? null)
  }
  return { ...data, currency: 'ARS', items: next.items ?? [] }
}

export const cartsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    {
      name: 'fulfillmentMode',
      type: 'select',
      required: false,
      options: [
        { label: { es: 'Retiro local', en: 'Local collection' }, value: 'local_collection' },
        { label: { es: 'Entrega', en: 'Delivery' }, value: 'delivery' },
      ],
      admin: {
        description: {
          es: 'Elegí retiro local o entrega antes de iniciar el checkout.',
          en: 'Choose local collection or delivery before starting checkout.',
        },
      },
    },
    {
      name: 'acceptCurrentPrices',
      type: 'checkbox',
      virtual: true,
      admin: { hidden: true },
      access: { read: () => false },
    },
    ...defaultCollection.fields.map<Field>((field) =>
      'name' in field && field.name === 'items' && field.type === 'array'
        ? {
            ...field,
            fields: [
              ...field.fields,
              {
                name: 'amount',
                type: 'number',
                admin: { readOnly: true },
                label: {
                  es: 'Precio unitario confirmado (centavos ARS)',
                  en: 'Confirmed unit price (ARS minor units)',
                },
              },
            ],
          }
        : field,
    ),
  ],
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [validateCartItems, ...(defaultCollection.hooks?.beforeChange ?? [])],
  },
})
