import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

/** Site-wide SEO defaults (pages can override via their own seo group). */
export const SEO: GlobalConfig = {
  slug: 'seo',
  label: { es: 'Valores predeterminados de SEO', en: 'SEO defaults' },
  admin: {
    group: { es: 'Globales', en: 'Globals' },
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
        description: { es: 'Título de respaldo del documento.', en: 'Fallback document title.' },
      },
    },
    {
      name: 'titleTemplate',
      type: 'text',
      localized: true,
      defaultValue: '%s · Pueblo Mágico',
      admin: {
        description: {
          es: 'Usá %s para el segmento del título de la página.',
          en: 'Use %s for the page title segment.',
        },
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
        description: { es: 'Sin @ (p. ej. pueblomagico).', en: 'Without @ (e.g. pueblomagico).' },
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
          label: {
            es: 'Permitir indexación de forma predeterminada',
            en: 'Allow indexing by default',
          },
        },
        {
          name: 'follow',
          type: 'checkbox',
          defaultValue: true,
          label: {
            es: 'Permitir seguir enlaces de forma predeterminada',
            en: 'Allow following links by default',
          },
        },
      ],
    },
  ],
}
