import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "supplier_payouts_settlement_idx";
  CREATE INDEX "supplier_payouts_settlement_idx" ON "supplier_payouts" USING btree ("settlement_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "supplier_payouts_settlement_idx";
  CREATE UNIQUE INDEX "supplier_payouts_settlement_idx" ON "supplier_payouts" USING btree ("settlement_id");`)
}
