import assert from 'node:assert/strict'
import { test } from 'node:test'

const databaseURL = process.env.TIENDA_TEST_DATABASE_URL

test(
  'los acuerdos conservan autorización, auditoría e historial en PostgreSQL',
  { skip: !databaseURL },
  async () => {
    process.env.DATABASE_URL = databaseURL
    process.env.PAYLOAD_SECRET ??= 'local-supplier-agreement-integration-secret-not-for-production'

    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('../src/payload.config.ts'),
    ])
    const payload = await getPayload({ config })

    try {
      const suffix = Date.now()
      const finance = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `finanzas-${suffix}@example.test`,
          password: 'integration-test-password',
          roles: ['finance'],
        },
      })
      const purchasing = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `compras-${suffix}@example.test`,
          password: 'integration-test-password',
          roles: ['purchasing'],
        },
      })
      const admin = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `admin-${suffix}@example.test`,
          password: 'integration-test-password',
          roles: ['admin'],
        },
      })
      const editor = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `editor-${suffix}@example.test`,
          password: 'integration-test-password',
          roles: ['editor'],
        },
      })
      const customer = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `cliente-${suffix}@example.test`,
          password: 'integration-test-password',
          roles: ['customer'],
        },
      })
      const supplier = await payload.create({
        collection: 'suppliers',
        overrideAccess: true,
        data: {
          name: `Proveedor de integración ${suffix}`,
          reference: `PROV-${suffix}`,
          defaultTerms: { mode: 'purchase' },
        },
      })
      const draft = await payload.create({
        collection: 'supplier-agreements',
        overrideAccess: false,
        user: purchasing,
        data: {
          reference: `ACUERDO-${suffix}`,
          supplier: supplier.id,
          revision: 1,
          status: 'draft',
          terms: {
            mode: 'purchase',
            effectiveFrom: '2026-10-01T00:00:00.000Z',
          },
        },
      })

      await assert.rejects(() =>
        payload.update({
          collection: 'supplier-agreements',
          id: draft.id,
          overrideAccess: false,
          user: purchasing,
          data: { status: 'active' },
        }),
      )

      const active = await payload.update({
        collection: 'supplier-agreements',
        id: draft.id,
        overrideAccess: false,
        user: finance,
        data: { status: 'active' },
      })
      assert.equal(active.status, 'active')
      assert.equal(
        typeof active.approvedBy === 'object' ? active.approvedBy.id : active.approvedBy,
        finance.id,
      )
      assert.ok(active.approvedAt)

      for (const user of [undefined, customer, editor]) {
        await assert.rejects(() =>
          payload.find({
            collection: 'supplier-agreements',
            overrideAccess: false,
            user,
          }),
        )
      }
      await assert.doesNotReject(() =>
        payload.find({
          collection: 'supplier-agreements',
          overrideAccess: false,
          user: admin,
        }),
      )

      await assert.rejects(() =>
        payload.update({
          collection: 'supplier-agreements',
          id: active.id,
          overrideAccess: false,
          user: finance,
          data: { terms: { mode: 'purchase', effectiveFrom: '2026-11-01' } },
        }),
      )
      await assert.rejects(() =>
        payload.update({
          collection: 'supplier-agreements',
          id: active.id,
          overrideAccess: false,
          user: editor,
          data: { notes: 'No debe persistir' },
        }),
      )
      const unchanged = await payload.findByID({
        collection: 'supplier-agreements',
        id: active.id,
        overrideAccess: true,
      })
      assert.notEqual(unchanged.notes, 'No debe persistir')

      const overlapping = await payload.create({
        collection: 'supplier-agreements',
        overrideAccess: false,
        user: purchasing,
        data: {
          reference: `ACUERDO-SOLAPADO-${suffix}`,
          supplier: supplier.id,
          revision: 2,
          previousAgreement: active.id,
          status: 'draft',
          terms: {
            mode: 'purchase',
            effectiveFrom: '2026-10-15T00:00:00.000Z',
          },
        },
      })
      await assert.rejects(() =>
        payload.update({
          collection: 'supplier-agreements',
          id: overlapping.id,
          overrideAccess: false,
          user: finance,
          data: { status: 'active' },
        }),
      )
      await assert.rejects(() =>
        payload.delete({
          collection: 'supplier-agreements',
          id: active.id,
          overrideAccess: false,
          user: finance,
        }),
      )
      await assert.doesNotReject(() =>
        payload.delete({
          collection: 'supplier-agreements',
          id: overlapping.id,
          overrideAccess: false,
          user: purchasing,
        }),
      )
    } finally {
      await payload.destroy()
    }
  },
)
