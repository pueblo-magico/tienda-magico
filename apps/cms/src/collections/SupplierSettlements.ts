import type { Access, CollectionConfig } from 'payload'

import { checkRole } from '../access/utilities'
import { approveSupplierSettlementEndpoint } from '../utilities/approveSupplierSettlement'

const immutable = { update: () => false }
const serverManaged = { create: () => false, update: () => false }
const canManageSettlements: Access = ({ req: { user } }) => checkRole(['admin', 'finance'], user)

export const SupplierSettlements: CollectionConfig = {
  slug: 'supplier-settlements',
  endpoints: [approveSupplierSettlementEndpoint],
  labels: {
    singular: { es: 'Liquidación de proveedor', en: 'Supplier settlement' },
    plural: { es: 'Liquidaciones de proveedores', en: 'Supplier settlements' },
  },
  admin: {
    group: { es: 'Finanzas', en: 'Finance' },
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'supplier', 'currency', 'amountMinor', 'status'],
  },
  access: {
    create: canManageSettlements,
    read: canManageSettlements,
    update: canManageSettlements,
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data) {
          data.status = 'draft'
          data.outstandingMinor = data.amountMinor
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'approveSettlement',
      type: 'ui',
      admin: { components: { Field: '@/components/ApproveSupplierSettlement' } },
    },
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: immutable,
      label: { es: 'Referencia', en: 'Reference' },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      index: true,
      access: immutable,
      label: { es: 'Proveedor', en: 'Supplier' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'ARS',
      options: [{ label: 'ARS — Peso argentino', value: 'ARS' }],
      access: immutable,
      label: { es: 'Moneda', en: 'Currency' },
    },
    {
      name: 'amountMinor',
      type: 'number',
      required: true,
      min: 1,
      access: immutable,
      label: { es: 'Importe aprobado en centavos', en: 'Approved amount in minor units' },
      validate: (value: unknown) =>
        (Number.isSafeInteger(value) && Number(value) > 0) ||
        'El importe debe ser entero y positivo.',
    },
    {
      name: 'outstandingMinor',
      type: 'number',
      required: true,
      min: 0,
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Saldo pendiente en centavos', en: 'Outstanding minor units' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { readOnly: true },
      access: serverManaged,
      options: [
        { label: { es: 'Borrador', en: 'Draft' }, value: 'draft' },
        { label: { es: 'Aprobada', en: 'Approved' }, value: 'approved' },
        { label: { es: 'Pago en proceso', en: 'Payment pending' }, value: 'payment_pending' },
        { label: { es: 'Pagada parcialmente', en: 'Partially paid' }, value: 'partially_paid' },
        { label: { es: 'Pagada', en: 'Paid' }, value: 'paid' },
        { label: { es: 'Cancelada', en: 'Cancelled' }, value: 'cancelled' },
      ],
      label: { es: 'Estado', en: 'Status' },
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Aprobada por', en: 'Approved by' },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Aprobada el', en: 'Approved at' },
    },
  ],
}
