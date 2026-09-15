import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { validateTransferSettings } from './commerceSettingsValidation'

export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: { es: 'Configuración de comercio', en: 'Commerce settings' },
  admin: { group: { es: 'Configuración', en: 'Settings' } },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    beforeValidate: [validateTransferSettings],
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
    {
      name: 'transferEnabled',
      label: { es: 'Habilitar transferencia', en: 'Enable bank transfer' },
      type: 'checkbox',
      defaultValue: false,
      required: true,
      admin: {
        description: {
          es: 'Permite elegir transferencia como medio de pago. Activala únicamente después de completar los datos de la cuenta.',
          en: 'Allows customers to choose bank transfer. Enable it only after completing the account details.',
        },
      },
    },
    {
      name: 'transfer',
      label: { es: 'Datos para transferencia', en: 'Bank transfer details' },
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.transferEnabled === true,
      },
      fields: [
        {
          name: 'accountHolder',
          label: { es: 'Titular de la cuenta', en: 'Account holder' },
          type: 'text',
        },
        {
          name: 'taxId',
          label: { es: 'CUIT', en: 'Tax ID' },
          type: 'text',
        },
        {
          name: 'alias',
          label: { es: 'Alias', en: 'Alias' },
          type: 'text',
        },
        {
          name: 'cvu',
          label: { es: 'CVU', en: 'CVU' },
          type: 'text',
        },
        {
          name: 'paymentWindowMinutes',
          label: { es: 'Plazo de pago en minutos', en: 'Payment window in minutes' },
          type: 'number',
          defaultValue: 15,
          min: 1,
          max: 1440,
          required: true,
        },
      ],
    },
  ],
}
