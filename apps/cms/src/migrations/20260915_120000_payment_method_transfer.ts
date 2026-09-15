import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_enabled" boolean DEFAULT false NOT NULL;
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_account_holder" varchar;
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_tax_id" varchar;
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_alias" varchar;
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_cvu" varchar;
    ALTER TABLE "commerce_settings" ADD COLUMN "transfer_payment_window_minutes" numeric DEFAULT 15 NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_enabled";
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_account_holder";
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_tax_id";
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_alias";
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_cvu";
    ALTER TABLE "commerce_settings" DROP COLUMN "transfer_payment_window_minutes";
  `)
}
