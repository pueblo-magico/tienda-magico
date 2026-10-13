import type { Access, CollectionConfig } from 'payload'
import { randomUUID } from 'node:crypto'

import { checkRole } from '../access/utilities'
import { confirmSupplierPayoutEndpoint } from '../utilities/confirmSupplierPayout'
import { reconcileSupplierPayoutEndpoint } from '../utilities/reconcileSupplierPayout'

const immutable = { update: () => false }
const serverManaged = { create: () => false, update: () => false }
const canManagePayouts: Access = ({ req: { user } }) => checkRole(['admin', 'finance'], user)

export const SupplierPayouts: CollectionConfig = {
  slug: 'supplier-payouts',
  endpoints: [confirmSupplierPayoutEndpoint, reconcileSupplierPayoutEndpoint],
  labels: {
    singular: { es: 'Pago a proveedor', en: 'Supplier payout' },
    plural: { es: 'Pagos a proveedores', en: 'Supplier payouts' },
  },
  admin: {
    group: { es: 'Finanzas', en: 'Finance' },
    useAsTitle: 'idempotencyKey',
    defaultColumns: ['supplier', 'amountMinor', 'currency', 'status', 'confirmedAt'],
    description: {
      es: 'Un administrador debe revisar y confirmar explícitamente antes de enviar el pago.',
      en: 'An administrator must explicitly review and confirm before a payout is submitted.',
    },
  },
  access: {
    create: canManagePayouts,
    read: canManagePayouts,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data) {
          data.status = 'awaiting_approval'
          data.idempotencyKey = randomUUID()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'confirmPayout',
      type: 'ui',
      admin: { components: { Field: '@/components/ConfirmSupplierPayout' } },
    },
    {
      name: 'reconcilePayout',
      type: 'ui',
      admin: { components: { Field: '@/components/ReconcileSupplierPayout' } },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      access: immutable,
      label: { es: 'Proveedor', en: 'Supplier' },
    },
    {
      name: 'settlement',
      type: 'relationship',
      relationTo: 'supplier-settlements',
      required: true,
      unique: true,
      index: true,
      access: immutable,
      label: { es: 'Liquidación aprobada', en: 'Approved settlement' },
    },
    {
      name: 'paymentProfile',
      type: 'relationship',
      relationTo: 'supplier-payment-profiles',
      required: true,
      access: immutable,
      label: { es: 'Perfil de pago', en: 'Payment profile' },
    },
    {
      name: 'amountMinor',
      type: 'number',
      required: true,
      min: 100,
      access: immutable,
      label: { es: 'Importe a pagar en centavos', en: 'Payout amount in minor units' },
      validate: (value: unknown) =>
        (Number.isSafeInteger(value) && Number(value) >= 100) ||
        'El importe debe ser un entero de al menos ARS 1,00.',
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting_approval',
      admin: { readOnly: true },
      access: serverManaged,
      options: [
        {
          label: { es: 'Esperando aprobación', en: 'Awaiting approval' },
          value: 'awaiting_approval',
        },
        { label: { es: 'Enviando', en: 'Submitting' }, value: 'submitting' },
        { label: { es: 'Enviado', en: 'Submitted' }, value: 'submitted' },
        { label: { es: 'Procesando', en: 'Processing' }, value: 'processing' },
        { label: { es: 'Acreditado', en: 'Succeeded' }, value: 'succeeded' },
        { label: { es: 'Fallido', en: 'Failed' }, value: 'failed' },
        {
          label: { es: 'Requiere conciliación', en: 'Reconciliation required' },
          value: 'reconciliation_required',
        },
      ],
      label: { es: 'Estado', en: 'Status' },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Clave de idempotencia', en: 'Idempotency key' },
    },
    {
      name: 'providerPayoutId',
      type: 'text',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'ID de lote Mercado Pago', en: 'Mercado Pago payout ID' },
    },
    {
      name: 'providerTransactionId',
      type: 'text',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'ID de transacción Mercado Pago', en: 'Mercado Pago transaction ID' },
    },
    {
      name: 'providerStatus',
      type: 'text',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Estado informado por Mercado Pago', en: 'Mercado Pago status' },
    },
    {
      name: 'destinationSnapshot',
      type: 'json',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Snapshot del destino', en: 'Destination snapshot' },
    },
    {
      name: 'confirmedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Confirmado por', en: 'Confirmed by' },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Confirmado el', en: 'Confirmed at' },
    },
    {
      name: 'failureCode',
      type: 'text',
      admin: { readOnly: true },
      access: serverManaged,
      label: { es: 'Código de falla', en: 'Failure code' },
    },
  ],
}
