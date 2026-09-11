import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "_variants_v_version_version_combination_key_idx";
  DROP INDEX "_variants_v_autosave_idx";
  DROP INDEX "_products_v_autosave_idx";
  DROP INDEX "variants_combination_key_idx";
  CREATE UNIQUE INDEX "variants_combination_key_idx" ON "variants" USING btree ("combination_key") WHERE "variants"."deleted_at" IS NULL AND "variants"."combination_key" IS NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "_variants_v_version_version_combination_key_idx" ON "_variants_v" USING btree ("version_combination_key");
  CREATE INDEX "_variants_v_autosave_idx" ON "_variants_v" USING btree ("autosave");
  CREATE INDEX "_products_v_autosave_idx" ON "_products_v" USING btree ("autosave");`)
}
