import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variants" ADD COLUMN "sort_order" numeric DEFAULT 0;
  ALTER TABLE "_variants_v" ADD COLUMN "version_sort_order" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variants" DROP COLUMN "sort_order";
  ALTER TABLE "_variants_v" DROP COLUMN "version_sort_order";`)
}
