import type { Block } from 'payload'

import { linkField } from '../fields/link'
import { richTextField } from '../fields/richText'

export const InfoSection: Block = {
  slug: 'infoSection',
  interfaceName: 'InfoSectionBlock',
  labels: {
    singular: 'Info section',
    plural: 'Info sections',
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
    richTextField({
      name: 'body',
    }),
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'textMedia',
      options: [
        { label: 'Text + media', value: 'textMedia' },
        { label: 'Media + text', value: 'mediaText' },
        { label: 'Centered text', value: 'centered' },
      ],
    },
    linkField({ name: 'link', required: false }),
  ],
}
