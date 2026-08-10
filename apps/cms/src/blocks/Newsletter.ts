import type { Block } from 'payload'

export const Newsletter: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: {
    singular: 'Newsletter',
    plural: 'Newsletters',
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
      defaultValue: 'Subscribe',
    },
    {
      name: 'successMessage',
      type: 'text',
      localized: true,
      defaultValue: 'Thanks for subscribing.',
    },
    {
      name: 'formId',
      type: 'text',
      admin: {
        description: 'Optional external form/list id (provider-specific).',
      },
    },
  ],
}
