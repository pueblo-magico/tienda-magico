import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOrPublishedStatus } from '../access/adminOrPublishedStatus'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: { es: 'Testimonio', en: 'Testimonial' },
    plural: { es: 'Testimonios', en: 'Testimonials' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', '_status', 'updatedAt'],
    group: { es: 'Contenido', en: 'Content' },
  },
  versions: {
    drafts: true,
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      admin: {
        description: {
          es: 'Título o contexto (p. ej. Huésped · Valle de Bravo).',
          en: 'Title or context (e.g. Guest · Valle de Bravo).',
        },
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        step: 1,
        description: {
          es: 'Calificación opcional de 1 a 5 estrellas.',
          en: 'Optional 1–5 star rating.',
        },
      },
    },
  ],
}
