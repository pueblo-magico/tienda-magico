import type { Block } from 'payload'

import { linkField } from '../fields/link'
import { richTextField } from '../fields/richText'

export const InfoSection: Block = {
  slug: 'infoSection',
  interfaceName: 'InfoSectionBlock',
  labels: {
    singular: { es: 'Sección informativa', en: 'Info section' },
    plural: { es: 'Secciones informativas', en: 'Info sections' },
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
        { label: { es: 'Texto + medios', en: 'Text + media' }, value: 'textMedia' },
        { label: { es: 'Medios + texto', en: 'Media + text' }, value: 'mediaText' },
        { label: { es: 'Texto centrado', en: 'Centered text' }, value: 'centered' },
      ],
    },
    linkField({ name: 'link', required: false }),
  ],
}
