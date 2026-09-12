import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook, Field } from 'payload'

const templates = [
  { key: 'ingredients', es: 'Ingredientes y materiales', en: 'Ingredients & materials' },
  { key: 'how-to-use', es: 'Cómo usar', en: 'How to use' },
  { key: 'origin-impact', es: 'Origen e impacto', en: 'Origin & impact' },
  { key: 'care', es: 'Cuidados', en: 'Care' },
]

export const informationSectionsField: Field = {
  name: 'informationSections',
  type: 'array',
  label: { es: 'Información adicional', en: 'Additional information' },
  admin: {
    description: {
      es: 'Ordená las secciones arrastrándolas. Traducí título y contenido en cada idioma. Las secciones ocultas o vacías no aparecen en la tienda. No ingreses información interna.',
      en: 'Drag sections to reorder. Translate title and content in each locale. Hidden or empty sections do not appear in the shop. Public information only.',
    },
  },
  defaultValue: ({ locale }) =>
    templates.map((template) => ({
      key: template.key,
      title: locale === 'en' ? template.en : template.es,
      isVisible: true,
    })),
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      label: { es: 'Clave estable', en: 'Stable key' },
      admin: {
        description: {
          es: 'Identificador único, por ejemplo cuidados. Una vez guardado no se puede cambiar; el título sí.',
          en: 'Unique identifier, e.g. care. It cannot change after saving; the title can.',
        },
      },
    },
    { name: 'title', type: 'text', localized: true, label: { es: 'Título', en: 'Title' } },
    { name: 'body', type: 'richText', localized: true, label: { es: 'Contenido', en: 'Content' } },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: { es: 'Visible en la tienda', en: 'Visible in shop' },
    },
  ],
}

export const validateInformationSections: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || !Array.isArray(data.informationSections)) return data
  const previous = new Map<string, unknown>()
  for (const row of originalDoc?.informationSections ?? []) {
    if (row?.id) previous.set(String(row.id), row.key)
  }
  const keys = new Set<string>()
  for (const [index, row] of data.informationSections.entries()) {
    const key = row?.key
    if (
      typeof key !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) ||
      keys.has(key) ||
      (row.id && previous.has(String(row.id)) && previous.get(String(row.id)) !== key)
    ) {
      throw new ValidationError({
        errors: [
          {
            path: `informationSections.${index}.key`,
            message:
              req.locale === 'en'
                ? 'Use a unique lowercase key with hyphens. Saved keys cannot change; edit the title instead.'
                : 'Usá una clave única en minúsculas y con guiones. Las claves guardadas no cambian; editá el título.',
          },
        ],
      })
    }
    keys.add(key)
  }
  return data
}
