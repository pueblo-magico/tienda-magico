import assert from 'node:assert/strict'
import { test } from 'node:test'

import { SupplierPayouts } from '../src/collections/SupplierPayouts.ts'
import { SupplierSettlements } from '../src/collections/SupplierSettlements.ts'

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
      const purchaseSupplierFromAdmin = await payload.create({
        collection: 'suppliers',
        overrideAccess: true,
        data: {
          name: `Proveedor compra formulario ${suffix}`,
          reference: `PROV-COMPRA-${suffix}`,
          defaultTerms: {
            mode: 'purchase',
            method: null,
            shareBps: null,
            percentageBasis: null,
            fixedMinor: null,
            currency: null,
            effectiveFrom: null,
            effectiveTo: null,
          },
        },
      })
      assert.equal(purchaseSupplierFromAdmin.defaultTerms.mode, 'purchase')
      assert.equal(purchaseSupplierFromAdmin.defaultTerms.shareBps, null)

      const fixedSupplierFromAdmin = await payload.create({
        collection: 'suppliers',
        overrideAccess: true,
        data: {
          name: `Proveedor consignación fija ${suffix}`,
          reference: `PROV-FIJO-${suffix}`,
          defaultTerms: {
            mode: 'consignment',
            method: 'fixed',
            shareBps: null,
            percentageBasis: null,
            fixedMinor: 125000,
            currency: 'ARS',
            effectiveFrom: null,
            effectiveTo: null,
          },
        },
      })
      assert.equal(fixedSupplierFromAdmin.defaultTerms.method, 'fixed')
      assert.equal(fixedSupplierFromAdmin.defaultTerms.shareBps, null)
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

      const consignmentSupplier = await payload.create({
        collection: 'suppliers',
        overrideAccess: true,
        data: {
          name: `Proveedor consignación flujo ${suffix}`,
          reference: `PROV-FLUJO-${suffix}`,
          defaultTerms: {
            mode: 'consignment',
            method: 'percentage',
            shareBps: 3500,
            currency: 'ARS',
            percentageBasis: {
              productDiscounts: 'deduct',
              orderDiscounts: 'deduct_allocated',
              taxes: 'exclude',
              shipping: 'exclude',
              tipsDonations: 'exclude',
              paymentFees: 'store_absorbs',
            },
          },
        },
      })
      const consignmentDraft = await payload.create({
        collection: 'supplier-agreements',
        overrideAccess: false,
        user: purchasing,
        data: {
          reference: `ACUERDO-FLUJO-${suffix}`,
          supplier: consignmentSupplier.id,
          revision: 1,
          status: 'draft',
          terms: {
            mode: 'consignment',
            method: 'percentage',
            shareBps: 3500,
            currency: 'ARS',
            percentageBasis: {
              productDiscounts: 'deduct',
              orderDiscounts: 'deduct_allocated',
              taxes: 'exclude',
              shipping: 'exclude',
              tipsDonations: 'exclude',
              paymentFees: 'store_absorbs',
            },
            effectiveFrom: '2026-01-01T00:00:00.000Z',
          },
        },
      })
      await payload.update({
        collection: 'supplier-agreements',
        id: consignmentDraft.id,
        overrideAccess: false,
        user: finance,
        data: { status: 'active' },
      })
      const consignmentProduct = await payload.create({
        collection: 'products',
        overrideAccess: false,
        user: purchasing,
        locale: 'es',
        data: {
          title: `Producto consignado ${suffix}`,
          summary: 'Producto para probar el flujo contable',
          slug: `producto-consignado-${suffix}`,
          sku: `CONSIG-${suffix}`,
          inventory: 2,
          priceInARSEnabled: true,
          priceInARS: 10000,
          _status: 'published',
          supplier: consignmentSupplier.id,
          termsOverride: { mode: 'inherit' },
        },
      })
      const pendingPaymentProfile = await payload.create({
        collection: 'supplier-payment-profiles',
        overrideAccess: false,
        user: admin,
        data: {
          supplier: consignmentSupplier.id,
          provider: 'mercado-pago',
          recipientEmail: `pagos-proveedor-${suffix}@example.test`,
          currency: 'ARS',
          status: 'verified',
        },
      })
      assert.equal(pendingPaymentProfile.status, 'pending')
      const paymentProfile = await payload.update({
        collection: 'supplier-payment-profiles',
        id: pendingPaymentProfile.id,
        overrideAccess: false,
        user: admin,
        data: { status: 'verified' },
      })
      assert.equal(paymentProfile.status, 'verified')

      const paidOrder = await payload.create({
        collection: 'orders',
        overrideAccess: true,
        data: {
          items: [{ product: consignmentProduct.id, quantity: 1 }],
          amount: 10000,
          currency: 'ARS',
          checkoutKey: `checkout:supplier-flow:${suffix}`,
          cartReference: `cart:supplier-flow:${suffix}`,
          publicReference: `ORDER-SUPPLIER-${suffix}`,
          fulfillmentMode: 'delivery',
          paymentMethod: 'mercado-pago',
          paymentStatus: 'approved',
          commercialSnapshot: {
            items: [
              {
                productId: String(consignmentProduct.id),
                merchandiseId: `product:${consignmentProduct.id}`,
                sku: `CONSIG-${suffix}`,
                quantity: 1,
                total: { amount: '100.00', currencyCode: 'ARS' },
              },
            ],
          },
        },
      })
      const obligations = await payload.find({
        collection: 'supplier-obligations',
        where: { order: { equals: paidOrder.id } },
        depth: 0,
        overrideAccess: true,
      })
      assert.equal(obligations.docs.length, 1)
      assert.equal(obligations.docs[0].status, 'eligible')
      assert.equal(obligations.docs[0].supplierAmountMinor, 3500)
      assert.equal(obligations.docs[0].outstandingMinor, 3500)

      const settlements = await payload.find({
        collection: 'supplier-settlements',
        where: { supplier: { equals: consignmentSupplier.id } },
        depth: 0,
        overrideAccess: true,
      })
      assert.equal(settlements.docs.length, 1)
      assert.equal(settlements.docs[0].status, 'draft')
      assert.equal(settlements.docs[0].amountMinor, 3500)

      const approveHandler = SupplierSettlements.endpoints.find(
        (endpoint) => endpoint.path === '/:id/approve',
      )?.handler
      assert.ok(approveHandler)
      const serverOrigin = new URL(payload.config.serverURL).origin
      const approveRequest = Object.assign(
        new Request(`${serverOrigin}/api/supplier-settlements/${settlements.docs[0].id}/approve`, {
          method: 'POST',
          headers: { origin: serverOrigin },
        }),
        {
          context: {},
          payload,
          routeParams: { id: String(settlements.docs[0].id) },
          user: admin,
        },
      )
      const approveResponse = await approveHandler(approveRequest)
      assert.equal(approveResponse.status, 200)
      assert.deepEqual(await approveResponse.json(), { approved: true, payoutPrepared: true })

      const payouts = await payload.find({
        collection: 'supplier-payouts',
        where: { settlement: { equals: settlements.docs[0].id } },
        depth: 0,
        overrideAccess: true,
      })
      assert.equal(payouts.docs.length, 1)
      assert.equal(payouts.docs[0].status, 'awaiting_approval')
      assert.equal(payouts.docs[0].amountMinor, 3500)

      const recordManualHandler = SupplierPayouts.endpoints.find(
        (endpoint) => endpoint.path === '/:id/record-manual',
      )?.handler
      assert.ok(recordManualHandler)
      const approvedSettlement = await payload.findByID({
        collection: 'supplier-settlements',
        id: settlements.docs[0].id,
        depth: 0,
        overrideAccess: true,
      })
      const manualReference = `PAGO-MANUAL-${suffix}`
      const recordRequest = Object.assign(
        new Request(`${serverOrigin}/api/supplier-payouts/${payouts.docs[0].id}/record-manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', origin: serverOrigin },
          body: JSON.stringify({
            acknowledged: true,
            amountMinor: 3500,
            paidAt: approvedSettlement.approvedAt,
            reference: manualReference,
          }),
        }),
        {
          context: {},
          payload,
          routeParams: { id: String(payouts.docs[0].id) },
          user: admin,
        },
      )
      const recordResponse = await recordManualHandler(recordRequest)
      assert.equal(recordResponse.status, 200)
      assert.deepEqual(await recordResponse.json(), {
        reconciled: true,
        status: 'succeeded',
        settlementStatus: 'paid',
        outstandingMinor: 0,
      })

      const [paidPayout, paidSettlement, paidObligation] = await Promise.all([
        payload.findByID({
          collection: 'supplier-payouts',
          id: payouts.docs[0].id,
          depth: 0,
          overrideAccess: true,
        }),
        payload.findByID({
          collection: 'supplier-settlements',
          id: settlements.docs[0].id,
          depth: 0,
          overrideAccess: true,
        }),
        payload.findByID({
          collection: 'supplier-obligations',
          id: obligations.docs[0].id,
          depth: 0,
          overrideAccess: true,
        }),
      ])
      assert.equal(paidPayout.status, 'succeeded')
      assert.equal(paidPayout.paymentMethod, 'manual')
      assert.equal(paidPayout.manualReference, manualReference)
      assert.equal(paidSettlement.status, 'paid')
      assert.equal(paidSettlement.outstandingMinor, 0)
      assert.equal(paidObligation.status, 'paid')
      assert.equal(paidObligation.outstandingMinor, 0)

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
