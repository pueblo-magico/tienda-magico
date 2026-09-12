import type { CollectionConfig } from 'payload'

const immutableAfterCreation = { update: () => false }

export const ordersCollectionOverride = ({
  defaultCollection,
}: {
  defaultCollection: CollectionConfig
}): CollectionConfig => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    beforeValidate: [
      ...(defaultCollection.hooks?.beforeValidate ?? []),
      ({ data, operation }) => {
        if (operation !== 'create') return data
        for (const field of [
          'checkoutKey',
          'cartReference',
          'fulfillmentMode',
          'commercialSnapshot',
        ]) {
          if (data?.[field] == null) {
            throw new Error(`Falta el campo obligatorio del checkout: ${field}.`)
          }
        }
        return data
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
      name: 'commercialSnapshot',
      type: 'json',
      access: immutableAfterCreation,
      admin: { readOnly: true },
    },
  ],
})
