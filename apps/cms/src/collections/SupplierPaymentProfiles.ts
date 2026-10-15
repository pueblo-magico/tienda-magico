import type { Access, CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { checkRole } from '../access/utilities'

const canManagePayments: Access = ({ req: { user } }) => checkRole(['admin', 'finance'], user)

const protectVerification: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') {
    data.status = 'pending'
    data.verifiedAt = null
    data.verifiedBy = null
    return data
  }
  const changesDestination =
    ('recipientEmail' in data && data.recipientEmail !== originalDoc?.recipientEmail) ||
    ('currency' in data && data.currency !== originalDoc?.currency)
  if (changesDestination) {
    data.status = 'pending'
    data.verifiedAt = null
    data.verifiedBy = null
  }
  if (data.status === 'verified' && originalDoc?.status !== 'verified') {
    if (!req.user?.roles?.includes('admin'))
      throw new Error('Solo un administrador puede verificar el destino.')
    data.verifiedAt = new Date().toISOString()
    data.verifiedBy = req.user.id
  }
  return data
}

export const SupplierPaymentProfiles: CollectionConfig = {
  slug: 'supplier-payment-profiles',
  labels: {
    singular: { es: 'Perfil de pago del proveedor', en: 'Supplier payment profile' },
    plural: { es: 'Perfiles de pago de proveedores', en: 'Supplier payment profiles' },
  },
  admin: {
    group: { es: 'Finanzas', en: 'Finance' },
    useAsTitle: 'recipientEmail',
    defaultColumns: ['supplier', 'recipientEmail', 'currency', 'status', 'verifiedAt'],
    description: {
      es: 'Destino privado para pagos. No guardes tokens ni credenciales en este registro.',
      en: 'Private payout destination. Never store tokens or credentials in this record.',
    },
  },
  access: {
    create: canManagePayments,
    read: canManagePayments,
    update: canManagePayments,
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  hooks: { beforeChange: [protectVerification] },
  fields: [
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      unique: true,
      index: true,
      label: { es: 'Proveedor', en: 'Supplier' },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'mercado-pago',
      options: [{ label: 'Mercado Pago Payouts', value: 'mercado-pago' }],
      label: { es: 'Proveedor de pagos', en: 'Payment provider' },
    },
    {
      name: 'recipientEmail',
      type: 'email',
      required: true,
      label: { es: 'Email de la cuenta Mercado Pago', en: 'Mercado Pago account email' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'ARS',
      options: [{ label: 'ARS — Peso argentino', value: 'ARS' }],
      label: { es: 'Moneda', en: 'Currency' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: { es: 'Pendiente de verificación', en: 'Pending verification' },
          value: 'pending',
        },
        { label: { es: 'Verificado', en: 'Verified' }, value: 'verified' },
        { label: { es: 'Desactivado', en: 'Disabled' }, value: 'disabled' },
      ],
      label: { es: 'Estado', en: 'Status' },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
      label: { es: 'Verificado el', en: 'Verified at' },
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
      label: { es: 'Verificado por', en: 'Verified by' },
    },
  ],
}
