import type { Field } from 'payload'

/** Page/post SEO group (localized title/description). */
export const seoField = (options?: { name?: string }): Field => ({
  name: options?.name ?? 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Overrides document title in <title> / og:title when set.',
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
        description: 'Social share image (Open Graph).',
      },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hide from search engines (noindex)',
    },
  ],
})
