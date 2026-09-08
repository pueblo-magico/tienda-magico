import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field } from 'payload'
import { clarifyVariantFields } from './variantEditorGuidance'
import { normalizeProductCategories } from './productClassificationHooks'
import { validateProductPublication } from './productPublication'
import { informationSectionsField, validateInformationSections } from './productSections'
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
 * Localized copy fields: title, description, summary, legacy tags.
 * Shared across locales: slug, gallery, classifications, and pricing.
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
        description:
          'URL estable, escrito principalmente en español y compartido entre idiomas (p. ej. cacao-de-montana).',
      },
    },
    {
      name: 'description',
      label: { es: 'Descripción completa', en: 'Full description' },
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
      label: { es: 'Descripción corta', en: 'Short description' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          es: 'Texto breve junto al precio y los controles de compra. La descripción completa se muestra en el acordeón.',
          en: 'Short copy beside the price and purchase controls. The full description appears in the accordion.',
        },
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
        description: 'Primary category. It owns the storefront breadcrumb path.',
      },
    },
    {
      name: 'additionalCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: ({ siblingData }) => {
        const primary = (siblingData as { category?: unknown } | undefined)?.category
        const primaryId =
          primary && typeof primary === 'object' && 'id' in primary ? primary.id : primary
        return primaryId ? { id: { not_equals: primaryId } } : true
      },
      admin: {
        position: 'sidebar',
        description: 'Optional extra browsing categories. Do not repeat the primary category.',
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: { position: 'sidebar' },
    },
    {
      name: 'taxonomyTags',
      label: 'Public tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Reusable public labels. Operational labels do not belong here.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      localized: true,
      admin: {
        readOnly: true,
        description:
          'Legacy free-text tags preserved for migration review. Assign reusable Public tags above.',
      },
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
      additionalCategories: true,
      brand: true,
      taxonomyTags: true,
    },
    hooks: {
      ...defaultCollection.hooks,
      beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), validateProductPublication],
      beforeValidate: [
        ...(defaultCollection.hooks?.beforeValidate ?? []),
        normalizeProductCategories,
        validateInformationSections,
      ],
    },
    fields: [...catalogueFields, informationSectionsField, ...clarifyVariantFields(defaultCollection.fields ?? [])],
  }
}
