import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

export async function staffCashCases({
  payload,
  createLocalReq,
  user,
  customer,
  product,
  order,
  stock,
}) {
  const password = randomBytes(24).toString('hex')
  const adminReq = await createLocalReq({ user: { ...user, collection: 'users' } }, payload)
  const moveMigration = await import('../src/migrations/20260917_150000_staff_cash_commerce.ts')
  const settings = await payload.updateGlobal({
    slug: 'commerce-settings',
    data: { cashStaffEnabled: true, cashStaffPassword: password },
    req: adminReq,
  })
  const staff = (
    await payload.find({
      collection: 'users',
      where: { email: { equals: 'cash-staff@storefront.invalid' } },
    })
  ).docs[0]
  for (const enabled of [false, true]) {
    await payload.updateGlobal({
      slug: 'commerce-settings',
      data: { cashStaffEnabled: enabled },
      req: adminReq,
    })
    await payload.db.drizzle.transaction((db) => moveMigration.down({ db, payload, req: {} }))
    await payload.db.drizzle.transaction((db) => moveMigration.up({ db, payload, req: {} }))
    assert.equal(
      (await payload.findGlobal({ slug: 'commerce-settings', req: adminReq })).cashStaffEnabled,
      enabled,
    )
  }
  assert.ok(
    staff,
    'Configurar la contraseña debe crear una identidad de caja sin permisos de administrador',
  )
  assert.deepEqual(staff.roles, ['customer'])
  assert.equal(JSON.stringify(settings).includes(password), false)

  const request = async (
    path,
    { token, actor, body, reference, origin = new URL(payload.config.serverURL).origin } = {},
  ) => {
    const headers = new Headers({ origin, ...(token ? { Authorization: `JWT ${token}` } : {}) })
    const authenticated = token ? (await payload.auth({ headers })).user : actor
    const req = await createLocalReq({ user: authenticated ?? null }, payload)
    req.headers = headers
    req.routeParams = { reference }
    req.json = async () => body
    const endpoint = payload.config.endpoints.find((entry) => entry.path === path)
    assert.ok(endpoint)
    const response = await endpoint.handler(req)
    return { status: response.status, body: await response.json() }
  }
  const login = await request('/storefront-staff/login', { body: { password } })
  assert.equal(login.status, 200)
  const token = login.body.token
  assert.ok(token)
  assert.equal((await request('/storefront-staff/session')).status, 401)
  assert.equal(
    (await request('/storefront-staff/session', { actor: { ...customer, collection: 'users' } }))
      .status,
    401,
  )
  assert.equal((await request('/storefront-staff/session', { token })).status, 200)
  await payload.db.drizzle.transaction((db) => moveMigration.down({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => moveMigration.up({ db, payload, req: {} }))
  assert.equal((await request('/storefront-staff/session', { token })).status, 200)
  const staffReq = await createLocalReq({ user: { ...staff, collection: 'users' } }, payload)
  assert.equal(await payload.collections.users.config.access.admin({ req: staffReq }), false)
  assert.equal(await payload.collections.users.config.access.update({ req: staffReq }), false)
  await assert.rejects(
    payload.login({ collection: 'users', data: { email: staff.email, password } }),
  )
  await assert.rejects(
    payload.updateGlobal({
      slug: 'commerce-settings',
      data: { cashStaffPassword: 'corta' },
      req: adminReq,
    }),
  )
  const anonymous = await createLocalReq({ user: null }, payload)
  assert.equal(
    await payload.collections.users.config.access.create({ req: anonymous }),
    false,
    'El alta anónima no puede crear administradores después del bootstrap',
  )
  const customerReq = await createLocalReq({ user: { ...customer, collection: 'users' } }, payload)
  const unchangedRole = await payload.update({
    collection: 'users',
    id: customer.id,
    data: { roles: ['admin'] },
    overrideAccess: false,
    req: customerReq,
  })
  assert.deepEqual(unchangedRole.roles, ['customer'], 'Un cliente no puede elevar su propio rol')
  const publicSettings = await payload.findGlobal({
    slug: 'commerce-settings',
    overrideAccess: false,
    req: anonymous,
  })
  assert.equal(publicSettings.cashStaffPassword, undefined)
  assert.equal(publicSettings.cashStaffEnabled, true)
  await assert.rejects(
    payload.updateGlobal({
      slug: 'commerce-settings',
      data: { cashStaffEnabled: false },
      req: anonymous,
      overrideAccess: false,
    }),
  )
  await assert.rejects(
    payload.update({ collection: 'users', id: staff.id, data: { roles: ['admin'] } }),
  )

  const item = await product(2)
  const cart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: item.id, quantity: 1 }] },
  })
  const purchase = await order([item], {
    paymentMethod: 'cash',
    cartReference: `${cart.id}::${cart.secret}`,
    paymentExpiresAt: null,
    transferIdentification: null,
  })
  const reference = purchase.publicReference
  assert.equal((await request('/storefront-staff/orders/:reference', { reference })).status, 401)
  const otherMethod = await order([item])
  assert.equal(
    (
      await request('/storefront-staff/orders/:reference', {
        token,
        reference: otherMethod.publicReference,
      })
    ).status,
    404,
  )
  const detail = await request('/storefront-staff/orders/:reference', { token, reference })
  assert.equal(detail.status, 200)
  assert.equal(detail.body.order.amount, purchase.amount)
  assert.equal(JSON.stringify(detail.body).includes(cart.secret), false)
  const confirmation = { token, reference, body: { amount: purchase.amount, received: true } }
  assert.equal(
    (
      await request('/storefront-staff/orders/:reference/confirm', {
        ...confirmation,
        origin: 'https://evil.example',
      })
    ).status,
    403,
  )
  assert.equal(
    (
      await request('/storefront-staff/orders/:reference/confirm', {
        ...confirmation,
        body: { amount: 1, received: true },
      })
    ).status,
    409,
  )
  assert.equal(
    (await request('/storefront-staff/orders/:reference/confirm', confirmation)).status,
    200,
  )
  assert.equal(
    (await request('/storefront-staff/orders/:reference/confirm', confirmation)).status,
    200,
  )
  assert.equal(await stock(item), 1)
  assert.ok((await payload.findByID({ collection: 'carts', id: cart.id })).purchasedAt)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: purchase.id })).cashVerification.verifiedBy,
    staff.id,
  )

  assert.equal((await request('/storefront-staff/logout', { token })).status, 200)
  assert.equal((await request('/storefront-staff/session', { token })).status, 401)
  const nextToken = (await request('/storefront-staff/login', { body: { password } })).body.token
  const replacement = randomBytes(24).toString('hex')
  await payload.updateGlobal({
    slug: 'commerce-settings',
    data: { cashStaffPassword: replacement },
    req: adminReq,
  })
  assert.equal((await request('/storefront-staff/session', { token: nextToken })).status, 401)
  assert.equal((await request('/storefront-staff/login', { body: { password } })).status, 401)
  const currentToken = (
    await request('/storefront-staff/login', { body: { password: replacement } })
  ).body.token
  await payload.updateGlobal({
    slug: 'commerce-settings',
    data: { cashStaffEnabled: false },
    req: adminReq,
  })
  assert.equal((await request('/storefront-staff/session', { token: currentToken })).status, 401)
  assert.equal(
    (await request('/storefront-staff/login', { body: { password: replacement } })).status,
    401,
  )
  await payload.updateGlobal({
    slug: 'commerce-settings',
    data: { cashStaffEnabled: true },
    req: adminReq,
  })
  const expiredToken = (
    await request('/storefront-staff/login', { body: { password: replacement } })
  ).body.token
  await payload.db.drizzle.execute(
    (await import('@payloadcms/db-postgres'))
      .sql`UPDATE users_sessions SET created_at = NOW() - INTERVAL '16 minutes' WHERE _parent_id = ${staff.id}`,
  )
  assert.equal((await request('/storefront-staff/session', { token: expiredToken })).status, 401)
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal(
      (await request('/storefront-staff/login', { body: { password: 'incorrecta' } })).status,
      401,
    )
  assert.equal(
    (await request('/storefront-staff/login', { body: { password: replacement } })).status,
    401,
  )
  await payload.updateGlobal({
    slug: 'commerce-settings',
    data: { cashStaffEnabled: false },
    req: adminReq,
  })
  const migration = await import('../src/migrations/20260917_140000_staff_cash.ts')
  await payload.db.drizzle.transaction((db) => moveMigration.down({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => migration.down({ db, payload, req: {} }))
  const { sql } = await import('@payloadcms/db-postgres')
  const rollback = await payload.db.drizzle.execute(
    sql`SELECT hash, salt FROM users WHERE id = ${staff.id}`,
  )
  assert.equal(rollback.rows[0].hash, null)
  assert.equal(rollback.rows[0].salt, null)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: purchase.id })).cashVerification.verifiedBy,
    staff.id,
  )
  await payload.db.drizzle.transaction((db) => migration.up({ db, payload, req: {} }))
  await payload.db.drizzle.transaction((db) => moveMigration.up({ db, payload, req: {} }))
  console.log(
    'PASS: caja del storefront, permisos, CSRF, confirmación, cierre del carrito, logout y rotación',
  )
}
