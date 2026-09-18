import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { adminOnlyFieldAccess } from '../access/adminOnlyFieldAccess'
import { configureCashStaff } from '../utilities/cashStaffAccess'
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
    beforeChange: [configureCashStaff],
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
      name: 'cashEnabled',
      label: { es: 'Habilitar efectivo', en: 'Enable cash' },
      type: 'checkbox',
      defaultValue: false,
      required: true,
      admin: {
        description: {
          es: 'Permite pagar en efectivo únicamente con retiro local. El pedido se confirma desde el CMS al recibir el importe exacto.',
          en: 'Allows cash payment only with local collection. The order is confirmed in the CMS after receiving the exact amount.',
        },
      },
    },
    {
      name: 'cashStaffEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: { es: 'Habilitar caja en la tienda', en: 'Enable storefront cash desk' },
      access: { read: () => true, update: adminOnlyFieldAccess },
    },
    {
      name: 'cashStaffPassword',
      type: 'text',
      virtual: true,
      label: { es: 'Nueva contraseña de caja', en: 'New cash desk password' },
      access: { read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      hooks: { afterRead: [() => ''] },
      admin: {
        components: { Field: '@/components/StaffCashPassword#StaffCashPassword' },
        description: {
          es: 'Entre 12 y 128 caracteres. Dejá vacío para conservar la contraseña. Cambiarla o deshabilitar caja cierra las sesiones del equipo.',
          en: '12–128 characters. Leave blank to keep the password. Changing it or disabling the cash desk signs staff out.',
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
