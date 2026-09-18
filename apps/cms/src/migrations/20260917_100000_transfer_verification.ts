import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "orders" ADD COLUMN "transfer_bank_reference" varchar;
    ALTER TABLE "orders" ADD COLUMN "transfer_verification" jsonb;
    CREATE UNIQUE INDEX "orders_transfer_bank_reference_idx" ON "orders" ("transfer_bank_reference");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX "orders_transfer_bank_reference_idx";
    ALTER TABLE "orders" DROP COLUMN "transfer_bank_reference";
    ALTER TABLE "orders" DROP COLUMN "transfer_verification";`)
}
