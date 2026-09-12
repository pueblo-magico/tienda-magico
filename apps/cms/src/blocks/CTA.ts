import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const CTA: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: {
    singular: { es: 'Llamado a la acción', en: 'CTA' },
    plural: { es: 'Llamados a la acción', en: 'CTAs' },
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
        { label: { es: 'Marca', en: 'Brand' }, value: 'brand' },
        { label: { es: 'Arena', en: 'Sand' }, value: 'sand' },
        { label: { es: 'Contorno', en: 'Outline' }, value: 'outline' },
      ],
    },
  ],
}
