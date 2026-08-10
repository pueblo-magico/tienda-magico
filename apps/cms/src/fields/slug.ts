import type { Field } from 'payload'

/** Stable, non-localized URL handle. */
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
      description: 'Stable URL handle shared across languages (lowercase-kebab).',
    },
    ...overrides,
  }) as Field
