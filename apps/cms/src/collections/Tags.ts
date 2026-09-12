import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { publicVisibleOrAdmin } from '../access/publicOrAdmin'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: { es: 'Etiqueta', en: 'Tag' }, plural: { es: 'Etiquetas', en: 'Tags' } },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'slug', 'group', 'isVisible'],
    group: { es: 'Tienda', en: 'Shop' },
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicVisibleOrAdmin('isVisible'),
    update: adminOnly,
  },
  fields: [
    { name: 'label', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      localized: false,
      admin: {
        position: 'sidebar',
        description: {
          es: 'Identidad estable compartida entre español e inglés.',
          en: 'Stable identity shared between EN and ES.',
        },
      },
    },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'group', type: 'text' },
    {
      name: 'isVisible',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
