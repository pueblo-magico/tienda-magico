import type { Block } from 'payload'

export const Newsletter: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: {
    singular: { es: 'Boletín', en: 'Newsletter' },
    plural: { es: 'Boletines', en: 'Newsletters' },
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'placeholder',
      type: 'text',
      localized: true,
      defaultValue: 'you@example.com',
    },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
      defaultValue: ({ locale }) => (locale === 'en' ? 'Subscribe' : 'Suscribirme'),
    },
    {
      name: 'successMessage',
      type: 'text',
      localized: true,
      defaultValue: ({ locale }) =>
        locale === 'en' ? 'Thanks for subscribing.' : 'Gracias por suscribirte.',
    },
    {
      name: 'formId',
      type: 'text',
      admin: {
        description: {
          es: 'ID opcional de formulario o lista externa (específico del proveedor).',
          en: 'Optional external form/list id (provider-specific).',
        },
      },
    },
  ],
}
