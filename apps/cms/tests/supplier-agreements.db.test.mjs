import assert from 'node:assert/strict'
import { test } from 'node:test'

const databaseURL = process.env.TIENDA_TEST_DATABASE_URL

test(
  'los acuerdos conservan autorización, auditoría e historial en PostgreSQL',
  { skip: !databaseURL },
  async () => {
    process.env.DATABASE_URL = databaseURL
    process.env.PAYLOAD_SECRET ??= 'local-supplier-agreement-integration-secret-not-for-production'

    const [{ getPayload }, { default: config }, { GRAPHQL_POST, REST_GET, REST_PATCH }] =
      await Promise.all([
        import('payload'),
        import('../src/payload.config.ts'),
        import('@payloadcms/next/routes'),
      ])
    const payload = await getPayload({ config })
    const restGet = REST_GET(config)
    const restPatch = REST_PATCH(config)
    const graphQLPost = GRAPHQL_POST(config)

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
          contactEmail: `contacto-${suffix}@example.test`,
          notes: `Nota privada proveedor ${suffix}`,
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

      const product = await payload.create({
        collection: 'products',
        overrideAccess: false,
        user: purchasing,
        locale: 'es',
        data: {
          title: `Producto privado ${suffix}`,
          summary: 'Resumen visible inicial',
          slug: `producto-privado-${suffix}`,
          sku: `PRIVADO-${suffix}`,
          inventory: 2,
          priceInARSEnabled: true,
          priceInARS: 10000,
          _status: 'published',
          supplier: supplier.id,
          supplierSKU: `SKU-PROVEEDOR-${suffix}`,
          purchaseCost: {
            amountMinor: 5000,
            currency: 'BRL',
            baseQuantity: 1,
            baseUnit: 'unit',
            updatedAt: '2026-10-11T00:00:00.000Z',
          },
          termsOverride: { mode: 'inherit' },
          purchasingNotes: 'Dato privado original',
        },
      })

      for (const user of [undefined, customer, editor]) {
        const visibleProduct = await payload.findByID({
          collection: 'products',
          id: product.id,
          depth: 0,
          overrideAccess: false,
          user,
        })
        for (const privateField of [
          'supplier',
          'supplierSKU',
          'purchaseCost',
          'termsOverride',
          'purchasingNotes',
        ]) {
          assert.equal(privateField in visibleProduct, false)
        }
      }

      const editorUpdate = await payload.update({
        collection: 'products',
        id: product.id,
        overrideAccess: false,
        user: editor,
        locale: 'es',
        data: {
          summary: 'Resumen visible editado',
          supplierSKU: 'NO-DEBE-PERSISTIR',
          purchasingNotes: 'No debe persistir',
        },
      })
      assert.equal(editorUpdate.summary, 'Resumen visible editado')
      assert.equal('supplierSKU' in editorUpdate, false)
      assert.equal('purchasingNotes' in editorUpdate, false)
      const productAfterEditorUpdate = await payload.findByID({
        collection: 'products',
        id: product.id,
        depth: 0,
        overrideAccess: true,
      })
      assert.equal(productAfterEditorUpdate.supplierSKU, `SKU-PROVEEDOR-${suffix}`)
      assert.equal(productAfterEditorUpdate.purchasingNotes, 'Dato privado original')

      const privateMarkers = [
        `PROV-${suffix}`,
        `contacto-${suffix}@example.test`,
        `Nota privada proveedor ${suffix}`,
        `SKU-PROVEEDOR-${suffix}`,
        'Dato privado original',
        '"amountMinor":5000',
      ]
      const assertPrivateMarkersAbsent = (body) => {
        const serialized = JSON.stringify(body)
        for (const marker of privateMarkers) assert.equal(serialized.includes(marker), false)
      }
      const restArgs = {
        params: Promise.resolve({ slug: ['products', String(product.id)] }),
      }
      const anonymousRESTResponse = await restGet(
        new Request(`http://localhost/api/products/${product.id}?depth=2&locale=es`),
        restArgs,
      )
      assert.equal(anonymousRESTResponse.status, 200)
      assertPrivateMarkersAbsent(await anonymousRESTResponse.json())

      const editorLogin = await payload.login({
        collection: 'users',
        data: {
          email: editor.email,
          password: 'integration-test-password',
        },
      })
      assert.ok(editorLogin.token)
      const editorRESTResponse = await restGet(
        new Request(`http://localhost/api/products/${product.id}?depth=2&locale=es`, {
          headers: { Authorization: `JWT ${editorLogin.token}` },
        }),
        restArgs,
      )
      assert.equal(editorRESTResponse.status, 200)
      assertPrivateMarkersAbsent(await editorRESTResponse.json())

      const editorRESTUpdateResponse = await restPatch(
        new Request(`http://localhost/api/products/${product.id}?depth=2&locale=es`, {
          method: 'PATCH',
          headers: {
            Authorization: `JWT ${editorLogin.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: 'Resumen editado por REST',
            supplierSKU: 'REST-NO-DEBE-PERSISTIR',
            purchasingNotes: 'REST privado no debe persistir',
            purchaseCost: {
              amountMinor: 1,
              currency: 'USD',
              baseQuantity: 99,
              baseUnit: 'unit',
              updatedAt: '2026-10-11T00:00:00.000Z',
            },
          }),
        }),
        restArgs,
      )
      assert.equal(editorRESTUpdateResponse.status, 200)
      const editorRESTUpdateBody = await editorRESTUpdateResponse.json()
      assertPrivateMarkersAbsent(editorRESTUpdateBody)
      const productAfterRESTUpdate = await payload.findByID({
        collection: 'products',
        id: product.id,
        depth: 0,
        overrideAccess: true,
      })
      assert.equal(productAfterRESTUpdate.summary, 'Resumen editado por REST')
      assert.equal(productAfterRESTUpdate.supplierSKU, `SKU-PROVEEDOR-${suffix}`)
      assert.equal(productAfterRESTUpdate.purchasingNotes, 'Dato privado original')
      assert.equal(productAfterRESTUpdate.purchaseCost.amountMinor, 5000)
      assert.equal(productAfterRESTUpdate.purchaseCost.currency, 'BRL')

      const graphQLQuery = `
        query ProductPrivacy($id: Int!) {
          Product(id: $id) {
            id
            title
            supplierSKU
            purchasingNotes
            purchaseCost { amountMinor currency baseQuantity baseUnit updatedAt }
            termsOverride { mode method shareBps fixedMinor currency }
            supplier { id name reference contactEmail notes }
          }
        }
      `
      for (const authorization of [null, `JWT ${editorLogin.token}`]) {
        const graphQLResponse = await graphQLPost(
          new Request('http://localhost/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify({ query: graphQLQuery, variables: { id: product.id } }),
          }),
        )
        assert.equal(graphQLResponse.status, 200)
        const graphQLBody = await graphQLResponse.json()
        assert.equal(graphQLBody.errors, undefined)
        assertPrivateMarkersAbsent(graphQLBody)
      }

      await assert.rejects(() =>
        payload.update({
          collection: 'products',
          id: product.id,
          overrideAccess: false,
          user: customer,
          data: { summary: 'Un cliente no puede editar el catálogo' },
        }),
      )

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
      const terminated = await payload.update({
        collection: 'supplier-agreements',
        id: active.id,
        overrideAccess: false,
        user: finance,
        data: { status: 'terminated', terminationReason: 'Fin de la relación comercial' },
      })
      assert.equal(terminated.status, 'terminated')
      assert.ok(terminated.terminatedAt)
      await assert.rejects(() =>
        payload.update({
          collection: 'supplier-agreements',
          id: active.id,
          overrideAccess: false,
          user: finance,
          data: { terminationReason: 'Motivo reescrito' },
        }),
      )
      const terminationHistory = await payload.findByID({
        collection: 'supplier-agreements',
        id: active.id,
        overrideAccess: true,
      })
      assert.equal(terminationHistory.terminationReason, 'Fin de la relación comercial')
    } finally {
      await payload.destroy()
    }
  },
)
