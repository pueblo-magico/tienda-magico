import type { Access, CollectionConfig } from 'payload'

import { checkRole } from '../access/utilities'

const canReadPolicyEvents: Access = ({ req: { user } }) => checkRole(['admin', 'finance'], user)
const serverManaged = { create: () => false, update: () => false }

export const SupplierPayoutPolicyEvents: CollectionConfig = {
  slug: 'supplier-payout-policy-events',
  lockDocuments: false,
  labels: {
    singular: { es: 'Cambio de política de pagos', en: 'Payout policy change' },
    plural: { es: 'Cambios de política de pagos', en: 'Payout policy changes' },
  },
  admin: {
    group: { es: 'Finanzas', en: 'Finance' },
    useAsTitle: 'eventKey',
    defaultColumns: ['occurredAt', 'actor', 'emergencyStop', 'outboundProviderPaymentsEnabled'],
    description: {
      es: 'Historial inmutable de los cambios que habilitan o bloquean pagos a proveedores.',
      en: 'Immutable history of changes that enable or block supplier payouts.',
    },
  },
  access: {
    create: () => false,
    read: canReadPolicyEvents,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'eventKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: serverManaged,
      label: { es: 'Clave idempotente', en: 'Idempotency key' },
    },
    {
      name: 'emergencyStop',
      type: 'checkbox',
      required: true,
      access: serverManaged,
      label: { es: 'Freno de emergencia', en: 'Emergency stop' },
    },
    {
      name: 'outboundProviderPaymentsEnabled',
      type: 'checkbox',
      required: true,
      access: serverManaged,
      label: { es: 'Envíos a proveedores habilitados', en: 'Outbound provider payments enabled' },
    },
    {
      name: 'automaticProviderPaymentsEnabled',
      type: 'checkbox',
      required: true,
      access: serverManaged,
      label: { es: 'Ejecución automática habilitada', en: 'Automatic execution enabled' },
    },
    {
      name: 'previousEmergencyStop',
      type: 'checkbox',
      access: serverManaged,
      label: { es: 'Freno anterior', en: 'Previous emergency stop' },
    },
    {
      name: 'previousOutboundProviderPaymentsEnabled',
      type: 'checkbox',
      access: serverManaged,
      label: { es: 'Envíos anteriores', en: 'Previous outbound payments' },
    },
    {
      name: 'previousAutomaticProviderPaymentsEnabled',
      type: 'checkbox',
      access: serverManaged,
      label: { es: 'Ejecución automática anterior', en: 'Previous automatic execution' },
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      access: serverManaged,
      label: { es: 'Responsable', en: 'Actor' },
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      index: true,
      access: serverManaged,
      label: { es: 'Fecha y hora', en: 'Occurred at' },
    },
  ],
}
