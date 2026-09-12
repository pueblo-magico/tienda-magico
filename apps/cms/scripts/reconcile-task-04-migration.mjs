import { readFile, writeFile } from 'node:fs/promises'

const file = new URL('../src/migrations/20260910_214050_task_04_sellable_items.ts', import.meta.url)
let source = await readFile(file, 'utf8')
for (const [table, column, enumName] of [
  ['categories', 'icon', 'enum_categories_icon'],
  ['products', 'lifecycle_status', 'enum_products_lifecycle_status'],
  ['_products_v', 'version_lifecycle_status', 'enum__products_v_version_lifecycle_status'],
]) {
  const fallback = column.includes('lifecycle') ? " DEFAULT 'active'" : ''
  source = source.replace(
    `ALTER TABLE "${table}" ADD COLUMN "${column}" "${enumName}"${fallback};`,
    `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;\n  ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE "${enumName}" USING "${column}"::"${enumName}";${fallback ? `\n  ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT 'active';` : ''}`,
  )
  source = source.replace(
    `ALTER TABLE "${table}" DROP COLUMN "${column}";`,
    `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;\n  ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE varchar USING "${column}"::text;${fallback ? `\n  ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT 'active';` : ''}`,
  )
}
for (const [table, column] of [
  ['products', 'first_published_at'],
  ['_products_v', 'version_first_published_at'],
]) {
  source = source.replace(
    `  ALTER TABLE "${table}" ADD COLUMN "${column}" timestamp(3) with time zone;\n`,
    '',
  )
  source = source.replace(`  ALTER TABLE "${table}" DROP COLUMN "${column}";\n`, '')
}
source = source.replaceAll('{ db, payload, req }', '{ db }')
await writeFile(file, source)
const indexFile = new URL('../src/migrations/index.ts', import.meta.url)
let index = await readFile(indexFile, 'utf8')
const spanish = index.match(
  /  \{\s+up: migration_20260825_020000_spanish_ars_defaults\.up,[\s\S]*?\n  \},/,
)
if (spanish) {
  index = index.replace(spanish[0], '')
  index = index.replace(
    /(  \{\s+up: migration_20260825_020001_ars_defaults\.up,[\s\S]*?\n  \},)/,
    `${spanish[0]}\n$1`,
  )
}
const name = '20260910_220000_task_04_identity_backfill'
if (!index.includes(name)) {
  index = `import * as migration_${name} from './${name}'\n${index}`
  index = index.replace(
    /\]\s*;?\s*$/,
    `  { up: migration_${name}.up, down: migration_${name}.down, name: '${name}' },\n]\n`,
  )
}
await writeFile(indexFile, index)
const labelsFile = new URL(
  '../src/migrations/20260910_214849_task_04_option_labels.ts',
  import.meta.url,
)
let labels = await readFile(labelsFile, 'utf8')
if (!labels.includes('INSERT INTO')) {
  for (const table of ['variant_types', 'variant_options']) {
    labels = labels.replace(
      `ALTER TABLE "${table}" DROP COLUMN "label";`,
      `INSERT INTO "${table}_locales" (label, _locale, _parent_id) SELECT label, locale::"_locales", id FROM "${table}" CROSS JOIN (VALUES ('es'), ('en')) locales(locale);\n  ALTER TABLE "${table}" DROP COLUMN "label";`,
    )
  }
  const down = ['variant_types', 'variant_options']
    .map(
      (table) =>
        `ALTER TABLE "${table}" ADD COLUMN "label" varchar;\n  UPDATE "${table}" SET label = COALESCE((SELECT label FROM "${table}_locales" WHERE _parent_id = "${table}".id ORDER BY CASE WHEN _locale = 'es' THEN 0 ELSE 1 END LIMIT 1), 'Sin etiqueta');\n  ALTER TABLE "${table}" ALTER COLUMN "label" SET NOT NULL;\n  DROP TABLE "${table}_locales" CASCADE;`,
    )
    .join('\n  ')
  labels = labels.replace(
    /DROP TABLE "variant_types_locales" CASCADE;[\s\S]*?ALTER TABLE "variant_options" ADD COLUMN "label" varchar NOT NULL;/,
    down,
  )
}
labels = labels.replaceAll('{ db, payload, req }', '{ db }')
await writeFile(labelsFile, labels)
const cartFile = new URL(
  '../src/migrations/20260910_224721_task_04_cart_price_snapshot.ts',
  import.meta.url,
)
await writeFile(
  cartFile,
  (await readFile(cartFile, 'utf8')).replaceAll('{ db, payload, req }', '{ db }'),
)
