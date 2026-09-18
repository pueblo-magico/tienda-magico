import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { confirmCashEndpoint } from '../src/utilities/confirmCash.ts'

export async function cashConfirmationCases({
  payload,
  createLocalReq,
  user,
  customer,
  product,
  order,
  stock,
  confirm,
  migrations,
}) {
  const migration = migrations.find((item) => item.name === '20260917_130000_cash_payment')
  await payload.db.drizzle.transaction((db) => migration.down({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => migration.up({ db, payload, req: {} }))
  const cashOrder = (items, overrides = {}) =>
    order(items, {
      paymentMethod: 'cash',
      paymentExpiresAt: null,
      transferIdentification: null,
      ...overrides,
    })
  const receive = async (
    document,
    input = {},
    actor = user,
    origin = new URL(payload.config.serverURL).origin,
  ) => {
    const req = await createLocalReq({ user: { ...actor, collection: 'users' } }, payload)
    req.headers = new Headers({ origin })
    req.routeParams = { id: String(document.id) }
    req.json = async () => ({ amount: document.amount, received: true, ...input })
    const response = await confirmCashEndpoint.handler(req)
    return { status: response.status, body: await response.json() }
  }
  const item = await product()
  const cart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: item.id, quantity: 1 }] },
  })
  const document = await cashOrder([item], { cartReference: `${cart.id}::${cart.secret}` })
  assert.equal((await receive(document, {}, customer)).status, 403)
  assert.equal((await receive(document, {}, { ...customer, roles: ['admin'] })).status, 403)
  assert.equal((await receive(document, {}, user, 'https://otro.example')).status, 403)
  assert.equal((await receive(document, { amount: 1 })).body.code, 'amount')
  const results = await Promise.all([receive(document), receive(document)])
  assert.deepEqual(
    results.map((result) => result.status),
    [200, 200],
  )
  assert.equal(await stock(item), 2)
  const approved = await payload.findByID({ collection: 'orders', id: document.id })
  assert.equal(approved.paymentStatus, 'approved')
  const completedCart = await payload.findByID({ collection: 'carts', id: cart.id })
  assert.ok(completedCart.purchasedAt, 'El pago confirmado debe completar el carrito')
  assert.equal(completedCart.items.length, 1)
  await assert.rejects(payload.update({ collection: 'carts', id: cart.id, data: { items: [] } }))
  await assert.rejects(
    payload.update({ collection: 'carts', id: cart.id, data: { purchasedAt: null } }),
  )
  await assert.rejects(payload.delete({ collection: 'carts', id: cart.id }))
  assert.equal((await receive(document)).status, 200)
  assert.equal(
    (await payload.findByID({ collection: 'carts', id: cart.id })).purchasedAt,
    completedCart.purchasedAt,
  )
  assert.equal(approved.cashVerification.verifiedBy, user.id)
  const sale = (
    await payload.find({ collection: 'localSales', where: { order: { equals: document.id } } })
  ).docs[0]
  assert.equal(sale.status, 'paid')
  assert.equal(sale.paymentStatus, 'approved')
  assert.equal(sale.paymentEvidence.method, 'cash')
  assert.equal(approved.cashVerification.amount, document.amount)
  assert.equal(approved.cashVerification.stockMovements.length, 1)

  const available = await product()
  const unavailable = await product(0)
  const insufficient = await cashOrder([available, unavailable])
  assert.equal((await receive(insufficient)).body.code, 'stock')
  assert.equal(await stock(available), 3)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: insufficient.id })).paymentStatus,
    'pending',
  )

  const partialCart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: available.id, quantity: 1 }] },
  })
  await assert.rejects(
    payload.update({
      collection: 'carts',
      id: partialCart.id,
      data: { purchasedAt: new Date().toISOString() },
    }),
  )
  const partial = await cashOrder([available], {
    cartReference: `${partialCart.id}::${partialCart.secret}`,
  })
  const originalUpdate = payload.update
  payload.update = async function (args) {
    if (
      args.collection === 'orders' &&
      args.id === partial.id &&
      args.data.paymentStatus === 'approved'
    ) {
      await originalUpdate.call(this, args)
      throw new Error('Falla simulada después de actualizar stock, venta y carrito')
    }
    return originalUpdate.call(this, args)
  }
  try {
    assert.equal((await receive(partial)).status, 500)
  } finally {
    payload.update = originalUpdate
  }
  assert.equal(await stock(available), 3)
  assert.equal(
    (await payload.findByID({ collection: 'carts', id: partialCart.id })).purchasedAt,
    null,
  )
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: partial.id })).paymentStatus,
    'pending',
  )
  const rolledBack = (
    await payload.find({ collection: 'localSales', where: { order: { equals: partial.id } } })
  ).docs[0]
  assert.equal(rolledBack.status, 'pending_payment')

  const lastItem = await product(1)
  const transferCart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: lastItem.id, quantity: 1 }] },
  })
  const transferOrder = await order([lastItem], {
    cartReference: `${transferCart.id}::${transferCart.secret}`,
  })
  assert.equal(
    (await payload.findByID({ collection: 'carts', id: transferCart.id })).purchasedAt,
    null,
  )
  assert.equal((await confirm(transferOrder)).status, 200)
  assert.equal(await stock(lastItem), 0)
  const paidTransferCart = await payload.findByID({ collection: 'carts', id: transferCart.id })
  assert.ok(paidTransferCart.purchasedAt)
  assert.equal(paidTransferCart.items.length, 1)
  assert.equal(paidTransferCart.subtotal, transferCart.subtotal)

  const unrelatedCart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: available.id, quantity: 1 }] },
  })
  const wrongReference = await cashOrder([available], {
    cartReference: `${unrelatedCart.id}::otro-secreto`,
  })
  assert.equal((await receive(wrongReference)).status, 200)
  assert.equal(
    (await payload.findByID({ collection: 'carts', id: unrelatedCart.id })).purchasedAt,
    null,
  )

  const shared = randomUUID()
  const raceItem = await product()
  const cash = await cashOrder([raceItem], { cartReference: shared })
  const transfer = await order([raceItem], { cartReference: shared })
  const race = await Promise.all([receive(cash), confirm(transfer)])
  assert.deepEqual(race.map((result) => result.status).sort(), [200, 409])
  assert.equal(await stock(raceItem), 2)
  console.log('PASS: efectivo, autorización, concurrencia, stock, auditoría y rollback parcial')

  const replacementCart = randomUUID()
  const previous = await cashOrder([available], { cartReference: replacementCart })
  const replacement = await cashOrder([available], { cartReference: replacementCart })
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: previous.id })).paymentStatus,
    'cancelled',
  )
  assert.equal((await receive(previous)).status, 409)
  const cancelledSale = (
    await payload.find({ collection: 'localSales', where: { order: { equals: previous.id } } })
  ).docs[0]
  assert.equal(cancelledSale.status, 'cancelled')
  assert.equal(cancelledSale.paymentStatus, 'cancelled')
  assert.equal((await receive(replacement)).status, 200)
  await assert.rejects(cashOrder([available], { cartReference: replacementCart }))

  const concurrentCart = randomUUID()
  const concurrentItem = await product()
  const original = await cashOrder([concurrentItem], { cartReference: concurrentCart })
  const [confirmation, creation] = await Promise.allSettled([
    receive(original),
    cashOrder([concurrentItem], { cartReference: concurrentCart }),
  ])
  assert.equal(confirmation.status, 'fulfilled')
  if (confirmation.value.status === 200) {
    assert.equal(creation.status, 'rejected')
    assert.equal(await stock(concurrentItem), 2)
  } else {
    assert.equal(confirmation.value.status, 409)
    assert.equal(creation.status, 'fulfilled')
    assert.equal((await receive(creation.value)).status, 200)
    assert.equal(await stock(concurrentItem), 2)
  }

  const lastUnit = await product(1)
  const lastOrders = await Promise.all([cashOrder([lastUnit]), cashOrder([lastUnit])])
  const lastResults = await Promise.all(lastOrders.map((document) => receive(document)))
  assert.deepEqual(lastResults.map((result) => result.status).sort(), [200, 409])
  assert.equal(await stock(lastUnit), 0)

  const replacementFailureCart = randomUUID()
  const retained = await cashOrder([available], { cartReference: replacementFailureCart })
  const beforeReplacement = await stock(available)
  const originalCreate = payload.create
  payload.create = async function (args) {
    if (args.collection === 'localSales')
      throw new Error('Falla simulada al crear la venta del reemplazo')
    return originalCreate.call(this, args)
  }
  try {
    await assert.rejects(cashOrder([available], { cartReference: replacementFailureCart }))
  } finally {
    payload.create = originalCreate
  }
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: retained.id })).paymentStatus,
    'pending',
  )
  const retainedSales = await payload.find({
    collection: 'localSales',
    where: { order: { equals: retained.id } },
  })
  assert.equal(retainedSales.docs[0].paymentStatus, 'pending')
  assert.equal(retainedSales.docs[0].status, 'pending_payment')
  const retainedOrders = await payload.find({
    collection: 'orders',
    where: { cartReference: { equals: replacementFailureCart } },
  })
  assert.equal(retainedOrders.totalDocs, 1)
  assert.equal(await stock(available), beforeReplacement)

  const reviewCart = randomUUID()
  const reviewOrder = await cashOrder([available], { cartReference: reviewCart })
  await payload.db.pool.query("UPDATE orders SET payment_status = 'unverified' WHERE id = $1", [
    reviewOrder.id,
  ])
  await assert.rejects(cashOrder([available], { cartReference: reviewCart }))
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: reviewOrder.id })).paymentStatus,
    'unverified',
  )
  const conflictCart = randomUUID()
  const conflictOrder = await cashOrder([available], { cartReference: conflictCart })
  await payload.db.pool.query("UPDATE local_sales SET status = 'conflict' WHERE order_id = $1", [
    conflictOrder.id,
  ])
  await assert.rejects(cashOrder([available], { cartReference: conflictCart }))
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: conflictOrder.id })).paymentStatus,
    'pending',
  )
  console.log('PASS: última unidad, rol obsoleto, reemplazo fallido atómico y pedidos por revisar')

  await assert.rejects(
    payload.db.drizzle.transaction((db) => migration.down({ db, payload, req: {} })),
  )
  const preserved = await payload.findByID({ collection: 'orders', id: document.id })
  assert.equal(preserved.paymentMethod, 'cash')
  assert.deepEqual(preserved.cashVerification, approved.cashVerification)
  console.log('PASS: reemplazo de efectivo y rollback bloqueado sin pérdida de auditoría')
  const receivedAt = new Date().toISOString()
  const receipt = { receivedAt, experienceRating: 5, experienceComment: 'Excelente atención' }
  await assert.rejects(payload.update({ collection: 'orders', id: reviewOrder.id, data: receipt }))
  await payload.update({ collection: 'orders', id: document.id, data: receipt })
  assert.equal((await receive(document)).status, 200)
  await assert.rejects(
    payload.update({ collection: 'orders', id: document.id, data: { experienceRating: 1 } }),
  )
  const received = await payload.findByID({ collection: 'orders', id: document.id })
  assert.equal(received.receivedAt, receivedAt)
  assert.equal(received.experienceRating, 5)
  assert.equal(received.experienceComment, receipt.experienceComment)
  const receiptMigration = migrations.find(
    (item) => item.name === '20260917_150000_order_receipt_feedback',
  )
  await assert.rejects(
    payload.db.drizzle.transaction((db) => receiptMigration.down({ db, payload, req: {} })),
  )
  console.log('PASS: recepción posterior al efectivo, inmutabilidad y rollback protegido')
}
