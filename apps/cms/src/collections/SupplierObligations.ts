import type { Access, CollectionConfig } from 'payload'

import { checkRole } from '../access/utilities'

const canReadSupplierFinance: Access = ({ req: { user } }) => checkRole(['admin', 'finance'], user)

export const SupplierObligations: CollectionConfig = {
  slug: 'supplier-obligations',
  labels: {
    singular: { es: 'Obligación con proveedor', en: 'Supplier obligation' },
    plural: { es: 'Obligaciones con proveedores', en: 'Supplier obligations' },
  },
  admin: {
    group: { es: 'Finanzas', en: 'Finance' },
    useAsTitle: 'sourceKey',
    defaultColumns: ['supplier', 'order', 'currency', 'supplierAmountMinor', 'status'],
    description: {
      es: 'Snapshots inmutables creados cuando un pedido pasa a pago aprobado.',
      en: 'Immutable snapshots created when an order becomes payment-approved.',
    },
  },
  access: {
    create: () => false,
    read: canReadSupplierFinance,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'sourceKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { es: 'Clave del evento', en: 'Event key' },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
      label: { es: 'Pedido', en: 'Order' },
    },
    {
      name: 'orderLine',
      type: 'number',
      required: true,
      min: 0,
      label: { es: 'Línea del pedido', en: 'Order line' },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
      label: { es: 'Producto', en: 'Product' },
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'variants',
      index: true,
      label: { es: 'Variante', en: 'Variant' },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      index: true,
      label: { es: 'Proveedor', en: 'Supplier' },
    },
    {
      name: 'agreement',
      type: 'relationship',
      relationTo: 'supplier-agreements',
      index: true,
      label: { es: 'Acuerdo aplicado', en: 'Applied agreement' },
    },
    {
      name: 'agreementRevision',
      type: 'number',
      label: { es: 'Revisión del acuerdo', en: 'Agreement revision' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: { es: 'Elegible', en: 'Eligible' }, value: 'eligible' },
        { label: { es: 'En revisión', en: 'Held for review' }, value: 'held' },
        { label: { es: 'Aprobada', en: 'Approved' }, value: 'approved' },
        { label: { es: 'Pagada parcialmente', en: 'Partially paid' }, value: 'partially_paid' },
        { label: { es: 'Pagada', en: 'Paid' }, value: 'paid' },
        { label: { es: 'Revertida', en: 'Reversed' }, value: 'reversed' },
        { label: { es: 'En disputa', en: 'Disputed' }, value: 'disputed' },
      ],
      label: { es: 'Estado', en: 'Status' },
    },
    { name: 'currency', type: 'text', required: true, label: { es: 'Moneda', en: 'Currency' } },
    {
      name: 'eligibleBaseMinor',
      type: 'number',
      required: true,
      min: 0,
      label: { es: 'Base elegible en centavos', en: 'Eligible base in minor units' },
    },
    {
      name: 'supplierAmountMinor',
      type: 'number',
      min: 0,
      label: { es: 'Parte del proveedor en centavos', en: 'Supplier share in minor units' },
    },
    {
      name: 'storeAmountMinor',
      type: 'number',
      min: 0,
      label: { es: 'Parte contractual de la tienda', en: 'Contractual store share' },
    },
    {
      name: 'outstandingMinor',
      type: 'number',
      min: 0,
      label: { es: 'Saldo pendiente en centavos', en: 'Outstanding minor units' },
    },
    {
      name: 'reviewReason',
      type: 'text',
      label: { es: 'Motivo de revisión', en: 'Review reason' },
    },
    { name: 'snapshot', type: 'json', required: true, label: { es: 'Snapshot', en: 'Snapshot' } },
    {
      name: 'calculatedAt',
      type: 'date',
      required: true,
      label: { es: 'Calculada el', en: 'Calculated at' },
    },
  ],
}
