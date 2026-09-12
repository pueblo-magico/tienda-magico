import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: { es: 'Configuración de comercio', en: 'Commerce settings' },
  admin: { group: { es: 'Configuración', en: 'Settings' } },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'localCollectionEnabled',
      label: { es: 'Habilitar retiro local', en: 'Enable local collection' },
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: {
          es: 'Permite que clientes elijan retirar su compra localmente.',
          en: 'Allows customers to collect their purchase locally.',
        },
      },
    },
    {
      name: 'deliveryEnabled',
      label: { es: 'Habilitar entrega', en: 'Enable delivery' },
      type: 'checkbox',
      defaultValue: false,
      required: true,
      admin: {
        description: {
          es: 'Permite que clientes elijan recibir su compra mediante entrega.',
          en: 'Allows customers to receive their purchase by delivery.',
        },
      },
    },
  ],
}
