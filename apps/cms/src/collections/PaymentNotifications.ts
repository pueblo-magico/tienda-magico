import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminOnly } from '../access/adminOnly'
import { reconcileTransferEndpoint } from '../utilities/reconcileTransfer'
import { sql } from '@payloadcms/db-postgres'
import { activeTransaction } from '../utilities/transferWriteLock'

export const PaymentNotifications: CollectionConfig = {
  slug: 'payment-notifications',
  endpoints: [reconcileTransferEndpoint],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const transaction = await activeTransaction(req)
          await transaction.execute(
            sql`SELECT pg_advisory_xact_lock(hashtextextended(${`transfer:${data.resourceId}`}, 0))`,
          )
        }
        return data
      },
    ],
  },
  labels: {
    singular: { es: 'Notificación de pago', en: 'Payment notification' },
    plural: { es: 'Notificaciones de pago', en: 'Payment notifications' },
  },
  admin: {
    group: { es: 'Tienda', en: 'Shop' },
    useAsTitle: 'resourceId',
    defaultColumns: ['resourceId', 'paymentStatus', 'reconciliation', 'createdAt'],
    hideAPIURL: true,
    description: {
      es: 'Observaciones privadas de Mercado Pago. La conciliación indica confirmación automática o revisión manual. Consultá la cuenta antes de resolver una excepción.',
      en: 'Private Mercado Pago observations. Reconciliation indicates automatic confirmation or manual review. Check the account before resolving an exception.',
    },
  },
  access: { create: adminOnly, read: adminOnly, update: () => false, delete: () => false },
  fields: [
    {
      name: 'payerType',
      type: 'text',
      label: { es: 'Tipo de documento', en: 'Identification type' },
    },
    {
      name: 'payerNumber',
      type: 'text',
      label: { es: 'Documento del pagador', en: 'Payer identification' },
    },
    { name: 'paymentType', type: 'text', label: { es: 'Tipo de pago', en: 'Payment type' } },
    {
      name: 'statusDetail',
      type: 'text',
      label: { es: 'Detalle del estado', en: 'Status detail' },
    },
    {
      name: 'refundedAmount',
      type: 'number',
      label: { es: 'Importe devuelto en centavos', en: 'Refunded minor units' },
    },
    {
      name: 'approvedAt',
      type: 'date',
      label: { es: 'Fecha de acreditación', en: 'Accredited at' },
    },
    {
      name: 'reconciliation',
      type: 'text',
      label: { es: 'Conciliación', en: 'Reconciliation' },
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      label: { es: 'Clave de idempotencia', en: 'Idempotency key' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        (typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)) ||
        (req.i18n.language === 'en' ? 'Invalid key.' : 'Clave inválida.'),
    },
    {
      name: 'resourceId',
      type: 'text',
      required: true,
      index: true,
      label: { es: 'ID de pago Mercado Pago', en: 'Mercado Pago payment ID' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        (typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value)) ||
        (req.i18n.language === 'en' ? 'Invalid ID.' : 'ID inválido.'),
    },
    {
      name: 'paymentStatus',
      type: 'text',
      required: true,
      label: { es: 'Estado observado', en: 'Observed status' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        (typeof value === 'string' && /^[a-z_]{1,50}$/.test(value)) ||
        (req.i18n.language === 'en' ? 'Invalid status.' : 'Estado inválido.'),
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: { es: 'Importe en centavos', en: 'Amount in minor units' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
        (req.i18n.language === 'en' ? 'Invalid amount.' : 'Importe inválido.'),
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      label: { es: 'Moneda', en: 'Currency' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        value === 'ARS' ||
        (req.i18n.language === 'en' ? 'Currency must be ARS.' : 'La moneda debe ser ARS.'),
    },
    {
      name: 'publicReference',
      type: 'text',
      index: true,
      label: { es: 'Referencia pública del pedido', en: 'Public order reference' },
      validate: (value: unknown, { req }: { req: PayloadRequest }) =>
        value == null ||
        value === '' ||
        (typeof value === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) ||
        (req.i18n.language === 'en' ? 'Invalid reference.' : 'Referencia inválida.'),
    },
    {
      name: 'liveMode',
      type: 'checkbox',
      required: true,
      label: { es: 'Modo producción', en: 'Production mode' },
    },
    {
      name: 'providerUpdatedAt',
      type: 'date',
      required: true,
      label: { es: 'Actualización en Mercado Pago', en: 'Mercado Pago update time' },
    },
  ],
}
