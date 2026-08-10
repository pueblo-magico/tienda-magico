import type { Block } from 'payload'

export const FeaturedProducts: Block = {
  slug: 'featuredProducts',
  interfaceName: 'FeaturedProductsBlock',
  labels: {
    singular: 'Featured products',
    plural: 'Featured products blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'selection',
      type: 'radio',
      defaultValue: 'manual',
      options: [
        { label: 'Manual products', value: 'manual' },
        { label: 'By category', value: 'category' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'manual',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'category',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 4,
      min: 1,
      max: 24,
    },
  ],
}
