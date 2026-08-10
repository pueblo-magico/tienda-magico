import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { linkField } from '../fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Globals',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'tagline',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'columns',
      type: 'array',
      maxRows: 4,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'links',
          type: 'array',
          fields: [
            linkField({
              name: 'link',
              appearances: false,
            }),
          ],
        },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      labels: {
        singular: 'Legal link',
        plural: 'Legal links',
      },
      fields: [
        linkField({
          name: 'link',
          appearances: false,
        }),
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional override. Storefront can append the year.',
      },
    },
  ],
}
