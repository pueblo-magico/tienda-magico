import type { CollectionConfig, PayloadRequest } from 'payload'
import { protectLocalTransfer } from '../utilities/confirmTransfer'
import { lockTransferWrite, protectTransferDeletion } from '../utilities/transferWriteLock'

const operationalRoles = new Set(['admin', 'manager', 'staff', 'finance'])
const immutableAfterCreation = { update: () => false }

function canOperateLocalSales(req: PayloadRequest): boolean {
  const roles = req.user?.roles
  return Array.isArray(roles) && roles.some((role) => operationalRoles.has(String(role)))
}

function isAdministrator(req: PayloadRequest): boolean {
  return Array.isArray(req.user?.roles) && req.user.roles.some((role) => String(role) === 'admin')
}

export const LocalSales: CollectionConfig = {
  slug: 'localSales',
  hooks: {
    beforeOperation: [lockTransferWrite],
    beforeChange: [protectLocalTransfer],
    beforeDelete: [protectTransferDeletion],
  },
  labels: {
    singular: { es: 'Venta local', en: 'Local sale' },
    plural: { es: 'Ventas locales', en: 'Local sales' },
  },
  admin: {
    group: { es: 'Tienda', en: 'Shop' },
    useAsTitle: 'idempotencyKey',
    description: {
      es: 'Registro privado de ventas locales operadas desde el CMS.',
      en: 'Private record of local sales operated from the CMS.',
    },
  },
  access: {
    create: ({ req }) => canOperateLocalSales(req),
    read: ({ req }) => canOperateLocalSales(req),
    update: ({ req }) => canOperateLocalSales(req),
    delete: ({ req }) => isAdministrator(req),
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      label: { es: 'Pedido ecommerce', en: 'Ecommerce order' },
      access: immutableAfterCreation,
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { es: 'Clave de idempotencia', en: 'Idempotency key' },
      access: immutableAfterCreation,
      admin: {
        readOnly: true,
        description: {
          es: 'Evita crear dos registros para el mismo pedido y reintento.',
          en: 'Prevents duplicate records for the same order and retry.',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_payment',
      options: [
        { label: { es: 'Pendiente de pago', en: 'Pending payment' }, value: 'pending_payment' },
        { label: { es: 'Pagado', en: 'Paid' }, value: 'paid' },
        { label: { es: 'Cancelado', en: 'Cancelled' }, value: 'cancelled' },
        { label: { es: 'Conflicto', en: 'Conflict' }, value: 'conflict' },
      ],
      label: { es: 'Estado operativo', en: 'Operational status' },
    },
    {
      name: 'fulfillmentMode',
      type: 'select',
      required: true,
      options: [
        { label: { es: 'Retiro local', en: 'Local collection' }, value: 'local_collection' },
        { label: { es: 'Entrega', en: 'Delivery' }, value: 'delivery' },
      ],
      label: { es: 'Modalidad de fulfillment', en: 'Fulfillment mode' },
      access: immutableAfterCreation,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: { es: 'Pendiente', en: 'Pending' }, value: 'pending' },
        { label: { es: 'Aprobado', en: 'Approved' }, value: 'approved' },
        { label: { es: 'Rechazado', en: 'Rejected' }, value: 'rejected' },
        { label: { es: 'Cancelado', en: 'Cancelled' }, value: 'cancelled' },
        { label: { es: 'No verificado', en: 'Unverified' }, value: 'unverified' },
      ],
      label: { es: 'Estado del pago', en: 'Payment status' },
      access: immutableAfterCreation,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'mercado-pago',
      options: [
        { label: 'Mercado Pago', value: 'mercado-pago' },
        { label: { es: 'Transferencia', en: 'Bank transfer' }, value: 'bank-transfer' },
        { label: { es: 'Efectivo', en: 'Cash' }, value: 'cash' },
      ],
      label: { es: 'Medio de pago', en: 'Payment method' },
      access: immutableAfterCreation,
    },
    {
      name: 'paymentExpiresAt',
      type: 'date',
      label: { es: 'Vencimiento del pago', en: 'Payment expiry' },
      access: immutableAfterCreation,
    },
    {
      name: 'buyerContact',
      type: 'json',
      label: { es: 'Contacto del comprador', en: 'Buyer contact' },
      access: immutableAfterCreation,
      admin: {
        description: {
          es: 'Datos opcionales y privados permitidos por el checkout.',
          en: 'Optional private data allowed by checkout.',
        },
      },
    },
    {
      name: 'snapshot',
      type: 'json',
      required: true,
      label: { es: 'Snapshot comercial', en: 'Commercial snapshot' },
      access: immutableAfterCreation,
      admin: {
        description: {
          es: 'Identidad, opciones, cantidades e importes inmutables del pedido.',
          en: 'Immutable order identity, options, quantities, and amounts.',
        },
      },
    },
    {
      name: 'paymentEvidence',
      type: 'json',
      label: { es: 'Evidencia de pago', en: 'Payment evidence' },
      access: immutableAfterCreation,
      admin: {
        description: {
          es: 'Nunca guardes credenciales ni secretos del gateway.',
          en: 'Never store gateway credentials or secrets.',
        },
      },
    },
  ],
}
