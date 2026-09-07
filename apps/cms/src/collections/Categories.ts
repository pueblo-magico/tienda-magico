import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { publicVisibleOrAdmin } from '../access/publicOrAdmin'
import { preventCategoryCycles } from './categoryHierarchy'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Shop',
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
        description: 'URL canónica en español, compartida entre idiomas.',
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
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional parent used for category context and breadcrumbs.',
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
