import type { GlobalConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'
import {
  appendSupplierPayoutPolicyEvent,
  lockSupplierPayoutPolicy,
  validateSupplierPayoutPolicy,
} from '../utilities/supplierPayoutPolicy'

export const SupplierPayoutPolicy: GlobalConfig = {
  slug: 'supplier-payout-policy',
  label: { es: 'Política de pagos a proveedores', en: 'Supplier payout policy' },
  admin: {
    group: { es: 'Configuración', en: 'Settings' },
    description: {
      es: 'Control de seguridad para los envíos de dinero. La conciliación y el registro manual continúan disponibles cuando los envíos están bloqueados.',
      en: 'Safety controls for outbound money movement. Reconciliation and manual recording remain available while submissions are blocked.',
    },
  },
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  hooks: {
    beforeChange: [lockSupplierPayoutPolicy, validateSupplierPayoutPolicy],
    afterChange: [appendSupplierPayoutPolicyEvent],
  },
  fields: [
    {
      name: 'emergencyStop',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      label: { es: 'Freno de emergencia', en: 'Emergency stop' },
      admin: {
        description: {
          es: 'Bloquea de inmediato todo nuevo envío a proveedores. No bloquea consultar estados ni registrar pagos externos.',
          en: 'Immediately blocks new supplier payout submissions. Status checks and external payment records remain available.',
        },
      },
    },
    {
      name: 'outboundProviderPaymentsEnabled',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      label: { es: 'Habilitar envíos a proveedores', en: 'Enable supplier payout submissions' },
      admin: {
        description: {
          es: 'Permite que una confirmación administrativa solicite un pago al proveedor configurado.',
          en: 'Allows an administrative confirmation to request a payment from the configured provider.',
        },
      },
    },
    {
      name: 'automaticProviderPaymentsEnabled',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      label: { es: 'Habilitar ejecución automática', en: 'Enable automatic execution' },
      admin: {
        description: {
          es: 'Reserva el permiso para automatizaciones futuras. La confirmación manual actual no depende de esta opción.',
          en: 'Reserves permission for future automations. The current manual confirmation does not depend on this option.',
        },
      },
    },
  ],
}
