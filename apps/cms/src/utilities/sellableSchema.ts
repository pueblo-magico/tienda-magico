import { sql } from '@payloadcms/db-postgres'
import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'
import { boolean, uniqueIndex } from '@payloadcms/db-postgres/drizzle/pg-core'

export const sellableSchema: NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number] = ({
  schema,
  extendTable,
}) => {
  const variants = schema.tables.variants
  if (!variants) throw new Error('Falta la tabla de variantes en el esquema comercial.')
  extendTable({
    table: variants,
    extraConfig: (table) => ({
      variants_combination_key_idx: uniqueIndex('variants_combination_key_idx')
        .on(table.combinationKey)
        .where(sql`${table.deletedAt} IS NULL AND ${table.combinationKey} IS NOT NULL`),
    }),
  })
  for (const name of ['_products_v', '_variants_v']) {
    const table = schema.tables[name]
    if (!table) throw new Error(`Falta la tabla de versiones ${name}.`)
    if (!table.autosave) extendTable({ table, columns: { autosave: boolean('autosave') } })
  }
  return schema
}
