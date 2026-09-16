import type { CollectionConfig } from 'payload'
import { randomUUID } from 'node:crypto'
import { confirmTransferEndpoint, protectTransfer } from '../utilities/confirmTransfer'
import { lockTransferWrite, protectTransferDeletion } from '../utilities/transferWriteLock'

const immutableAfterCreation = { update: () => false }

export const ordersCollectionOverride = ({
  defaultCollection,
}: {
  defaultCollection: CollectionConfig
}): CollectionConfig => ({
  ...defaultCollection,
  endpoints: [...(defaultCollection.endpoints || []), confirmTransferEndpoint],
  hooks: {
    ...defaultCollection.hooks,
    beforeOperation: [lockTransferWrite, ...(defaultCollection.hooks?.beforeOperation ?? [])],
    beforeDelete: [protectTransferDeletion, ...(defaultCollection.hooks?.beforeDelete ?? [])],
    beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), protectTransfer],
    beforeValidate: [
      ...(defaultCollection.hooks?.beforeValidate ?? []),
      ({ data, operation }) => {
        if (operation !== 'create') return data
        const checkoutData: Record<string, unknown> = {
          ...data,
          publicReference: data?.publicReference ?? randomUUID(),
        }
        for (const field of [
          'checkoutKey',
          'publicReference',
          'cartReference',
          'fulfillmentMode',
          'paymentMethod',
          'commercialSnapshot',
        ]) {
          if (checkoutData[field] == null) {
            throw new Error(`Falta el campo obligatorio del checkout: ${field}.`)
          }
        }
        return checkoutData
      },
    ],
    afterChange: [
      ...(defaultCollection.hooks?.afterChange ?? []),
      async ({ doc, operation, req }) => {
        if (operation !== 'create' || doc.fulfillmentMode !== 'local_collection') return doc

        const idempotencyKey = `local-sale:${String(doc.id)}`
        const existing = await req.payload.find({
          collection: 'localSales',
          where: { idempotencyKey: { equals: idempotencyKey } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
          req,
        })

        if (!existing.docs.length) {
          await req.payload.create({
            collection: 'localSales',
            data: {
              order: doc.id,
              idempotencyKey,
              status: 'pending_payment',
              fulfillmentMode: 'local_collection',
              paymentStatus: 'pending',
              paymentMethod: doc.paymentMethod,
              paymentExpiresAt: doc.paymentExpiresAt ?? null,
              buyerContact: doc.buyerContact ?? null,
              snapshot: doc.commercialSnapshot,
            },
            overrideAccess: true,
            req,
          })
        }

        return doc
      },
    ],
  },
  fields: [
    ...defaultCollection.fields,
    {
      name: 'confirmTransfer',
      type: 'ui',
      admin: {
        condition: (data) => data.paymentMethod === 'bank-transfer',
        components: { Field: '@/components/ConfirmTransfer' },
      },
    },
    {
      name: 'transferBankReference',
      type: 'text',
      unique: true,
      index: true,
      label: { es: 'Referencia bancaria verificada', en: 'Verified bank reference' },
      access: {
        create: () => false,
        update: () => false,
        read: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
      },
      admin: { readOnly: true },
    },
    {
      name: 'transferVerification',
      type: 'json',
      label: { es: 'Auditoría de verificación', en: 'Verification audit' },
      access: {
        create: () => false,
        update: () => false,
        read: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
      },
      admin: { readOnly: true },
    },
    {
      name: 'transferReportedAt',
      type: 'date',
      label: { es: 'Transferencia declarada por el comprador', en: 'Transfer reported by buyer' },
      admin: {
        readOnly: true,
        description: {
          es: 'No confirma la recepción del dinero.',
          en: 'Does not confirm receipt of funds.',
        },
      },
    },
    {
      name: 'checkoutKey',
      type: 'text',
      unique: true,
      index: true,
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'cartReference',
      type: 'text',
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'publicReference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { es: 'Referencia pública', en: 'Public reference' },
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'fulfillmentMode',
      type: 'select',
      options: [
        { label: { es: 'Retiro local', en: 'Local collection' }, value: 'local_collection' },
        { label: { es: 'Entrega', en: 'Delivery' }, value: 'delivery' },
      ],
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'buyerContact',
      type: 'json',
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'mercado-pago',
      options: [
        { label: 'Mercado Pago', value: 'mercado-pago' },
        { label: { es: 'Transferencia', en: 'Bank transfer' }, value: 'bank-transfer' },
      ],
      label: { es: 'Medio de pago', en: 'Payment method' },
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
    {
      name: 'paymentExpiresAt',
      type: 'date',
      label: { es: 'Vencimiento del pago', en: 'Payment expiry' },
      access: immutableAfterCreation,
      admin: { readOnly: true },
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
        { label: { es: 'Sin verificar', en: 'Unverified' }, value: 'unverified' },
      ],
      label: { es: 'Estado del pago', en: 'Payment status' },
      admin: { readOnly: true },
    },
    {
      name: 'commercialSnapshot',
      type: 'json',
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
  ],
})
