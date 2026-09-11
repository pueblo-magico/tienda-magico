import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    DROP INDEX IF EXISTS "variants_combination_key_idx";
    CREATE UNIQUE INDEX "variants_combination_key_idx"
      ON "variants" USING btree ("combination_key")
      WHERE "deleted_at" IS NULL AND "combination_key" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`
    DROP INDEX IF EXISTS "variants_combination_key_idx";
    CREATE UNIQUE INDEX "variants_combination_key_idx"
      ON "variants" USING btree ("combination_key");
  `)
}
