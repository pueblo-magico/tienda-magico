import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_supplier_obligations_status" AS ENUM('eligible', 'held', 'approved', 'partially_paid', 'paid', 'reversed', 'disputed');
  CREATE TABLE "supplier_obligations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_key" varchar NOT NULL,
  	"order_id" integer NOT NULL,
  	"order_line" numeric NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_id" integer,
  	"supplier_id" integer,
  	"agreement_id" integer,
  	"agreement_revision" numeric,
  	"status" "enum_supplier_obligations_status" NOT NULL,
  	"currency" varchar NOT NULL,
  	"eligible_base_minor" numeric NOT NULL,
  	"supplier_amount_minor" numeric,
  	"store_amount_minor" numeric,
  	"outstanding_minor" numeric,
  	"review_reason" varchar,
  	"snapshot" jsonb NOT NULL,
  	"calculated_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "supplier_obligations_id" integer;
  ALTER TABLE "cms_settings" ADD COLUMN "supplier_obligations" boolean DEFAULT true NOT NULL;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_obligations" ADD CONSTRAINT "supplier_obligations_agreement_id_supplier_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."supplier_agreements"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "supplier_obligations_source_key_idx" ON "supplier_obligations" USING btree ("source_key");
  CREATE INDEX "supplier_obligations_order_idx" ON "supplier_obligations" USING btree ("order_id");
  CREATE INDEX "supplier_obligations_product_idx" ON "supplier_obligations" USING btree ("product_id");
  CREATE INDEX "supplier_obligations_variant_idx" ON "supplier_obligations" USING btree ("variant_id");
  CREATE INDEX "supplier_obligations_supplier_idx" ON "supplier_obligations" USING btree ("supplier_id");
  CREATE INDEX "supplier_obligations_agreement_idx" ON "supplier_obligations" USING btree ("agreement_id");
  CREATE INDEX "supplier_obligations_updated_at_idx" ON "supplier_obligations" USING btree ("updated_at");
  CREATE INDEX "supplier_obligations_created_at_idx" ON "supplier_obligations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_obligations_fk" FOREIGN KEY ("supplier_obligations_id") REFERENCES "public"."supplier_obligations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_supplier_obligations_id_idx" ON "payload_locked_documents_rels" USING btree ("supplier_obligations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "supplier_obligations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "supplier_obligations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_supplier_obligations_fk";
  
  DROP INDEX "payload_locked_documents_rels_supplier_obligations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "supplier_obligations_id";
  ALTER TABLE "cms_settings" DROP COLUMN "supplier_obligations";
  DROP TYPE "public"."enum_supplier_obligations_status";`)
}
