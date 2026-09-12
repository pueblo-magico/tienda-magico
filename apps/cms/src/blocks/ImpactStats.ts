import type { Block } from 'payload'

export const ImpactStats: Block = {
  slug: 'impactStats',
  interfaceName: 'ImpactStatsBlock',
  labels: {
    singular: { es: 'Estadísticas de impacto', en: 'Impact stats' },
    plural: { es: 'Bloques de estadísticas de impacto', en: 'Impact stats blocks' },
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
      name: 'stats',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      required: true,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: {
              es: 'Valor visible (p. ej. 120+, 3 mil).',
              en: 'Display value (e.g. 120+, 3k).',
            },
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}
