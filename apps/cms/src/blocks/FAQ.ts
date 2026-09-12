import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: {
    singular: { es: 'Preguntas frecuentes', en: 'FAQ' },
    plural: { es: 'Bloques de preguntas frecuentes', en: 'FAQ blocks' },
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
        { label: { es: 'Selección manual', en: 'Manual pick' }, value: 'manual' },
        { label: { es: 'Por categoría', en: 'By category' }, value: 'category' },
        { label: { es: 'Todas las publicadas', en: 'All published' }, value: 'all' },
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
        description: {
          es: 'Coincide con la categoría de preguntas frecuentes (p. ej. envíos).',
          en: 'Matches FAQ category field (e.g. shipping).',
        },
      },
    },
  ],
}
