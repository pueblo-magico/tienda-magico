import type { Block } from 'payload'

import { linkField } from '../fields/link'
import { richTextField } from '../fields/richText'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: { es: 'Portada', en: 'Hero' },
    plural: { es: 'Portadas', en: 'Heroes' },
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
    },
    richTextField({
      name: 'body',
      required: false,
    }),
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'mediaPosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: { es: 'Fondo', en: 'Background' }, value: 'background' },
        { label: { es: 'Derecha', en: 'Right' }, value: 'right' },
        { label: { es: 'Izquierda', en: 'Left' }, value: 'left' },
        { label: { es: 'Sin medios', en: 'None' }, value: 'none' },
      ],
    },
    {
      name: 'actions',
      type: 'array',
      maxRows: 2,
      fields: [linkField({ name: 'link' })],
    },
  ],
}
