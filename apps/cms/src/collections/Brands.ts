import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { publicVisibleOrAdmin } from '../access/publicOrAdmin'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'countryCode', 'isActive', 'updatedAt'],
    group: 'Shop',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicVisibleOrAdmin('isActive'),
    update: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      localized: false,
      admin: {
        position: 'sidebar',
        description: 'Stable identity shared between EN and ES.',
      },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'countryCode',
      type: 'text',
      admin: { description: 'Optional ISO 3166-1 alpha-2 code, for example AR.' },
    },
    {
      name: 'website',
      type: 'text',
      validate: (value: unknown) => {
        if (!value) return true
        if (typeof value !== 'string') return 'Website must be a URL.'
        try {
          const url = new URL(value)
          return url.protocol === 'https:' || url.protocol === 'http:'
            ? true
            : 'Website must use http or https.'
        } catch {
          return 'Website must be a valid URL.'
        }
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
