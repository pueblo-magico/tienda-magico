import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'
import { layoutBlocks } from '../blocks'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: { es: 'Página', en: 'Page' },
    plural: { es: 'Páginas', en: 'Pages' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: { es: 'Contenido', en: 'Content' },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 400,
      },
    },
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: 'layout',
      type: 'blocks',
      blocks: layoutBlocks,
      required: true,
      admin: {
        initCollapsed: false,
      },
    },
    seoField(),
  ],
}
