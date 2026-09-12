import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../package.json', import.meta.url))
const { parse } = require('dotenv')
const { Client } = require('pg')
const environment = parse(await readFile(new URL('../.env.local', import.meta.url)))
const connection = new URL(environment.DATABASE_URL)
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname))
const databaseName = `pmg221_test_${Date.now()}`
assert.match(databaseName, /^pmg221_test_\d+$/)
assert.notEqual(connection.pathname.slice(1), databaseName)
const admin = new Client({ connectionString: connection.toString(), connectionTimeoutMillis: 3000 })
await admin.connect()
await admin.query(`CREATE DATABASE "${databaseName}"`)
console.log(`Base descartable: ${databaseName}`)
connection.pathname = `/${databaseName}`
process.env.DATABASE_URL = connection.toString()
process.env.PAYLOAD_SECRET = randomBytes(32).toString('hex')
process.env.PAYLOAD_MIGRATING = 'true'
process.env.NODE_ENV = 'test'
process.env.STOREFRONT_REVALIDATION_URL = ''
let payload
let isCleaningUp = false
try {
  const { getPayload } = await import('../node_modules/payload/dist/index.js')
  const { default: config } = await import('../src/payload.config.ts')
  const { migrations } = await import('../src/migrations/index.ts')
  payload = await getPayload({ config, disableOnInit: true })
  payload.db.pool.on('error', (error) => {
    if (!isCleaningUp || error.code !== '57P01') {
      throw new Error(`Error de conexión en la base descartable: ${error.code}`)
    }
  })
  for (const migration of migrations) {
    await payload.db.drizzle.transaction(async (db) => migration.up({ db, payload, req: {} }))
    console.log(`PASS: ${migration.name}`)
  }
  console.log('PASS: cadena completa de migraciones en base aislada')
  const { generateDrizzleJson, generateMigration } = payload.db.requireDrizzleKit()
  const snapshot = JSON.parse(
    await readFile(
      new URL('../src/migrations/20260911_142004_task_04_schema_alignment.json', import.meta.url),
      'utf8',
    ),
  )
  assert.deepEqual(await generateMigration(snapshot, generateDrizzleJson(payload.db.schema)), [])
  const autosaveColumns = await payload.db.pool.query(
    "SELECT table_name FROM information_schema.columns WHERE column_name = 'autosave' AND table_name IN ('_products_v', '_variants_v')",
  )
  assert.equal(autosaveColumns.rowCount, 2)
  console.log(
    'PASS: snapshot alineado con el esquema y columnas históricas de autosave conservadas',
  )
  const simple = await payload.create({
    collection: 'products',
    locale: 'es',
    data: {
      title: 'Taza de prueba',
      slug: 'taza-prueba-pmg221',
      summary: 'Artículo de prueba',
      sku: 'TEST-TAZA',
      priceInARSEnabled: true,
      priceInARS: 125050,
      inventory: 3,
      _status: 'published',
      netContent: 1,
      netContentUnit: 'unit',
      packedWeightGrams: 400,
    },
  })
  const type = await payload.create({
    collection: 'variantTypes',
    locale: 'es',
    data: { name: 'test-size', label: 'Tamaño' },
  })
  await payload.update({
    collection: 'variantTypes',
    id: type.id,
    locale: 'en',
    data: { label: 'Size' },
  })
  const option = await payload.create({
    collection: 'variantOptions',
    locale: 'es',
    data: { variantType: type.id, value: '100g', label: '100 g' },
  })
  const parent = await payload.create({
    collection: 'products',
    locale: 'es',
    data: {
      title: 'Cacao de prueba',
      slug: 'cacao-prueba-pmg221',
      summary: 'Cacao de prueba',
      enableVariants: true,
      variantTypes: [type.id],
      _status: 'draft',
    },
  })
  const draftVariant = await payload.create({
    collection: 'variants',
    locale: 'es',
    data: { product: parent.id },
    draft: true,
  })
  assert.equal(draftVariant.product.id, parent.id)
  const secondDraft = await payload.create({
    collection: 'variants',
    data: { product: parent.id },
    draft: true,
  })
  const emptyCombinations = await payload.db.pool.query(
    'SELECT combination_key FROM variants WHERE id = ANY($1::int[])',
    [[draftVariant.id, secondDraft.id]],
  )
  assert.equal(emptyCombinations.rowCount, 2)
  assert.ok(emptyCombinations.rows.every((row) => row.combination_key === null))
  await payload.delete({ collection: 'variants', id: secondDraft.id })
  await payload.delete({ collection: 'variants', id: draftVariant.id })
  console.log('PASS: el editor puede crear un borrador de variante antes de completar opciones')
  const variant = await payload.create({
    collection: 'variants',
    locale: 'es',
    data: {
      product: parent.id,
      options: [option.id],
      sku: 'TEST-CACAO-100',
      priceInARSEnabled: true,
      priceInARS: 500050,
      inventory: 5,
      netContent: 100,
      netContentUnit: 'g',
      _status: 'published',
    },
  })
  await payload.update({
    collection: 'variants',
    id: variant.id,
    data: { deletedAt: new Date().toISOString() },
  })
  const replacement = await payload.create({
    collection: 'variants',
    data: {
      product: parent.id,
      options: [option.id],
      sku: 'TEST-REEMPLAZO',
      priceInARSEnabled: true,
      priceInARS: 500050,
      inventory: 5,
      _status: 'published',
    },
  })
  await assert.rejects(
    payload.db.pool.query('UPDATE variants SET deleted_at = NULL WHERE id = $1', [variant.id]),
    (error) => error.code === '23505' && error.constraint === 'variants_combination_key_idx',
  )
  await assert.rejects(
    payload.update({
      collection: 'variants',
      id: variant.id,
      trash: true,
      data: { deletedAt: null },
    }),
    (error) =>
      error.name === 'ValidationError' &&
      error.data.errors.some((entry) => entry.path === 'options'),
  )
  await payload.update({
    collection: 'variants',
    id: replacement.id,
    data: { lifecycleStatus: 'discontinued' },
  })
  await assert.rejects(
    payload.db.pool.query('UPDATE variants SET deleted_at = NULL WHERE id = $1', [variant.id]),
    (error) => error.code === '23505' && error.constraint === 'variants_combination_key_idx',
  )
  await payload.db.pool.query('UPDATE _variants_v SET autosave = true WHERE parent_id = $1', [
    variant.id,
  ])
  await payload.db.pool.query('UPDATE _products_v SET autosave = true WHERE parent_id = $1', [
    simple.id,
  ])
  const captureHistory = async () => {
    const products = await payload.db.pool.query(
      'SELECT * FROM _products_v WHERE parent_id = $1 ORDER BY id',
      [simple.id],
    )
    const variants = await payload.db.pool.query(
      'SELECT * FROM _variants_v WHERE parent_id = $1 ORDER BY id',
      [variant.id],
    )
    assert.ok(products.rowCount > 0 && variants.rowCount > 0)
    return { products: products.rows, variants: variants.rows }
  }
  const history = await captureHistory()
  const alignment = migrations.find((migration) =>
    migration.name.endsWith('task_04_schema_alignment'),
  )
  await payload.db.drizzle.transaction(async (db) => alignment.down({ db, payload, req: {} }))
  await payload.db.drizzle.transaction(async (db) => alignment.up({ db, payload, req: {} }))
  assert.deepEqual(await captureHistory(), history)
  const partialIndex = migrations.find((migration) =>
    migration.name.endsWith('task_04_active_combination_index'),
  )
  await assert.rejects(
    payload.db.drizzle.transaction(async (db) => partialIndex.down({ db, payload, req: {} })),
  )
  const index = await payload.db.pool.query(
    "SELECT indexdef FROM pg_indexes WHERE indexname = 'variants_combination_key_idx'",
  )
  assert.match(index.rows[0].indexdef, /WHERE/)
  const retained = await payload.db.pool.query(
    'SELECT id, deleted_at FROM variants WHERE id = ANY($1::int[]) ORDER BY id',
    [[variant.id, replacement.id]],
  )
  assert.equal(retained.rowCount, 2)
  assert.ok(retained.rows.find((row) => row.id === variant.id).deleted_at)
  assert.equal(retained.rows.find((row) => row.id === replacement.id).deleted_at, null)
  await assert.rejects(
    payload.db.pool.query('UPDATE variants SET deleted_at = NULL WHERE id = $1', [variant.id]),
    (error) => error.code === '23505' && error.constraint === 'variants_combination_key_idx',
  )
  assert.deepEqual(await captureHistory(), history)
  await payload.delete({ collection: 'variants', id: replacement.id })
  await payload.update({
    collection: 'variants',
    id: variant.id,
    trash: true,
    data: { deletedAt: null },
  })
  console.log(
    'PASS: reutilización tras eliminar, restauración conflictiva y rollback seguro ante duplicados',
  )
  await payload.update({ collection: 'products', id: parent.id, data: { _status: 'published' } })
  console.log('PASS: publicación de producto simple y variante con SKU/precio/medidas')
  const english = await payload.findByID({
    collection: 'variants',
    id: variant.id,
    locale: 'en',
    depth: 2,
  })
  assert.equal(english.options[0].variantType.label, 'Size')
  const publicProduct = await payload.findByID({
    collection: 'products',
    id: simple.id,
    overrideAccess: false,
  })
  assert.equal(publicProduct.packedWeightGrams, undefined)
  console.log('PASS: etiquetas traducidas y privacidad de medidas')
  const cart = await payload.create({
    collection: 'carts',
    data: { currency: 'ARS', items: [{ product: parent.id, variant: variant.id, quantity: 2 }] },
  })
  assert.equal(cart.subtotal, 1000100)
  assert.equal(cart.items[0].amount, 500050)
  const readLocalizedCart = async () =>
    Object.fromEntries(
      await Promise.all(
        ['es', 'en'].map(async (locale) => [
          locale,
          await payload.findByID({ collection: 'carts', id: cart.id, locale, depth: 3 }),
        ]),
      ),
    )
  const acceptedSnapshot = await readLocalizedCart()
  console.log('PASS: carrito persiste identidad, subtotal y snapshot ARS')
  await payload.update({ collection: 'variants', id: variant.id, data: { priceInARS: 600050 } })
  const changed = await payload.update({
    collection: 'carts',
    id: cart.id,
    data: { items: [{ ...cart.items[0], quantity: 1 }] },
  })
  assert.equal(changed.items[0].amount, 500050)
  assert.equal(changed.subtotal, 600050)
  const changedSnapshot = await readLocalizedCart()
  const confirmed = await payload.update({
    collection: 'carts',
    id: cart.id,
    data: { acceptCurrentPrices: true, items: changed.items },
  })
  assert.equal(confirmed.items[0].amount, 600050)
  const confirmedSnapshot = await readLocalizedCart()
  await payload.update({
    collection: 'variants',
    id: variant.id,
    data: { lifecycleStatus: 'discontinued' },
  })
  const discontinuedSnapshot = await readLocalizedCart()
  const verification = spawnSync(
    process.execPath,
    ['--import', './tests/register.mjs', 'tests/verify-persisted-commerce.mjs'],
    {
      cwd: fileURLToPath(new URL('../../../', import.meta.url)),
      input: JSON.stringify({
        accepted: acceptedSnapshot,
        changed: changedSnapshot,
        confirmed: confirmedSnapshot,
        discontinued: discontinuedSnapshot,
        variantID: variant.id,
      }),
      encoding: 'utf8',
      timeout: 30000,
    },
  )
  assert.equal(verification.status, 0, verification.stderr || verification.error?.message)
  process.stdout.write(verification.stdout)
  await payload.update({
    collection: 'variants',
    id: variant.id,
    data: { lifecycleStatus: 'active' },
  })
  console.log('PASS: cambiar cantidad conserva el precio aceptado; confirmar lo actualiza')
  await assert.rejects(
    payload.update({
      collection: 'carts',
      id: cart.id,
      data: { items: [{ ...cart.items[0], quantity: 6 }] },
    }),
  )
  await assert.rejects(
    payload.create({
      collection: 'products',
      data: { title: 'Duplicado', slug: 'duplicado', sku: 'TEST-CACAO-100', _status: 'draft' },
    }),
  )
  console.log('PASS: rechazo de exceso de cantidad y SKU duplicado entre colecciones')
  const taskMigrations = migrations.filter((migration) => migration.name.includes('task_04'))
  for (const migration of [...taskMigrations].reverse()) {
    await payload.db.drizzle.transaction(async (db) => migration.down({ db, payload, req: {} }))
  }
  const legacy = await payload.db.pool.query(
    'SELECT id, price_in_a_r_s FROM variants WHERE id = $1',
    [variant.id],
  )
  assert.equal(legacy.rows[0].id, variant.id)
  assert.equal(Number(legacy.rows[0].price_in_a_r_s), 600050)
  for (const migration of taskMigrations) {
    await payload.db.drizzle.transaction(async (db) => migration.up({ db, payload, req: {} }))
  }
  const restored = await payload.findByID({ collection: 'variants', id: variant.id, depth: 0 })
  assert.equal(restored.sku, `PM-V-${variant.id}`)
  assert.equal(restored.priceInARS, 600050)
  const restoredCart = await payload.findByID({ collection: 'carts', id: cart.id, depth: 0 })
  assert.equal(restoredCart.items[0].variant, variant.id)
  assert.equal(restoredCart.items[0].amount, null)
  console.log('PASS: rollback y reaplicación conservan IDs, importes y relaciones; regeneran SKU')
} finally {
  isCleaningUp = true
  if (payload) await payload.destroy()
  await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await admin.end()
}
