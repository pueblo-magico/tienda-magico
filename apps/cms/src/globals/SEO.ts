import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

/** Site-wide SEO defaults (pages can override via their own seo group). */
export const SEO: GlobalConfig = {
  slug: 'seo',
  label: 'SEO defaults',
  admin: {
    group: 'Globals',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'defaultTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Fallback document title.',
      },
    },
    {
      name: 'titleTemplate',
      type: 'text',
      localized: true,
      defaultValue: '%s · Pueblo Mágico',
      admin: {
        description: 'Use %s for the page title segment.',
      },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'twitterHandle',
      type: 'text',
      admin: {
        description: 'Without @ (e.g. pueblomagico).',
      },
    },
    {
      name: 'robots',
      type: 'group',
      fields: [
        {
          name: 'index',
          type: 'checkbox',
          defaultValue: true,
          label: 'Allow indexing by default',
        },
        {
          name: 'follow',
          type: 'checkbox',
          defaultValue: true,
          label: 'Allow following links by default',
        },
      ],
    },
  ],
}
