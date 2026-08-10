import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const CTA: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: {
    singular: 'CTA',
    plural: 'CTAs',
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
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'actions',
      type: 'array',
      maxRows: 2,
      fields: [linkField({ name: 'link' })],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'brand',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'Sand', value: 'sand' },
        { label: 'Outline', value: 'outline' },
      ],
    },
  ],
}
