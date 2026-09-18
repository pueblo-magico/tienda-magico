import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql`ALTER TABLE site_settings ADD COLUMN cash_staff_enabled boolean DEFAULT false;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM users_sessions WHERE _parent_id IN (SELECT id FROM users WHERE email = 'cash-staff@storefront.invalid');
    UPDATE users SET hash = NULL, salt = NULL WHERE email = 'cash-staff@storefront.invalid';
    ALTER TABLE site_settings DROP COLUMN cash_staff_enabled;
  `)
}
