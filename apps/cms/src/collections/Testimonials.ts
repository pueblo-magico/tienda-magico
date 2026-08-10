import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', '_status', 'updatedAt'],
    group: 'Content',
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
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      admin: {
        description: 'Title or context (e.g. Guest · Valle de Bravo).',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        step: 1,
        description: 'Optional 1–5 star rating.',
      },
    },
  ],
}
