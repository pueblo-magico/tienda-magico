import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN "lifecycle_status" varchar DEFAULT 'active'`)
  await db.execute(sql`ALTER TABLE "_products_v" ADD COLUMN "version_lifecycle_status" varchar DEFAULT 'active'`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "_products_v" DROP COLUMN "version_lifecycle_status"`)
  await db.execute(sql`ALTER TABLE "products" DROP COLUMN "lifecycle_status"`)
}
