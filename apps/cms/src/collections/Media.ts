import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { validateMediaUploadSize } from './mediaUploadValidation'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  hooks: {
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
