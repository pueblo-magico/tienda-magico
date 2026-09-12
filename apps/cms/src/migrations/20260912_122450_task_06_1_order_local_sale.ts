import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_fulfillment_mode" AS ENUM('local_collection', 'delivery');
  ALTER TABLE "orders" ADD COLUMN "checkout_key" varchar;
  ALTER TABLE "orders" ADD COLUMN "cart_reference" varchar;
  ALTER TABLE "orders" ADD COLUMN "fulfillment_mode" "enum_orders_fulfillment_mode";
  ALTER TABLE "orders" ADD COLUMN "buyer_contact" jsonb;
  ALTER TABLE "orders" ADD COLUMN "commercial_snapshot" jsonb;
  CREATE UNIQUE INDEX "orders_checkout_key_idx" ON "orders" USING btree ("checkout_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_checkout_key_idx";
  ALTER TABLE "orders" DROP COLUMN "checkout_key";
  ALTER TABLE "orders" DROP COLUMN "cart_reference";
  ALTER TABLE "orders" DROP COLUMN "fulfillment_mode";
  ALTER TABLE "orders" DROP COLUMN "buyer_contact";
  ALTER TABLE "orders" DROP COLUMN "commercial_snapshot";
  DROP TYPE "public"."enum_orders_fulfillment_mode";`)
}
