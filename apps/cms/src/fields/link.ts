import type { Field } from 'payload'

export type LinkAppearances = 'default' | 'primary' | 'secondary' | 'ghost' | 'link'

/** Reusable CTA / nav link field group. */
export const linkField = (options?: {
  name?: string
  appearances?: LinkAppearances[] | false
  disableLabel?: boolean
  required?: boolean
}): Field => {
  const name = options?.name ?? 'link'
  const appearances =
    options?.appearances === false
      ? null
      : (options?.appearances ?? ['primary', 'secondary', 'ghost', 'link'])

  const fields: Field[] = [
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'custom',
      options: [
        { label: { es: 'URL personalizada', en: 'Custom URL' }, value: 'custom' },
        { label: { es: 'Ruta interna', en: 'Internal path' }, value: 'internal' },
      ],
      admin: {
        layout: 'horizontal',
      },
    },
    {
      name: 'label',
      type: 'text',
      localized: true,
      required: options?.required ?? true,
      admin: {
        condition: () => !options?.disableLabel,
      },
    },
    {
      name: 'url',
      type: 'text',
      required: options?.required ?? true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
        description: {
          es: 'URL absoluta o ruta del sitio (p. ej. https://… o /shop).',
          en: 'Absolute URL or site path (e.g. https://… or /shop).',
        },
      },
    },
    {
      name: 'path',
      type: 'text',
      required: options?.required ?? true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'internal',
        description: {
          es: 'Ruta sin idioma (p. ej. /shop, /about). La tienda agrega el idioma.',
          en: 'Locale-free path (e.g. /shop, /about). Storefront prefixes locale.',
        },
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      label: { es: 'Abrir en una pestaña nueva', en: 'Open in new tab' },
      defaultValue: false,
    },
  ]

  if (appearances) {
    fields.push({
      name: 'appearance',
      type: 'select',
      defaultValue: appearances[0],
      options: appearances.map((value) => ({
        label: {
          es:
            (
              {
                primary: 'Principal',
                secondary: 'Secundaria',
                ghost: 'Discreta',
                link: 'Enlace',
                default: 'Predeterminada',
              } as Record<string, string>
            )[value] ?? value,
          en: value.charAt(0).toUpperCase() + value.slice(1),
        },
        value,
      })),
    })
  }

  return {
    name,
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields,
  }
}
