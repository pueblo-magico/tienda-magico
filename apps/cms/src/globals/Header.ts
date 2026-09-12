import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { linkField } from '../fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  label: { es: 'Encabezado', en: 'Header' },
  admin: {
    group: { es: 'Globales', en: 'Globals' },
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
        description: {
          es: 'Logo alternativo opcional. La tienda usa la marca denominativa como respaldo.',
          en: 'Optional logo override. Storefront falls back to wordmark.',
        },
      },
    },
    {
      name: 'navItems',
      type: 'array',
      labels: {
        singular: { es: 'Elemento de navegación', en: 'Nav item' },
        plural: { es: 'Elementos de navegación', en: 'Nav items' },
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
      label: { es: 'Llamado a la acción del encabezado', en: 'Header CTA' },
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
