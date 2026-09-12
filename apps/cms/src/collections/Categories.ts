import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { publicVisibleOrAdmin } from '../access/publicOrAdmin'
import { preventCategoryCycles } from './categoryHierarchy'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { es: 'Categoría', en: 'Category' },
    plural: { es: 'Categorías', en: 'Categories' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: { es: 'Tienda', en: 'Shop' },
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicVisibleOrAdmin('isVisible'),
    update: adminOnly,
  },
  hooks: {
    beforeChange: [preventCategoryCycles],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      // Spanish canonical handle shared across locales
      localized: false,
      admin: {
        position: 'sidebar',
        description: {
          es: 'URL canónica en español, compartida entre idiomas.',
          en: 'Canonical Spanish URL shared between languages.',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: {
          es: 'Opcional. Se muestra antes que el icono.',
          en: 'Optional. Displayed before the icon.',
        },
      },
    },
    {
      name: 'icon',
      type: 'select',
      options: [
        { label: { es: '♧  Hoja', en: '♧  Leaf' }, value: 'leaf' },
        { label: { es: '⌃  Montaña', en: '⌃  Mountain' }, value: 'mountain' },
        { label: { es: '☼  Sol', en: '☼  Sun' }, value: 'sun' },
        { label: { es: '♨  Ritual', en: '♨  Ritual' }, value: 'ritual' },
        { label: { es: '♡  Corazón', en: '♡  Heart' }, value: 'heart' },
      ],
      admin: {
        description: {
          es: 'Opcional. Se usa cuando no hay imagen.',
          en: 'Optional. Used when no image is available.',
        },
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: {
          es: 'Categoría superior opcional para contexto y navegación.',
          en: 'Optional parent used for category context and breadcrumbs.',
        },
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'seo',
      type: 'group',
      localized: true,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
