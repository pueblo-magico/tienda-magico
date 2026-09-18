import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { es: 'Configuración del sitio', en: 'Site settings' },
  admin: {
    group: { es: 'Globales', en: 'Globals' },
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Pueblo Mágico',
      localized: true,
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'shopHeroImage',
      label: {
        es: 'Imagen principal de la tienda',
        en: 'Shop hero image',
      },
      type: 'upload',
      relationTo: 'media',
      localized: true,
      admin: {
        description: {
          es: 'Imagen horizontal de fondo para el encabezado principal de la tienda.',
          en: 'Horizontal background image for the main shop header.',
        },
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'social',
      type: 'array',
      labels: {
        singular: { es: 'Enlace social', en: 'Social link' },
        plural: { es: 'Enlaces sociales', en: 'Social links' },
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'X / Twitter', value: 'x' },
            { label: 'TikTok', value: 'tiktok' },
            { label: { es: 'Otra', en: 'Other' }, value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          admin: {
            description: {
              es: 'Etiqueta accesible alternativa.',
              en: 'Accessible label override.',
            },
          },
        },
      ],
    },
    {
      name: 'defaultLocale',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: { es: 'Inglés', en: 'English' }, value: 'en' },
        { label: { es: 'Español', en: 'Spanish' }, value: 'es' },
      ],
      admin: {
        description: {
          es: 'Informativo; el enrutamiento de la tienda controla el idioma activo.',
          en: 'Informational; storefront routing still owns active locale.',
        },
      },
    },
  ],
}
