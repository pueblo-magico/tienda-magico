import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Configuración de comercio',
  admin: { group: 'Configuración' },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'localCollectionEnabled',
      label: 'Habilitar retiro local',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: 'Permite que clientes elijan retirar su compra localmente.',
      },
    },
    {
      name: 'deliveryEnabled',
      label: 'Habilitar entrega',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      admin: {
        description: 'Permite que clientes elijan recibir su compra mediante entrega.',
      },
    },
  ],
}
