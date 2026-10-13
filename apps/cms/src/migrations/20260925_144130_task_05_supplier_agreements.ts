import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_suppliers_default_terms_mode" AS ENUM('purchase', 'consignment');
    CREATE TYPE "public"."enum_suppliers_default_terms_method" AS ENUM('percentage', 'fixed');
    CREATE TYPE "public"."enum_products_terms_override_mode" AS ENUM('inherit', 'purchase', 'consignment');
    CREATE TYPE "public"."enum_products_terms_override_method" AS ENUM('percentage', 'fixed');
    CREATE TYPE "public"."enum__products_v_version_terms_override_mode" AS ENUM('inherit', 'purchase', 'consignment');
    CREATE TYPE "public"."enum__products_v_version_terms_override_method" AS ENUM('percentage', 'fixed');
    ALTER TYPE "public"."enum_users_roles" ADD VALUE 'purchasing' BEFORE 'customer';
    ALTER TYPE "public"."enum_users_roles" ADD VALUE 'finance' BEFORE 'customer';
    CREATE TABLE "suppliers" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "reference" varchar,
      "country" varchar,
      "contact_name" varchar,
      "contact_email" varchar,
      "contact_phone" varchar,
      "default_terms_mode" "enum_suppliers_default_terms_mode" DEFAULT 'purchase' NOT NULL,
      "default_terms_method" "enum_suppliers_default_terms_method",
      "default_terms_share_bps" numeric,
      "default_terms_fixed_minor" numeric,
      "default_terms_currency" varchar,
      "default_terms_effective_from" timestamp(3) with time zone,
      "default_terms_effective_to" timestamp(3) with time zone,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "products" ADD COLUMN "supplier_id" integer;
    ALTER TABLE "products" ADD COLUMN "supplier_s_k_u" varchar;
    ALTER TABLE "products" ADD COLUMN "purchase_cost_amount_minor" numeric;
    ALTER TABLE "products" ADD COLUMN "purchase_cost_currency" varchar;
    ALTER TABLE "products" ADD COLUMN "purchase_cost_base_quantity" numeric;
    ALTER TABLE "products" ADD COLUMN "purchase_cost_base_unit" varchar;
    ALTER TABLE "products" ADD COLUMN "purchase_cost_updated_at" timestamp(3) with time zone;
    ALTER TABLE "products" ADD COLUMN "terms_override_mode" "enum_products_terms_override_mode" DEFAULT 'inherit';
    ALTER TABLE "products" ADD COLUMN "terms_override_method" "enum_products_terms_override_method";
    ALTER TABLE "products" ADD COLUMN "terms_override_share_bps" numeric;
    ALTER TABLE "products" ADD COLUMN "terms_override_fixed_minor" numeric;
    ALTER TABLE "products" ADD COLUMN "terms_override_currency" varchar;
    ALTER TABLE "products" ADD COLUMN "terms_override_effective_from" timestamp(3) with time zone;
    ALTER TABLE "products" ADD COLUMN "terms_override_effective_to" timestamp(3) with time zone;
    ALTER TABLE "products" ADD COLUMN "purchasing_notes" varchar;
    ALTER TABLE "_products_v" ADD COLUMN "version_supplier_id" integer;
    ALTER TABLE "_products_v" ADD COLUMN "version_supplier_s_k_u" varchar;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchase_cost_amount_minor" numeric;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchase_cost_currency" varchar;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchase_cost_base_quantity" numeric;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchase_cost_base_unit" varchar;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchase_cost_updated_at" timestamp(3) with time zone;
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_mode" "enum__products_v_version_terms_override_mode" DEFAULT 'inherit';
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_method" "enum__products_v_version_terms_override_method";
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_share_bps" numeric;
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_fixed_minor" numeric;
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_currency" varchar;
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_effective_from" timestamp(3) with time zone;
    ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_effective_to" timestamp(3) with time zone;
    ALTER TABLE "_products_v" ADD COLUMN "version_purchasing_notes" varchar;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "suppliers_id" integer;
    ALTER TABLE "cms_settings" ADD COLUMN "suppliers" boolean DEFAULT true NOT NULL;
    ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_supplier_id_suppliers_id_fk" FOREIGN KEY ("version_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suppliers_fk" FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
    CREATE UNIQUE INDEX "suppliers_reference_idx" ON "suppliers" USING btree ("reference");
    CREATE INDEX "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");
    CREATE INDEX "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");
    CREATE INDEX "products_supplier_idx" ON "products" USING btree ("supplier_id");
    CREATE INDEX "_products_v_version_version_supplier_idx" ON "_products_v" USING btree ("version_supplier_id");
    CREATE INDEX "payload_locked_documents_rels_suppliers_id_idx" ON "payload_locked_documents_rels" USING btree ("suppliers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP CONSTRAINT "products_supplier_id_suppliers_id_fk";
    ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_supplier_id_suppliers_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_suppliers_fk";
    DROP INDEX "products_supplier_idx";
    DROP INDEX "_products_v_version_version_supplier_idx";
    DROP INDEX "payload_locked_documents_rels_suppliers_id_idx";
    ALTER TABLE "products" DROP COLUMN "supplier_id", DROP COLUMN "supplier_s_k_u", DROP COLUMN "purchase_cost_amount_minor", DROP COLUMN "purchase_cost_currency", DROP COLUMN "purchase_cost_base_quantity", DROP COLUMN "purchase_cost_base_unit", DROP COLUMN "purchase_cost_updated_at", DROP COLUMN "terms_override_mode", DROP COLUMN "terms_override_method", DROP COLUMN "terms_override_share_bps", DROP COLUMN "terms_override_fixed_minor", DROP COLUMN "terms_override_currency", DROP COLUMN "terms_override_effective_from", DROP COLUMN "terms_override_effective_to", DROP COLUMN "purchasing_notes";
    ALTER TABLE "_products_v" DROP COLUMN "version_supplier_id", DROP COLUMN "version_supplier_s_k_u", DROP COLUMN "version_purchase_cost_amount_minor", DROP COLUMN "version_purchase_cost_currency", DROP COLUMN "version_purchase_cost_base_quantity", DROP COLUMN "version_purchase_cost_base_unit", DROP COLUMN "version_purchase_cost_updated_at", DROP COLUMN "version_terms_override_mode", DROP COLUMN "version_terms_override_method", DROP COLUMN "version_terms_override_share_bps", DROP COLUMN "version_terms_override_fixed_minor", DROP COLUMN "version_terms_override_currency", DROP COLUMN "version_terms_override_effective_from", DROP COLUMN "version_terms_override_effective_to", DROP COLUMN "version_purchasing_notes";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "suppliers_id";
    ALTER TABLE "cms_settings" DROP COLUMN "suppliers";
    DROP TABLE "suppliers" CASCADE;
    UPDATE "users_roles" SET "value" = 'admin' WHERE "value" IN ('purchasing', 'finance');
    ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
    DROP TYPE "public"."enum_users_roles";
    CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'customer');
    ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
    DROP TYPE "public"."enum_suppliers_default_terms_mode";
    DROP TYPE "public"."enum_suppliers_default_terms_method";
    DROP TYPE "public"."enum_products_terms_override_mode";
    DROP TYPE "public"."enum_products_terms_override_method";
    DROP TYPE "public"."enum__products_v_version_terms_override_mode";
    DROP TYPE "public"."enum__products_v_version_terms_override_method";
  `)
}
