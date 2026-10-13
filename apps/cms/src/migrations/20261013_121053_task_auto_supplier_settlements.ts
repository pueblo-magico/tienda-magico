import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "supplier_obligations" ADD COLUMN "settlement_id" integer;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_settlement_id_supplier_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."supplier_settlements"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "supplier_obligations_settlement_idx" ON "supplier_obligations" USING btree ("settlement_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "supplier_obligations" DROP CONSTRAINT "supplier_obligations_settlement_id_supplier_settlements_id_fk";

  DROP INDEX "supplier_obligations_settlement_idx";
  ALTER TABLE "supplier_obligations" DROP COLUMN "settlement_id";`)
}
