import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql`ALTER TABLE "orders" ADD COLUMN "transfer_reported_at" timestamp(3) with time zone;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "orders" DROP COLUMN "transfer_reported_at";`)
}
