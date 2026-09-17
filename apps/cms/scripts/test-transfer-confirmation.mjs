import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID } from 'node:crypto'
import { cashConfirmationCases } from './cash-confirmation-cases.mjs'

const require = createRequire(new URL('../package.json', import.meta.url))
const { parse } = require('dotenv')
const { Client } = require('pg')
const environment = parse(await readFile(new URL('../.env.local', import.meta.url)))
const connection = new URL(environment.DATABASE_URL)
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname))
const databaseName = `transfer_test_${Date.now()}`
assert.match(databaseName, /^transfer_test_\d+$/)
assert.notEqual(connection.pathname.slice(1), databaseName)
const admin = new Client({ connectionString: connection.toString(), connectionTimeoutMillis: 3000 })
await admin.connect()
await admin.query(`CREATE DATABASE "${databaseName}"`)
connection.pathname = `/${databaseName}`
process.env.DATABASE_URL = connection.toString()
process.env.PAYLOAD_SECRET = randomBytes(32).toString('hex')
process.env.PAYLOAD_MIGRATING = 'true'
process.env.NODE_ENV = 'test'
process.env.STOREFRONT_REVALIDATION_URL = ''
let payload
let isCleaningUp = false
try {
  const { getPayload, createLocalReq } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const { migrations } = await import('../src/migrations/index.ts')
  const { confirmTransferEndpoint } = await import('../src/utilities/confirmTransfer.ts')
  payload = await getPayload({ config, disableOnInit: true })
  payload.db.pool.on('error', (error) => {
    if (!isCleaningUp || error.code !== '57P01')
      throw new Error(`Error de conexión en la base descartable: ${error.code}`)
  })
  for (const migration of migrations)
    await payload.db.drizzle.transaction((db) => migration.up({ db, payload, req: {} }))
  const user = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@example.test',
      password: randomBytes(24).toString('hex'),
      roles: ['admin'],
    },
  })
  const customer = await payload.create({
    collection: 'users',
    data: {
      email: 'customer@example.test',
      password: randomBytes(24).toString('hex'),
      roles: ['customer'],
    },
  })
  const product = async (inventory = 3) => {
    const item = await payload.create({
      collection: 'products',
      locale: 'es',
      data: {
        title: 'Producto de prueba',
        summary: 'Resumen de prueba',
        slug: randomUUID(),
        sku: randomUUID(),
        inventory,
        priceInARSEnabled: true,
        priceInARS: 10000,
        _status: 'draft',
      },
    })
    await payload.update({
      collection: 'products',
      id: item.id,
      locale: 'en',
      data: { title: 'Test product', summary: 'Test summary' },
    })
    return payload.update({
      collection: 'products',
      id: item.id,
      locale: 'es',
      data: { _status: 'published' },
    })
  }
  const order = async (products, overrides = {}) =>
    payload.create({
      collection: 'orders',
      data: {
        checkoutKey: randomUUID(),
        cartReference: randomUUID(),
        fulfillmentMode: 'local_collection',
        paymentMethod: 'bank-transfer',
        transferIdentification: { type: 'DNI', number: '1111111' },
        paymentStatus: 'pending',
        status: 'processing',
        amount: products.length * 10000,
        currency: 'ARS',
        paymentExpiresAt: new Date(Date.now() + 600000).toISOString(),
        items: products.map((item) => ({ product: item.id, quantity: 1 })),
        commercialSnapshot: {
          currency: 'ARS',
          total: { amount: String(products.length * 100), currencyCode: 'ARS' },
          items: products.map((item) => ({
            productId: String(item.id),
            merchandiseId: `product:${item.id}`,
            sku: item.sku,
            quantity: 1,
            unitPrice: { amount: '100.00', currencyCode: 'ARS' },
            total: { amount: '100.00', currencyCode: 'ARS' },
            options: [],
          })),
        },
        ...overrides,
      },
    })
  const confirm = async (document, overrides = {}, actor = user) => {
    const req = await createLocalReq({ user: { ...actor, collection: 'users' } }, payload)
    req.headers = new Headers({ origin: new URL(payload.config.serverURL).origin })
    req.routeParams = { id: String(document.id) }
    req.json = async () => ({
      reference: `MP-${document.id}`,
      amount: document.amount,
      received: true,
      ...overrides,
    })
    const response = await confirmTransferEndpoint.handler(req)
    return { status: response.status, body: await response.json() }
  }
  const stock = async (item) =>
    (await payload.findByID({ collection: 'products', id: item.id, depth: 0 })).inventory
  await cashConfirmationCases({
    payload,
    createLocalReq,
    user,
    customer,
    product,
    order,
    stock,
    confirm,
    migrations,
  })
  const firstProduct = await product()
  const firstOrder = await order([firstProduct])
  assert.equal((await confirm(firstOrder, {}, customer)).status, 403)
  assert.equal((await confirm(firstOrder, { amount: 1 })).body.code, 'amount')
  const originalFetch = globalThis.fetch
  const notifiedStates = []
  process.env.STOREFRONT_REVALIDATION_URL = 'https://storefront.example.test/api/revalidate/catalog'
  process.env.STOREFRONT_REVALIDATION_SECRET = randomBytes(32).toString('hex')
  globalThis.fetch = async () => {
    const persisted = await payload.db.pool.query(
      'SELECT payment_status FROM orders WHERE id = $1',
      [firstOrder.id],
    )
    notifiedStates.push(persisted.rows[0].payment_status)
    return new Response(null, { status: 200 })
  }
  const results = await Promise.all([confirm(firstOrder), confirm(firstOrder)])
  globalThis.fetch = originalFetch
  process.env.STOREFRONT_REVALIDATION_URL = ''
  assert.deepEqual(notifiedStates, ['approved'])
  assert.deepEqual(
    results.map((result) => result.status),
    [200, 200],
    JSON.stringify(results),
  )
  assert.equal(await stock(firstProduct), 2)
  const approved = await payload.findByID({ collection: 'orders', id: firstOrder.id, depth: 0 })
  assert.equal(approved.paymentStatus, 'approved')
  assert.equal(approved.transferVerification.verifiedBy, user.id)
  assert.deepEqual(approved.transferVerification.stockMovements, [
    {
      collection: 'products',
      itemID: firstProduct.id,
      quantity: -1,
      before: 3,
      after: 2,
      idempotencyKey: `transfer:${firstOrder.id}:products:${firstProduct.id}`,
    },
  ])
  const sales = await payload.find({
    collection: 'localSales',
    where: { order: { equals: firstOrder.id } },
  })
  assert.equal(sales.docs[0].status, 'paid')
  assert.equal(sales.docs[0].paymentStatus, 'approved')
  await assert.rejects(
    payload.update({ collection: 'orders', id: firstOrder.id, data: { amount: 1 } }),
  )
  await assert.rejects(payload.delete({ collection: 'orders', id: firstOrder.id }))
  await assert.rejects(payload.delete({ collection: 'localSales', id: sales.docs[0].id }))
  const bulkTransfer = await payload.update({
    collection: 'orders',
    where: { id: { equals: firstOrder.id } },
    data: { transferReportedAt: new Date().toISOString() },
  })
  assert.equal(bulkTransfer.errors.length, 1)
  const bulkDelete = await payload.delete({
    collection: 'orders',
    where: { id: { equals: firstOrder.id } },
  })
  assert.equal(bulkDelete.errors.length, 1)
  const mercadoPago = await order([firstProduct], {
    paymentMethod: 'mercado-pago',
    fulfillmentMode: 'delivery',
  })
  const bulkOther = await payload.update({
    collection: 'orders',
    where: { id: { equals: mercadoPago.id } },
    data: { status: 'cancelled' },
  })
  assert.equal(bulkOther.errors.length, 0)
  assert.equal(bulkOther.docs[0].status, 'cancelled')
  const sameReference = await order([firstProduct])
  assert.equal(
    (await confirm(sameReference, { reference: `MP-${firstOrder.id}` })).body.code,
    'duplicate',
  )
  const sameCart = await order([firstProduct], { cartReference: firstOrder.cartReference })
  assert.equal((await confirm(sameCart)).body.code, 'duplicate')
  console.log(
    'PASS: autorización, importe, confirmación concurrente idempotente, auditoría y venta local',
  )
  const lastItem = await product(1)
  const competing = await Promise.all([order([lastItem]), order([lastItem])])
  const race = await Promise.all(competing.map((document) => confirm(document)))
  assert.deepEqual(race.map((result) => result.status).sort(), [200, 409], JSON.stringify(race))
  assert.equal(await stock(lastItem), 0)
  const insufficient = await product(0)
  const rollbackOrder = await order([firstProduct, insufficient])
  assert.equal((await confirm(rollbackOrder)).body.code, 'stock')
  assert.equal(await stock(firstProduct), 2)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: rollbackOrder.id })).paymentStatus,
    'pending',
  )
  const late = await order([firstProduct], {
    paymentExpiresAt: new Date(Date.now() - 60000).toISOString(),
  })
  assert.equal((await confirm(late)).body.code, 'late')
  assert.equal((await confirm(late, { acceptLate: true })).status, 200)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: late.id })).transferVerification.late,
    true,
  )
  console.log(
    'PASS: última unidad, rollback de varias líneas y aceptación explícita de pago tardío',
  )
  const changedProduct = await product()
  const changedOrder = await order([changedProduct])
  await payload.update({
    collection: 'products',
    id: changedProduct.id,
    data: { priceInARS: 11000 },
  })
  assert.equal((await confirm(changedOrder)).body.code, 'catalog')
  assert.equal(await stock(changedProduct), 3)
  await payload.update({
    collection: 'products',
    id: changedProduct.id,
    data: { priceInARS: 10000, lifecycleStatus: 'discontinued' },
  })
  assert.equal((await confirm(changedOrder)).body.code, 'catalog')
  await assert.rejects(
    payload.update({
      collection: 'localSales',
      id: sales.docs[0].id,
      data: { paymentStatus: 'pending', status: 'pending_payment' },
    }),
  )
  console.log('PASS: precio, ciclo de vida y estado local protegido')
  const privateOrder = await order([firstProduct], {
    customer: customer.id,
    fulfillmentMode: 'delivery',
  })
  assert.equal((await confirm(privateOrder)).status, 200)
  const publicOrder = await payload.findByID({
    collection: 'orders',
    id: privateOrder.id,
    depth: 0,
    overrideAccess: false,
    user: { ...customer, collection: 'users' },
  })
  assert.equal(publicOrder.paymentStatus, 'approved')
  assert.equal(publicOrder.transferVerification, undefined)
  assert.equal(publicOrder.transferBankReference, undefined)
  const concurrentItem = await product()
  const concurrentOrder = await order([concurrentItem])
  await Promise.all([
    confirm(concurrentOrder),
    payload.update({
      collection: 'orders',
      id: concurrentOrder.id,
      data: { transferReportedAt: new Date().toISOString() },
    }),
  ])
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: concurrentOrder.id })).paymentStatus,
    'approved',
  )
  assert.equal(await stock(concurrentItem), 2)
  const brokenLink = await order([concurrentItem])
  await payload.db.pool.query("UPDATE local_sales SET status = 'cancelled' WHERE order_id = $1", [
    brokenLink.id,
  ])
  assert.equal((await confirm(brokenLink)).body.code, 'localSale')
  assert.equal(await stock(concurrentItem), 2)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: brokenLink.id })).transferBankReference,
    null,
  )
  const draftedItem = await product()
  const draftedOrder = await order([draftedItem])
  await payload.update({
    collection: 'products',
    id: draftedItem.id,
    draft: true,
    data: { _status: 'draft', priceInARS: 12000 },
  })
  const draftConfirmation = await confirm(draftedOrder)
  assert.equal(
    draftConfirmation.body.code,
    'catalog',
    'Un borrador no debe publicarse ni reemplazar el stock durante la confirmación',
  )
  const publishedItem = await payload.findByID({
    collection: 'products',
    id: draftedItem.id,
    draft: false,
  })
  assert.equal(publishedItem.inventory, 3)
  assert.equal(publishedItem.priceInARS, 10000)
  assert.equal(publishedItem._status, 'published')
  console.log(
    'PASS: un borrador pendiente bloquea la confirmación sin alterar el producto publicado',
  )
  const mismatchedSaleOrder = await order([draftedItem])
  await payload.update({
    collection: 'products',
    id: draftedItem.id,
    data: { _status: 'published', priceInARS: 10000 },
  })
  await payload.db.pool.query(
    "UPDATE local_sales SET payment_method = 'mercado-pago' WHERE order_id = $1",
    [mismatchedSaleOrder.id],
  )
  const mismatchedResult = await confirm(mismatchedSaleOrder)
  assert.equal(
    mismatchedResult.body.code,
    'localSale',
    'No debe aprobar una venta local con otro medio de pago',
  )
  assert.equal(await stock(draftedItem), 3)
  await payload.db.pool.query(
    "UPDATE local_sales SET payment_method = 'bank-transfer', snapshot = '{}'::jsonb WHERE order_id = $1",
    [mismatchedSaleOrder.id],
  )
  assert.equal((await confirm(mismatchedSaleOrder)).body.code, 'localSale')
  assert.equal(await stock(draftedItem), 3)
  const variantType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'size', label: 'Tamaño' },
  })
  const option = await payload.create({
    collection: 'variantOptions',
    data: { variantType: variantType.id, value: 'small', label: 'Pequeño' },
  })
  const parent = await payload.create({
    collection: 'products',
    locale: 'es',
    data: {
      title: 'Con variantes',
      summary: 'Prueba',
      slug: randomUUID(),
      enableVariants: true,
      variantTypes: [variantType.id],
      _status: 'draft',
    },
  })
  await payload.update({
    collection: 'products',
    id: parent.id,
    locale: 'en',
    data: { title: 'With variants', summary: 'Test' },
  })
  const variant = await payload.create({
    collection: 'variants',
    data: {
      product: parent.id,
      options: [option.id],
      sku: randomUUID(),
      inventory: 1,
      priceInARSEnabled: true,
      priceInARS: 10000,
      _status: 'published',
    },
  })
  const alternateOption = await payload.create({
    collection: 'variantOptions',
    data: { variantType: variantType.id, value: 'large', label: 'Grande' },
  })
  await payload.create({
    collection: 'variants',
    data: {
      product: parent.id,
      options: [alternateOption.id],
      sku: randomUUID(),
      inventory: 2,
      priceInARSEnabled: true,
      priceInARS: 10000,
      _status: 'published',
    },
  })
  await payload.update({ collection: 'products', id: parent.id, data: { _status: 'published' } })
  const variantOrder = await order([parent], {
    items: [{ product: parent.id, variant: variant.id, quantity: 1 }],
    commercialSnapshot: {
      items: [
        {
          productId: String(parent.id),
          merchandiseId: `variant:${variant.id}`,
          sku: variant.sku,
          quantity: 1,
          unitPrice: { amount: '100', currencyCode: 'ARS' },
          total: { amount: '100', currencyCode: 'ARS' },
        },
      ],
    },
  })
  await payload.update({
    collection: 'variants',
    id: variant.id,
    draft: true,
    data: { _status: 'draft', inventory: 10 },
  })
  assert.equal((await confirm(variantOrder)).body.code, 'catalog')
  assert.equal(
    (await payload.findByID({ collection: 'variants', id: variant.id, draft: false })).inventory,
    1,
  )
  await payload.update({
    collection: 'variants',
    id: variant.id,
    data: { _status: 'published', inventory: 1 },
  })
  assert.equal((await confirm(variantOrder)).status, 200)
  assert.equal((await payload.findByID({ collection: 'variants', id: variant.id })).inventory, 0)
  const notification = {
    idempotencyKey: 'a'.repeat(64),
    resourceId: '123456',
    paymentStatus: 'approved',
    amount: 10000,
    currency: 'ARS',
    publicReference: variantOrder.publicReference,
    liveMode: false,
    providerUpdatedAt: '2026-09-16T12:00:00.000Z',
  }
  for (const actor of [undefined, customer]) {
    await assert.rejects(
      payload.create({
        collection: 'payment-notifications',
        data: notification,
        user: actor,
        overrideAccess: false,
      }),
    )
    await assert.rejects(
      payload.find({ collection: 'payment-notifications', user: actor, overrideAccess: false }),
    )
  }
  const writes = await Promise.allSettled(
    [0, 1].map(() =>
      payload.create({
        collection: 'payment-notifications',
        data: notification,
        user,
        overrideAccess: false,
      }),
    ),
  )
  assert.equal(writes.filter((result) => result.status === 'fulfilled').length, 1)
  const notifications = await payload.find({
    collection: 'payment-notifications',
    user,
    overrideAccess: false,
  })
  assert.equal(notifications.totalDocs, 1)
  assert.equal(notifications.docs[0].amount, 10000)
  await assert.rejects(
    payload.update({
      collection: 'payment-notifications',
      id: notifications.docs[0].id,
      data: { paymentStatus: 'pending' },
      user,
      overrideAccess: false,
    }),
  )
  await assert.rejects(
    payload.delete({
      collection: 'payment-notifications',
      id: notifications.docs[0].id,
      user,
      overrideAccess: false,
    }),
  )
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: mismatchedSaleOrder.id })).paymentStatus,
    'pending',
  )
  const { reconcileTransferEndpoint } = await import('../src/utilities/reconcileTransfer.ts')
  const reconcile = async (notification, strategy = 'api-key') => {
    const req = await createLocalReq(
      { user: { ...user, collection: 'users', _strategy: strategy } },
      payload,
    )
    req.json = async () => ({ idempotencyKey: notification.idempotencyKey })
    return reconcileTransferEndpoint.handler(req)
  }
  const observation = async (document, overrides = {}) => {
    const observedAt = new Date().toISOString()
    return payload.create({
      collection: 'payment-notifications',
      data: {
        idempotencyKey: randomBytes(32).toString('hex'),
        resourceId: String(900000 + document.id),
        paymentStatus: 'approved',
        amount: document.amount,
        currency: 'ARS',
        publicReference: document.publicReference,
        liveMode: false,
        providerUpdatedAt: observedAt,
        approvedAt: observedAt,
        payerType: document.transferIdentification.type,
        payerNumber: document.transferIdentification.number,
        paymentType: 'bank_transfer',
        statusDetail: 'accredited',
        refundedAmount: 0,
        ...overrides,
      },
    })
  }
  const autoProduct = await product(3)
  const automaticOnlyOrder = await order([autoProduct], {
    transferIdentification: { type: 'DNI', number: '9999999' },
  })
  const automaticOnlyNotification = await observation(automaticOnlyOrder)
  assert.equal((await reconcile(automaticOnlyNotification)).status, 200)
  const automaticallyConfirmed = await payload.findByID({
    collection: 'orders',
    id: automaticOnlyOrder.id,
  })
  assert.equal(automaticallyConfirmed.transferVerification.method, 'mercado-pago')
  assert.equal(automaticallyConfirmed.paymentStatus, 'approved')
  const automaticSale = await payload.find({
    collection: 'localSales',
    where: { order: { equals: automaticOnlyOrder.id } },
  })
  assert.equal(automaticSale.docs[0].status, 'paid')
  assert.equal(automaticSale.docs[0].paymentEvidence.method, 'mercado-pago')
  const autoOrder = await order([autoProduct], {
    transferIdentification: { type: 'DNI', number: '2222222' },
    customer: customer.id,
  })
  const incoming = await observation(autoOrder)
  assert.equal((await reconcile(incoming, 'local-jwt')).status, 403)
  const automaticResults = await Promise.all([
    reconcile(incoming),
    reconcile(incoming),
    confirm(autoOrder, { reference: incoming.resourceId }),
  ])
  assert.deepEqual(
    automaticResults.map((result) => result.status),
    [200, 200, 200],
  )
  assert.equal(await stock(autoProduct), 1)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: autoOrder.id })).paymentStatus,
    'approved',
  )
  const privateAutoOrder = await payload.findByID({
    collection: 'orders',
    id: autoOrder.id,
    user: customer,
    overrideAccess: false,
  })
  assert.equal(privateAutoOrder.id, autoOrder.id)
  assert.equal(privateAutoOrder.transferIdentification, undefined)
  const refund = await observation(autoOrder, {
    paymentStatus: 'refunded',
    refundedAmount: autoOrder.amount,
  })
  assert.equal((await reconcile(refund)).status, 200)
  assert.match(
    (await payload.findByID({ collection: 'payment-notifications', id: refund.id })).reconciliation,
    /^manual_review:/,
  )
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: autoOrder.id })).paymentStatus,
    'approved',
  )
  assert.equal(await stock(autoProduct), 1)

  const recoveryProduct = await product(1)
  const recoveryOrder = await order([recoveryProduct], {
    transferIdentification: { type: 'DNI', number: '1234567' },
  })
  const recoveryNotification = await observation(recoveryOrder)
  const originalUpdate = payload.update.bind(payload)
  payload.update = async (args) => {
    if (args.collection === 'payment-notifications')
      throw new Error('Falla simulada al guardar el resultado')
    return originalUpdate(args)
  }
  try {
    assert.equal((await reconcile(recoveryNotification)).status, 503)
  } finally {
    payload.update = originalUpdate
  }
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: recoveryOrder.id })).paymentStatus,
    'approved',
  )
  assert.equal(await stock(recoveryProduct), 0)
  assert.equal((await reconcile(recoveryNotification)).status, 200)
  assert.equal(await stock(recoveryProduct), 0)
  const reviewProduct = await product()
  const reviewOrder = await order([reviewProduct], {
    transferIdentification: { type: 'DNI', number: '3333333' },
  })
  for (const changes of [
    { payerNumber: '4444444' },
    { amount: 1 },
    { refundedAmount: 1 },
    { paymentType: 'credit_card' },
    { paymentStatus: 'refunded' },
  ]) {
    const incomingReview = await observation(reviewOrder, changes)
    assert.equal((await reconcile(incomingReview)).status, 200)
    const saved = await payload.findByID({
      collection: 'payment-notifications',
      id: incomingReview.id,
    })
    assert.match(saved.reconciliation, /^manual_review:/)
    assert.equal(
      (await payload.findByID({ collection: 'orders', id: reviewOrder.id })).paymentStatus,
      'pending',
    )
  }
  assert.equal(await stock(reviewProduct), 3)
  const ambiguousOrder = await order([reviewProduct], {
    transferIdentification: { type: 'DNI', number: '5555555' },
  })
  await order([reviewProduct], { transferIdentification: ambiguousOrder.transferIdentification })
  const ambiguous = await observation(ambiguousOrder, { publicReference: null })
  assert.equal((await reconcile(ambiguous)).status, 200)
  assert.match(
    (await payload.findByID({ collection: 'payment-notifications', id: ambiguous.id }))
      .reconciliation,
    /ambiguous/,
  )
  assert.equal(await stock(reviewProduct), 3)
  await assert.rejects(order([reviewProduct], { transferIdentification: null }))
  const lateOrder = await order([reviewProduct], {
    transferIdentification: { type: 'DNI', number: '6666666' },
    paymentExpiresAt: new Date(Date.now() - 1000).toISOString(),
  })
  const lateIncoming = await observation(lateOrder)
  assert.equal((await reconcile(lateIncoming)).status, 200)
  assert.match(
    (await payload.findByID({ collection: 'payment-notifications', id: lateIncoming.id }))
      .reconciliation,
    /^manual_review:/,
  )
  const noStockProduct = await product(0)
  const noStockOrder = await order([noStockProduct], {
    transferIdentification: { type: 'DNI', number: '7777777' },
  })
  const noStockIncoming = await observation(noStockOrder)
  assert.equal((await reconcile(noStockIncoming)).status, 200)
  assert.match(
    (await payload.findByID({ collection: 'payment-notifications', id: noStockIncoming.id }))
      .reconciliation,
    /^manual_review:/,
  )
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: noStockOrder.id })).paymentStatus,
    'pending',
  )
  const staleOrder = await order([reviewProduct], {
    transferIdentification: { type: 'DNI', number: '8888888' },
  })
  const staleIncoming = await observation(staleOrder, {
    providerUpdatedAt: new Date(Date.now() - 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2000).toISOString(),
  })
  await observation(staleOrder, { paymentStatus: 'refunded' })
  assert.equal((await reconcile(staleIncoming)).status, 200)
  assert.match(
    (await payload.findByID({ collection: 'payment-notifications', id: staleIncoming.id }))
      .reconciliation,
    /superseded/,
  )
  assert.equal(await stock(reviewProduct), 3)
  console.log(
    'PASS: conciliación automática/manual concurrente, privacidad, documento obligatorio y excepciones sin descuento de stock',
  )
  const inboxMigration = migrations.find(
    (migration) => migration.name === '20260917_120000_transfer_identification',
  )
  await payload.db.drizzle.transaction((db) => inboxMigration.down({ db, payload, req: {} }))
  const baseInboxMigration = migrations.find(
    (migration) => migration.name === '20260917_110000_payment_notifications',
  )
  await payload.db.drizzle.transaction((db) => baseInboxMigration.down({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => baseInboxMigration.up({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => inboxMigration.up({ db, payload, req: {} }))
  const migratedOrder = await payload.findByID({ collection: 'orders', id: autoOrder.id })
  assert.equal(migratedOrder.paymentStatus, 'approved')
  assert.equal(migratedOrder.transferIdentification, null)
  console.log(
    'PASS: bandeja privada, deduplicación concurrente, registros inmutables y migración reversible',
  )
  await payload.update({ collection: 'users', id: user.id, data: { roles: ['customer'] } })
  assert.equal((await reconcile(incoming)).status, 403)
  assert.equal((await confirm(variantOrder)).status, 403)
  console.log(
    'PASS: privacidad, declaración concurrente, rollback de vínculo local, variante y rol revocado',
  )
  const lastMigration = migrations.find(
    (migration) => migration.name === '20260917_100000_transfer_verification',
  )
  await payload.db.drizzle.transaction((db) => lastMigration.down({ db, payload, req: {} }))
  const persisted = await payload.db.pool.query('SELECT payment_status FROM orders WHERE id = $1', [
    firstOrder.id,
  ])
  assert.equal(persisted.rows[0].payment_status, 'approved')
  await payload.db.drizzle.transaction((db) => lastMigration.up({ db, payload, req: {} }))
  console.log(
    'PASS: migración y rollback aditivo conservan pedidos; el rollback elimina la auditoría, requiere respaldo',
  )
} finally {
  isCleaningUp = true
  if (payload) await payload.destroy()
  await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await admin.end()
}
