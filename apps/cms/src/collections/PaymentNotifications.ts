import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminOnly } from '../access/adminOnly'

export const PaymentNotifications: CollectionConfig = {
  slug: 'payment-notifications',
  labels: {
    singular: { es: 'Notificación de pago', en: 'Payment notification' },
    plural: { es: 'Notificaciones de pago', en: 'Payment notifications' },
  },
  admin: {
    group: { es: 'Tienda', en: 'Shop' },
    useAsTitle: 'resourceId',
    defaultColumns: ['resourceId', 'paymentStatus', 'publicReference', 'createdAt'],
    hideAPIURL: true,
    description: {
      es: 'Observaciones privadas de Mercado Pago pendientes de conciliación manual. No confirman pedidos ni representan el estado actual del pago. Consultá siempre la cuenta antes de confirmar.',
      en: 'Private Mercado Pago observations awaiting manual reconciliation. They do not confirm orders or represent the current payment state. Always check the account before confirming.',
    },
  },
  access: { create: adminOnly, read: adminOnly, update: () => false, delete: () => false },
  fields: [
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
