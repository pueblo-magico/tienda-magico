import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: {
    singular: 'FAQ',
    plural: 'FAQ blocks',
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
      name: 'selection',
      type: 'radio',
      defaultValue: 'manual',
      options: [
        { label: 'Manual pick', value: 'manual' },
        { label: 'By category', value: 'category' },
        { label: 'All published', value: 'all' },
      ],
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'manual',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'category',
        description: 'Matches FAQ category field (e.g. shipping).',
      },
    },
  ],
}
