import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."pct_product_discounts" AS ENUM('deduct', 'ignore');
  CREATE TYPE "public"."pct_order_discounts" AS ENUM('deduct_allocated', 'ignore');
  CREATE TYPE "public"."pct_taxes" AS ENUM('include', 'exclude');
  CREATE TYPE "public"."pct_shipping" AS ENUM('include_allocated', 'exclude');
  CREATE TYPE "public"."pct_tips_donations" AS ENUM('include_allocated', 'exclude');
  CREATE TYPE "public"."pct_payment_fees" AS ENUM('deduct_actual', 'store_absorbs');
  CREATE TYPE "public"."enum_supplier_agreements_status" AS ENUM('draft', 'active', 'expired', 'terminated');
  CREATE TYPE "public"."enum_supplier_agreements_terms_mode" AS ENUM('purchase', 'consignment');
  CREATE TYPE "public"."enum_supplier_agreements_terms_method" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum__supplier_agreements_v_version_status" AS ENUM('draft', 'active', 'expired', 'terminated');
  CREATE TYPE "public"."enum__supplier_agreements_v_version_terms_mode" AS ENUM('purchase', 'consignment');
  CREATE TYPE "public"."enum__supplier_agreements_v_version_terms_method" AS ENUM('percentage', 'fixed');
  CREATE TABLE "supplier_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar NOT NULL,
	"supplier_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"revision" numeric DEFAULT 1 NOT NULL,
	"previous_agreement_id" integer,
	"status" "enum_supplier_agreements_status" DEFAULT 'draft' NOT NULL,
	"terms_mode" "enum_supplier_agreements_terms_mode" DEFAULT 'purchase' NOT NULL,
	"terms_method" "enum_supplier_agreements_terms_method",
	"terms_share_bps" numeric,
	"terms_percentage_basis_product_discounts" "pct_product_discounts" DEFAULT 'deduct',
	"terms_percentage_basis_order_discounts" "pct_order_discounts" DEFAULT 'deduct_allocated',
	"terms_percentage_basis_taxes" "pct_taxes" DEFAULT 'exclude',
	"terms_percentage_basis_shipping" "pct_shipping" DEFAULT 'exclude',
	"terms_percentage_basis_tips_donations" "pct_tips_donations" DEFAULT 'exclude',
	"terms_percentage_basis_payment_fees" "pct_payment_fees" DEFAULT 'store_absorbs',
	"terms_fixed_minor" numeric,
	"terms_currency" varchar,
	"terms_effective_from" timestamp(3) with time zone,
	"terms_effective_to" timestamp(3) with time zone,
	"approved_by_id" integer,
	"approved_at" timestamp(3) with time zone,
	"terminated_at" timestamp(3) with time zone,
	"termination_reason" varchar,
	"notes" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_supplier_agreements_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_reference" varchar NOT NULL,
	"version_supplier_id" integer NOT NULL,
	"version_product_id" integer,
	"version_variant_id" integer,
	"version_revision" numeric DEFAULT 1 NOT NULL,
	"version_previous_agreement_id" integer,
	"version_status" "enum__supplier_agreements_v_version_status" DEFAULT 'draft' NOT NULL,
	"version_terms_mode" "enum__supplier_agreements_v_version_terms_mode" DEFAULT 'purchase' NOT NULL,
	"version_terms_method" "enum__supplier_agreements_v_version_terms_method",
	"version_terms_share_bps" numeric,
	"version_terms_percentage_basis_product_discounts" "pct_product_discounts" DEFAULT 'deduct',
	"version_terms_percentage_basis_order_discounts" "pct_order_discounts" DEFAULT 'deduct_allocated',
	"version_terms_percentage_basis_taxes" "pct_taxes" DEFAULT 'exclude',
	"version_terms_percentage_basis_shipping" "pct_shipping" DEFAULT 'exclude',
	"version_terms_percentage_basis_tips_donations" "pct_tips_donations" DEFAULT 'exclude',
	"version_terms_percentage_basis_payment_fees" "pct_payment_fees" DEFAULT 'store_absorbs',
	"version_terms_fixed_minor" numeric,
	"version_terms_currency" varchar,
	"version_terms_effective_from" timestamp(3) with time zone,
	"version_terms_effective_to" timestamp(3) with time zone,
	"version_approved_by_id" integer,
	"version_approved_at" timestamp(3) with time zone,
	"version_terminated_at" timestamp(3) with time zone,
	"version_termination_reason" varchar,
	"version_notes" varchar,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_product_discounts" "pct_product_discounts" DEFAULT 'deduct';
  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_order_discounts" "pct_order_discounts" DEFAULT 'deduct_allocated';
  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_taxes" "pct_taxes" DEFAULT 'exclude';
  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_shipping" "pct_shipping" DEFAULT 'exclude';
  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_tips_donations" "pct_tips_donations" DEFAULT 'exclude';
  ALTER TABLE "suppliers" ADD COLUMN "default_terms_percentage_basis_payment_fees" "pct_payment_fees" DEFAULT 'store_absorbs';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_product_discounts" "pct_product_discounts" DEFAULT 'deduct';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_order_discounts" "pct_order_discounts" DEFAULT 'deduct_allocated';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_taxes" "pct_taxes" DEFAULT 'exclude';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_shipping" "pct_shipping" DEFAULT 'exclude';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_tips_donations" "pct_tips_donations" DEFAULT 'exclude';
  ALTER TABLE "products" ADD COLUMN "terms_override_percentage_basis_payment_fees" "pct_payment_fees" DEFAULT 'store_absorbs';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_product_discounts" "pct_product_discounts" DEFAULT 'deduct';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_order_discounts" "pct_order_discounts" DEFAULT 'deduct_allocated';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_taxes" "pct_taxes" DEFAULT 'exclude';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_shipping" "pct_shipping" DEFAULT 'exclude';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_tips_donations" "pct_tips_donations" DEFAULT 'exclude';
  ALTER TABLE "_products_v" ADD COLUMN "version_terms_override_percentage_basis_payment_fees" "pct_payment_fees" DEFAULT 'store_absorbs';
  ALTER TABLE "cms_settings" ADD COLUMN "supplier_agreements" boolean DEFAULT true NOT NULL;
  ALTER TABLE "supplier_agreements" ADD CONSTRAINT "supplier_agreements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_agreements" ADD CONSTRAINT "supplier_agreements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_agreements" ADD CONSTRAINT "supplier_agreements_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_agreements" ADD CONSTRAINT "supplier_agreements_previous_agreement_id_supplier_agreements_id_fk" FOREIGN KEY ("previous_agreement_id") REFERENCES "public"."supplier_agreements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_agreements" ADD CONSTRAINT "supplier_agreements_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_parent_id_supplier_agreements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."supplier_agreements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_version_supplier_id_suppliers_id_fk" FOREIGN KEY ("version_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_version_variant_id_variants_id_fk" FOREIGN KEY ("version_variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_version_previous_agreement_id_supplier_agreements_id_fk" FOREIGN KEY ("version_previous_agreement_id") REFERENCES "public"."supplier_agreements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_supplier_agreements_v" ADD CONSTRAINT "_supplier_agreements_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "supplier_agreements_reference_idx" ON "supplier_agreements" USING btree ("reference");
  CREATE INDEX "supplier_agreements_supplier_idx" ON "supplier_agreements" USING btree ("supplier_id");
  CREATE INDEX "supplier_agreements_product_idx" ON "supplier_agreements" USING btree ("product_id");
  CREATE INDEX "supplier_agreements_variant_idx" ON "supplier_agreements" USING btree ("variant_id");
  CREATE INDEX "supplier_agreements_previous_agreement_idx" ON "supplier_agreements" USING btree ("previous_agreement_id");
  CREATE INDEX "supplier_agreements_approved_by_idx" ON "supplier_agreements" USING btree ("approved_by_id");
  CREATE INDEX "supplier_agreements_updated_at_idx" ON "supplier_agreements" USING btree ("updated_at");
  CREATE INDEX "supplier_agreements_created_at_idx" ON "supplier_agreements" USING btree ("created_at");
  CREATE INDEX "_supplier_agreements_v_parent_idx" ON "_supplier_agreements_v" USING btree ("parent_id");
  CREATE INDEX "_supplier_agreements_v_version_version_reference_idx" ON "_supplier_agreements_v" USING btree ("version_reference");
  CREATE INDEX "_supplier_agreements_v_version_version_supplier_idx" ON "_supplier_agreements_v" USING btree ("version_supplier_id");
  CREATE INDEX "_supplier_agreements_v_version_version_product_idx" ON "_supplier_agreements_v" USING btree ("version_product_id");
  CREATE INDEX "_supplier_agreements_v_version_version_variant_idx" ON "_supplier_agreements_v" USING btree ("version_variant_id");
  CREATE INDEX "_supplier_agreements_v_version_version_previous_agreemen_idx" ON "_supplier_agreements_v" USING btree ("version_previous_agreement_id");
  CREATE INDEX "_supplier_agreements_v_version_version_approved_by_idx" ON "_supplier_agreements_v" USING btree ("version_approved_by_id");
  CREATE INDEX "_supplier_agreements_v_version_version_updated_at_idx" ON "_supplier_agreements_v" USING btree ("version_updated_at");
  CREATE INDEX "_supplier_agreements_v_version_version_created_at_idx" ON "_supplier_agreements_v" USING btree ("version_created_at");
  CREATE INDEX "_supplier_agreements_v_created_at_idx" ON "_supplier_agreements_v" USING btree ("created_at");
  CREATE INDEX "_supplier_agreements_v_updated_at_idx" ON "_supplier_agreements_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "supplier_agreements" CASCADE;
  DROP TABLE "_supplier_agreements_v" CASCADE;
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_product_discounts";
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_order_discounts";
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_taxes";
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_shipping";
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_tips_donations";
  ALTER TABLE "suppliers" DROP COLUMN "default_terms_percentage_basis_payment_fees";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_product_discounts";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_order_discounts";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_taxes";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_shipping";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_tips_donations";
  ALTER TABLE "products" DROP COLUMN "terms_override_percentage_basis_payment_fees";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_product_discounts";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_order_discounts";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_taxes";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_shipping";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_tips_donations";
  ALTER TABLE "_products_v" DROP COLUMN "version_terms_override_percentage_basis_payment_fees";
  ALTER TABLE "cms_settings" DROP COLUMN "supplier_agreements";
  DROP TYPE "public"."pct_product_discounts";
  DROP TYPE "public"."pct_order_discounts";
  DROP TYPE "public"."pct_taxes";
  DROP TYPE "public"."pct_shipping";
  DROP TYPE "public"."pct_tips_donations";
  DROP TYPE "public"."pct_payment_fees";
  DROP TYPE "public"."enum_supplier_agreements_status";
  DROP TYPE "public"."enum_supplier_agreements_terms_mode";
  DROP TYPE "public"."enum_supplier_agreements_terms_method";
  DROP TYPE "public"."enum__supplier_agreements_v_version_status";
  DROP TYPE "public"."enum__supplier_agreements_v_version_terms_mode";
  DROP TYPE "public"."enum__supplier_agreements_v_version_terms_method";`)
}
