import type { Block } from 'payload'

import { linkField } from '../fields/link'
import { richTextField } from '../fields/richText'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
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
        { label: 'Background', value: 'background' },
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
        { label: 'None', value: 'none' },
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
