import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_local_sales_status" AS ENUM('pending_payment', 'paid', 'cancelled', 'conflict');
  CREATE TYPE "public"."enum_local_sales_fulfillment_mode" AS ENUM('local_collection', 'delivery');
  CREATE TYPE "public"."enum_local_sales_payment_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'unverified');
  CREATE TYPE "public"."enum_carts_fulfillment_mode" AS ENUM('local_collection', 'delivery');
  CREATE TABLE "local_sales" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"status" "enum_local_sales_status" DEFAULT 'pending_payment' NOT NULL,
  	"fulfillment_mode" "enum_local_sales_fulfillment_mode" NOT NULL,
  	"payment_status" "enum_local_sales_payment_status" DEFAULT 'pending' NOT NULL,
  	"buyer_contact" jsonb,
  	"snapshot" jsonb NOT NULL,
  	"payment_evidence" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "carts" ADD COLUMN "fulfillment_mode" "enum_carts_fulfillment_mode";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "local_sales_id" integer;
  ALTER TABLE "local_sales" ADD CONSTRAINT "local_sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "local_sales_order_idx" ON "local_sales" USING btree ("order_id");
  CREATE UNIQUE INDEX "local_sales_idempotency_key_idx" ON "local_sales" USING btree ("idempotency_key");
  CREATE INDEX "local_sales_updated_at_idx" ON "local_sales" USING btree ("updated_at");
  CREATE INDEX "local_sales_created_at_idx" ON "local_sales" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_local_sales_fk" FOREIGN KEY ("local_sales_id") REFERENCES "public"."local_sales"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_local_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("local_sales_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "local_sales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "local_sales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_local_sales_fk";
  
  DROP INDEX "payload_locked_documents_rels_local_sales_id_idx";
  ALTER TABLE "carts" DROP COLUMN "fulfillment_mode";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "local_sales_id";
  DROP TYPE "public"."enum_local_sales_status";
  DROP TYPE "public"."enum_local_sales_fulfillment_mode";
  DROP TYPE "public"."enum_local_sales_payment_status";
  DROP TYPE "public"."enum_carts_fulfillment_mode";`)
}
