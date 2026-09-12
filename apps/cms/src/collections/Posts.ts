import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'
import { richTextField } from '../fields/richText'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: { es: 'Publicación', en: 'Post' },
    plural: { es: 'Publicaciones', en: 'Posts' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt', '_status', 'updatedAt'],
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
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          es: 'Resumen breve para tarjetas y listados.',
          en: 'Short summary for cards and listings.',
        },
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    richTextField({
      name: 'content',
      required: true,
    }),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    seoField(),
  ],
}
