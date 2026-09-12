import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { validateMediaUploadSize } from './mediaUploadValidation'
import {
  revalidateStorefrontMedia,
  revalidateStorefrontMediaDelete,
} from '../hooks/revalidateStorefrontCatalog'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { es: 'Medio', en: 'Media item' }, plural: { es: 'Medios', en: 'Media' } },
  admin: {
    group: { es: 'Contenido', en: 'Content' },
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateStorefrontMedia],
    afterDelete: [revalidateStorefrontMediaDelete],
    beforeValidate: [validateMediaUploadSize],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'],
  },
}
