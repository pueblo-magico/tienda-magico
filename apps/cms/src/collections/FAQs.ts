import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'
import { richTextField } from '../fields/richText'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: { es: 'Pregunta frecuente', en: 'FAQ' },
    plural: { es: 'Preguntas frecuentes', en: 'FAQs' },
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', '_status', 'updatedAt'],
    group: { es: 'Contenido', en: 'Content' },
  },
  versions: {
    drafts: true,
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
    },
    richTextField({
      name: 'answer',
      required: true,
    }),
    {
      name: 'category',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: {
          es: 'Clave de agrupación (p. ej. envíos, productos). La usan los bloques de preguntas frecuentes.',
          en: 'Grouping key (e.g. shipping, products). Used by FAQ blocks.',
        },
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
