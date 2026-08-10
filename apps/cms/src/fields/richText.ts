import type { Field } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const defaultLexical = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const richTextField = (overrides: Partial<Field> & { name: string }): Field =>
  ({
    type: 'richText',
    editor: defaultLexical,
    localized: true,
    ...overrides,
  }) as Field
