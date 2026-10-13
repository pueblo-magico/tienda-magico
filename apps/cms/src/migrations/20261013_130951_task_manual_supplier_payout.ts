import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_supplier_payouts_payment_method" AS ENUM('mercado-pago', 'manual');
  ALTER TABLE "supplier_payouts" ADD COLUMN "payment_method" "enum_supplier_payouts_payment_method" DEFAULT 'mercado-pago' NOT NULL;
  ALTER TABLE "supplier_payouts" ADD COLUMN "manual_reference" varchar;
  ALTER TABLE "supplier_payouts" ADD COLUMN "manual_paid_at" timestamp(3) with time zone;
  ALTER TABLE "supplier_payouts" ADD COLUMN "manual_recorded_by_id" integer;
  ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_manual_recorded_by_id_users_id_fk" FOREIGN KEY ("manual_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "supplier_payouts_manual_recorded_by_idx" ON "supplier_payouts" USING btree ("manual_recorded_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "supplier_payouts" DROP CONSTRAINT "supplier_payouts_manual_recorded_by_id_users_id_fk";
  
  DROP INDEX "supplier_payouts_manual_recorded_by_idx";
  ALTER TABLE "supplier_payouts" DROP COLUMN "payment_method";
  ALTER TABLE "supplier_payouts" DROP COLUMN "manual_reference";
  ALTER TABLE "supplier_payouts" DROP COLUMN "manual_paid_at";
  ALTER TABLE "supplier_payouts" DROP COLUMN "manual_recorded_by_id";
  DROP TYPE "public"."enum_supplier_payouts_payment_method";`)
}
