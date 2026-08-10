import type { Block } from 'payload'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: {
    singular: 'Testimonials',
    plural: 'Testimonials blocks',
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
        { label: 'Latest published', value: 'latest' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'manual',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        condition: (_, siblingData) => siblingData?.selection === 'latest',
      },
    },
  ],
}
