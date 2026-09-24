import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

export async function customerAccountCases({ payload, createLocalReq, user, product, order }) {
  const password = randomBytes(24).toString('hex')
  const adminReq = await createLocalReq({ user: { ...user, collection: 'users' } }, payload)
  const createCustomer = async (email) =>
    payload.create({
      collection: 'users',
      overrideAccess: false,
      req: adminReq,
      data: { email, password, roles: ['customer'], name: 'Cliente de prueba' },
    })
  const first = await createCustomer('first-account@example.test')
  const second = await createCustomer('second-account@example.test')
  const login = async (email) =>
    (await payload.login({ collection: 'users', data: { email, password } })).token
  const firstToken = await login(first.email)
  const secondToken = await login(second.email)
  const request = async (path, token, body, origin = new URL(payload.config.serverURL).origin) => {
    const headers = new Headers({ origin, ...(token ? { Authorization: `JWT ${token}` } : {}) })
    const actor = token ? (await payload.auth({ headers })).user : null
    const req = await createLocalReq({ user: actor }, payload)
    req.headers = headers
    req.json = async () => body
    const endpoint = payload.config.endpoints.find(
      (entry) => entry.path === `/storefront-customer/${path}`,
    )
    const response = await endpoint.handler(req)
    return { status: response.status, body: await response.json() }
  }
  assert.equal((await request('session')).status, 401)
  assert.deepEqual(first.roles, ['customer'])
  assert.equal((await request('link', undefined, { references: [] })).status, 401)
  for (const references of [['invalid'], Array(21).fill(`100::${'a'.repeat(40)}`)]) {
    assert.equal((await request('link', firstToken, { references })).status, 400)
  }
  assert.equal((await request('session', firstToken)).body.customer.id, first.id)
  const customerReq = await createLocalReq({ user: { ...first, collection: 'users' } }, payload)
  assert.equal(await payload.collections.users.config.access.admin({ req: customerReq }), false)
  const reference = `100::${randomBytes(20).toString('hex')}`
  const item = await product()
  const guest = await order([item], { cartReference: reference })
  assert.equal(
    (await request('link', firstToken, { references: [reference] }, 'https://evil.example')).status,
    403,
  )
  assert.equal((await request('link', firstToken, { references: [reference] })).status, 200)
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: guest.id, depth: 0 })).customer,
    first.id,
  )
  const sibling = await order([item], { cartReference: reference })
  await request('link', secondToken, { references: [reference] })
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: sibling.id, depth: 0 })).customer ?? null,
    null,
  )
  assert.deepEqual((await request('references', secondToken)).body.references, [])
  assert.deepEqual((await request('references', firstToken)).body.references, [reference])
  const otherDeviceToken = await login(first.email)
  assert.deepEqual((await request('references', otherDeviceToken)).body.references, [reference])
  const otherCustomerReq = await createLocalReq(
    { user: { ...second, collection: 'users' } },
    payload,
  )
  await assert.rejects(
    payload.findByID({
      collection: 'users',
      id: first.id,
      overrideAccess: false,
      req: otherCustomerReq,
    }),
  )
  await request('link', firstToken, { references: [reference] })
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: sibling.id, depth: 0 })).customer,
    first.id,
  )
  const concurrentReference = `101::${randomBytes(20).toString('hex')}`
  const concurrentOrder = await order([item], { cartReference: concurrentReference })
  const attempts = await Promise.all([
    request('link', firstToken, { references: [concurrentReference] }),
    request('link', secondToken, { references: [concurrentReference] }),
  ])
  assert.ok(attempts.every((result) => result.status === 200))
  const winner = (
    await payload.findByID({ collection: 'orders', id: concurrentOrder.id, depth: 0 })
  ).customer
  assert.ok([first.id, second.id].includes(winner))
  const losingToken = winner === first.id ? secondToken : firstToken
  assert.equal(
    (await request('references', losingToken)).body.references.includes(concurrentReference),
    false,
  )
  assert.equal((await request('logout', firstToken, {})).status, 200)
  const emailOnly = await order([item], { customerEmail: first.email })
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: emailOnly.id, depth: 0 })).customer ?? null,
    null,
  )
  await assert.rejects(
    payload.update({
      collection: 'users',
      id: first.id,
      data: { enableAPIKey: true, apiKey: 'not-a-real-secret' },
      req: customerReq,
      overrideAccess: false,
    }),
  )
  assert.equal((await request('session', firstToken)).status, 401)
  assert.equal((await request('references', firstToken)).status, 401)
  assert.equal((await request('session', otherDeviceToken)).status, 200)
  assert.equal((await request('logout', otherDeviceToken, {})).status, 200)
  await payload.update({
    collection: 'users',
    id: second.id,
    data: { sessions: [] },
    req: adminReq,
  })
  assert.equal((await request('session', secondToken)).status, 401)
  console.log('Cuentas: propiedad, CSRF, sesiones revocadas y vinculación verificados.')
}
