import type { CollectionConfig, PayloadRequest } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { publicVisibleOrAdmin } from '../access/publicOrAdmin'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: { es: 'Marca', en: 'Brand' }, plural: { es: 'Marcas', en: 'Brands' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'countryCode', 'isActive', 'updatedAt'],
    group: { es: 'Tienda', en: 'Shop' },
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
        description: {
          es: 'Identidad estable compartida entre español e inglés.',
          en: 'Stable identity shared between EN and ES.',
        },
      },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'countryCode',
      type: 'text',
      admin: {
        description: {
          es: 'Código ISO 3166-1 alfa-2 opcional, por ejemplo AR.',
          en: 'Optional ISO 3166-1 alpha-2 code, for example AR.',
        },
      },
    },
    {
      name: 'website',
      type: 'text',
      validate: (value: unknown, { req }: { req: PayloadRequest }) => {
        const message = (es: string, en: string) => (req.locale === 'en' ? en : es)
        if (!value) return true
        if (typeof value !== 'string')
          return message('El sitio web debe ser una URL.', 'Website must be a URL.')
        try {
          const url = new URL(value)
          return url.protocol === 'https:' || url.protocol === 'http:'
            ? true
            : message('El sitio web debe usar http o https.', 'Website must use http or https.')
        } catch {
          return message('El sitio web debe ser una URL válida.', 'Website must be a valid URL.')
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
