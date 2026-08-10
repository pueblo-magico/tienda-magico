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
  const appearances = options?.appearances === false
    ? null
    : (options?.appearances ?? ['primary', 'secondary', 'ghost', 'link'])

  const fields: Field[] = [
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'custom',
      options: [
        { label: 'Custom URL', value: 'custom' },
        { label: 'Internal path', value: 'internal' },
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
        description: 'Absolute URL or site path (e.g. https://… or /shop).',
      },
    },
    {
      name: 'path',
      type: 'text',
      required: options?.required ?? true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'internal',
        description: 'Locale-free path (e.g. /shop, /about). Storefront prefixes locale.',
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      label: 'Open in new tab',
      defaultValue: false,
    },
  ]

  if (appearances) {
    fields.push({
      name: 'appearance',
      type: 'select',
      defaultValue: appearances[0],
      options: appearances.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
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
