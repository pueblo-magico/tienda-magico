import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field } from 'payload'
import { clarifyVariantFields } from './variantEditorGuidance'
import { normalizeProductCategories } from './productClassificationHooks'
import { validateProductPublication } from './productPublication'
import { informationSectionsField, validateInformationSections } from './productSections'
import { validateProductMedia } from './productMediaValidation'
import { seoField } from '../fields/seo'
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
  const documentLocaleSwitcher = {
    path: '@/components/DocumentLocaleSwitcher',
    exportName: 'default',
  }
  const contentFields = [
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
    informationSectionsField,
    seoField(),
  ] as Field[]

  const mediaFields = [
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
          admin: {
            description: {
              es: 'Imagen o poster editorial opcional para un video externo. Si queda vacío, se genera una miniatura de YouTube.',
              en: 'Optional editorial image or poster for an external video. If empty, a YouTube thumbnail is generated.',
            },
          },
        },
        {
          name: 'externalVideoUrl',
          type: 'text',
          label: { es: 'Video externo (YouTube)', en: 'External video (YouTube)' },
          admin: {
            description: {
              es: 'Acepta solo enlaces youtube.com o youtu.be. No pegues código iframe.',
              en: 'Only youtube.com or youtu.be links are accepted. Do not paste iframe code.',
            },
          },
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          defaultValue: false,
          label: { es: 'Imagen principal', en: 'Primary media' },
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
          label: { es: 'Pie de foto', en: 'Caption' },
        },
      ],
    },
  ] as Field[]

  const classificationFields = [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
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
        description: 'Optional extra browsing categories. Do not repeat the primary category.',
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
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
    {
      name: 'countryOfOrigin',
      type: 'text',
      label: { es: 'País de origen (ISO)', en: 'Country of origin (ISO)' },
      localized: false,
      admin: {
        description: {
          es: 'Código ISO 3166-1 alpha-2 compartido entre idiomas, por ejemplo AR o BR.',
          en: 'ISO 3166-1 alpha-2 code shared between locales, for example AR or BR.',
        },
      },
      validate: (value: unknown) => {
        if (value == null || value === '') return true
        return typeof value === 'string' && /^[A-Z]{2}$/.test(value.trim())
          ? true
          : 'Usá un código ISO de dos letras mayúsculas, por ejemplo AR.'
      },
    },
    {
      name: 'region',
      type: 'text',
      localized: true,
      label: { es: 'Región', en: 'Region' },
    },
    {
      name: 'community',
      type: 'text',
      localized: true,
      label: { es: 'Comunidad', en: 'Community' },
    },
    {
      name: 'originStory',
      type: 'richText',
      localized: true,
      label: { es: 'Historia pública de origen', en: 'Public origin story' },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      admin: {
        description: {
          es: 'Contenido público. Cuando existe, reemplaza el cuerpo legado de la sección “Origen e impacto” para evitar duplicados.',
          en: 'Public content. When present, it replaces the legacy Origin & impact section body to avoid duplication.',
        },
      },
    },
  ] as Field[]

  const merchandisingFields = [
    {
      name: 'lifecycleStatus',
      type: 'select' as const,
      defaultValue: 'active',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Discontinuado', value: 'discontinued' },
      ],
      admin: {
        description: 'Los productos discontinuados siguen visibles, pero no se pueden comprar.',
      },
    },
    ...clarifyVariantFields(defaultCollection.fields ?? []),
  ]

  return {
    ...defaultCollection,
    admin: {
      ...defaultCollection.admin,
      useAsTitle: 'title',
      defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
      group: 'Shop',
      components: {
        ...defaultCollection.admin?.components,
        edit: {
          ...defaultCollection.admin?.components?.edit,
          beforeDocumentControls: [documentLocaleSwitcher],
        },
      },
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
      countryOfOrigin: true,
      region: true,
      community: true,
      originStory: true,
      seo: true,
    },
    hooks: {
      ...defaultCollection.hooks,
      beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), validateProductPublication],
      beforeValidate: [
        ...(defaultCollection.hooks?.beforeValidate ?? []),
        normalizeProductCategories,
        validateInformationSections,
        validateProductMedia,
      ],
    },
    fields: [
      {
        type: 'tabs',
        tabs: [
          {
            label: { es: 'Contenido', en: 'Content' },
            fields: contentFields,
          },
          {
            label: { es: 'Clasificación y origen', en: 'Classification and origin' },
            fields: classificationFields,
          },
          {
            label: { es: 'Medios', en: 'Media' },
            fields: mediaFields,
          },
          {
            label: { es: 'Venta e inventario', en: 'Sales and inventory' },
            fields: merchandisingFields,
          },
        ],
      },
    ],
  }
}
