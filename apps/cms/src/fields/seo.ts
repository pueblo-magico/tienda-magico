import type { Field } from 'payload'

/** Page/post SEO group (localized title/description). */
export const seoField = (options?: { name?: string }): Field => ({
  name: options?.name ?? 'seo',
  type: 'group',
  label: { es: 'SEO', en: 'SEO' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: {
          es: 'Reemplaza el título del documento en <title> y og:title.',
          en: 'Overrides document title in <title> / og:title when set.',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: {
          es: 'Imagen para compartir en redes (Open Graph).',
          en: 'Social share image (Open Graph).',
        },
      },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      label: { es: 'Ocultar de buscadores (noindex)', en: 'Hide from search engines (noindex)' },
    },
  ],
})
