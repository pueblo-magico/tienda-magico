import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'
import { richTextField } from '../fields/richText'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: 'FAQ',
    plural: 'FAQs',
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', '_status', 'updatedAt'],
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
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
    },
    richTextField({
      name: 'answer',
      required: true,
    }),
    {
      name: 'category',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Grouping key (e.g. shipping, products). Used by FAQ blocks.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
