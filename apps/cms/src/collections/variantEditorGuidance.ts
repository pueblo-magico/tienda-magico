import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field } from 'payload'
import { protectPublishedVariant, protectDeletedVariant } from './productPublication'

type Copy = { en: string; es: string }
const guidance: Record<string, { label: Copy; description: Copy }> = {
  enableVariants: {
    label: { en: 'Sell this product in variants', es: 'Vender este producto en variantes' },
    description: {
      en: 'For sizes such as 15g / 20g. Select option types, then create and publish a sellable variant for each size. Options alone do not create stock or prices.',
      es: 'Para tamaños como 15g / 20g. Elegí los tipos de opción y después creá y publicá una variante vendible por tamaño. Las opciones solas no crean stock ni precios.',
    },
  },
  variantTypes: {
    label: { en: '1. Option types (e.g. Size)', es: '1. Tipos de opción (p. ej. Tamaño)' },
    description: {
      en: 'Reusable choices only. Save the product before creating its sellable variants below.',
      es: 'Solo definen opciones reutilizables. Guardá el producto antes de crear sus variantes vendibles abajo.',
    },
  },
  variants: {
    label: {
      en: '2. Sellable variants — price and stock',
      es: '2. Variantes vendibles — precio y stock',
    },
    description: {
      en: 'Create one record per combination. Select its options, enable ARS, enter its price and stock, then Publish. An empty list or draft-only variants cannot be purchased.',
      es: 'Creá un registro por combinación. Seleccioná sus opciones, activá ARS, ingresá precio y stock, y publicá. Una lista vacía o variantes solo en borrador no permiten comprar.',
    },
  },
  options: {
    label: { en: 'Option values', es: 'Opciones' },
    description: {
      en: 'Choose one value per option type. Define the selling price separately below.',
      es: 'Elegí un valor por tipo de opción. El precio de venta se define por separado abajo.',
    },
  },
  value: {
    label: { en: 'Option code — NOT a price', es: 'Código de opción — NO es un precio' },
    description: {
      en: 'Stable identifier, e.g. 20g. Never enter a selling price here. Set prices on sellable variants.',
      es: 'Identificador estable, p. ej. 20g. No ingreses el precio aquí. Los precios se cargan en las variantes vendibles.',
    },
  },
  inventory: {
    label: { en: 'Available units', es: 'Unidades disponibles' },
    description: {
      en: 'Stock for this sellable item. Zero means sold out. For variant products, edit stock on each variant.',
      es: 'Stock de este artículo vendible. Cero significa agotado. Si tiene variantes, editá el stock de cada variante.',
    },
  },
  priceInARS: {
    label: { en: 'Selling price (ARS)', es: 'Precio de venta (ARS)' },
    description: {
      en: 'Selling price of this item. For products with variants, set the price inside each sellable variant; the parent price is not used.',
      es: 'Precio de este artículo. En productos con variantes, cargá el precio dentro de cada variante vendible; no se usa el precio del producto principal.',
    },
  },
}

/** Presentation-only overrides: preserve plugin validation, access and storage paths. */
export function clarifyVariantFields(fields: Field[]): Field[] {
  return fields.map((original) => {
    let field = original
    if ('fields' in field) field = { ...field, fields: clarifyVariantFields(field.fields) }
    if ('name' in field && field.name && guidance[field.name]) {
      const copy = guidance[field.name]
      field = {
        ...field,
        label: copy.label,
        admin: { ...field.admin, description: copy.description },
      } as Field
    }
    return field
  })
}

export const variantsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), protectPublishedVariant],
    beforeDelete: [...(defaultCollection.hooks?.beforeDelete ?? []), protectDeletedVariant],
  },
  admin: {
    ...defaultCollection.admin,
    description: {
      en: 'Each record is a purchasable combination with its own ARS price and stock. Save and publish every variant, not only the parent product.',
      es: 'Cada registro es una combinación comprable con precio ARS y stock propios. Guardá y publicá cada variante, no solo el producto principal.',
    },
  },
  fields: clarifyVariantFields(defaultCollection.fields),
})

export const variantOptionsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    description: {
      en: 'Reusable labels such as 15g and 20g. These are not sellable variants and have no prices or stock.',
      es: 'Etiquetas reutilizables como 15g y 20g. No son variantes vendibles y no tienen precio ni stock.',
    },
  },
  fields: clarifyVariantFields(defaultCollection.fields),
})
