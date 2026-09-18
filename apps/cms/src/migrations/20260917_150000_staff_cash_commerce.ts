import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE commerce_settings ADD COLUMN cash_staff_enabled boolean DEFAULT false;
    INSERT INTO commerce_settings (cash_staff_enabled)
      SELECT false WHERE NOT EXISTS (SELECT 1 FROM commerce_settings);
    UPDATE commerce_settings SET cash_staff_enabled = COALESCE(
      (SELECT cash_staff_enabled FROM site_settings ORDER BY id LIMIT 1), false);
    ALTER TABLE site_settings DROP COLUMN cash_staff_enabled;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE site_settings ADD COLUMN cash_staff_enabled boolean DEFAULT false;
    INSERT INTO site_settings (cash_staff_enabled)
      SELECT false WHERE NOT EXISTS (SELECT 1 FROM site_settings);
    UPDATE site_settings SET cash_staff_enabled = COALESCE(
      (SELECT cash_staff_enabled FROM commerce_settings ORDER BY id LIMIT 1), false);
    ALTER TABLE commerce_settings DROP COLUMN cash_staff_enabled;
  `)
}
