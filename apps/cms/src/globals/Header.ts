import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { linkField } from '../fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Globals',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional logo override. Storefront falls back to wordmark.',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      labels: {
        singular: 'Nav item',
        plural: 'Nav items',
      },
      maxRows: 10,
      fields: [
        linkField({
          name: 'link',
          appearances: false,
        }),
      ],
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Header CTA',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        linkField({
          name: 'link',
          appearances: ['primary', 'secondary'],
          required: false,
        }),
      ],
    },
  ],
}
