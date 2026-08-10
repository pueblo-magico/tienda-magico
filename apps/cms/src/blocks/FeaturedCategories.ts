import type { Block } from 'payload'

export const FeaturedCategories: Block = {
  slug: 'featuredCategories',
  interfaceName: 'FeaturedCategoriesBlock',
  labels: {
    singular: 'Featured categories',
    plural: 'Featured categories blocks',
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
        { label: 'Manual categories', value: 'manual' },
        { label: 'Latest categories', value: 'latest' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'manual',
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
