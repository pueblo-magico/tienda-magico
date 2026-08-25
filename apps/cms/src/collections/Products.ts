import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Extends the ecommerce plugin products collection.
 *
 * Note: the plugin default does NOT ship a `title` field — the official
 * ecommerce template adds it via override. We do the same here.
 *
 * Localized copy fields: title, description, summary, tags.
 * Shared across locales: slug (stable storefront handle), gallery, category, pricing.
 */
export const productsCollectionOverride: CollectionOverride = ({ defaultCollection }) => {
  const catalogueFields = [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      // Shared handle so /en and /es resolve the same product document
      localized: false,
      admin: {
        position: 'sidebar',
        description: 'URL estable, escrito principalmente en español y compartido entre idiomas (p. ej. cacao-de-montana).',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short plain-text blurb for cards and listings.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: {
        singular: 'Image',
        plural: 'Gallery',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
  ] as Field[]

  return {
    ...defaultCollection,
    admin: {
      ...defaultCollection.admin,
      useAsTitle: 'title',
      defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
      group: 'Shop',
    },
    defaultPopulate: {
      ...(defaultCollection.defaultPopulate ?? {}),
      title: true,
      slug: true,
      enableVariants: true,
      variants: true,
      gallery: true,
      inventory: true,
      priceInARS: true,
      category: true,
    },
    fields: [...catalogueFields, ...(defaultCollection.fields ?? [])],
  }
}
