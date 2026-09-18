import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql`ALTER TABLE commerce_settings ADD COLUMN cash_pickup_window_hours numeric DEFAULT 48 NOT NULL;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE commerce_settings DROP COLUMN cash_pickup_window_hours;`)
}
