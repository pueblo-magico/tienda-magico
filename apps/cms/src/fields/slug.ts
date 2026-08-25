import type { Field } from 'payload'

/** Stable, non-localized URL handle authored canonically in Spanish. */
export const slugField = (overrides?: Partial<Field>): Field =>
  ({
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    localized: false,
    admin: {
      position: 'sidebar',
      description: 'URL canónica en español, compartida entre idiomas (minúsculas-con-guiones).',
    },
    ...overrides,
  }) as Field
