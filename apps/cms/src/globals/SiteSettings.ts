import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOnlyFieldAccess } from '../access/adminOnlyFieldAccess'
import { configureCashStaff } from '../utilities/cashStaffAccess'

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
      name: 'cashStaffEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: { es: 'Habilitar caja en la tienda', en: 'Enable storefront cash desk' },
      access: { read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
    },
    {
      name: 'cashStaffPassword',
      type: 'text',
      virtual: true,
      label: { es: 'Nueva contraseña de caja', en: 'New cash desk password' },
      access: { read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      hooks: { afterRead: [() => ''] },
      admin: {
        components: { Field: '@/components/StaffCashPassword#StaffCashPassword' },
        description: {
          es: 'Entre 12 y 128 caracteres. Dejá vacío para conservar la contraseña. Cambiarla o deshabilitar caja cierra las sesiones del equipo.',
          en: '12–128 characters. Leave blank to keep the password. Changing it or disabling the cash desk signs staff out.',
        },
      },
    },
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
  hooks: { beforeChange: [configureCashStaff] },
}
