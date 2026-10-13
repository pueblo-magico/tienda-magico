import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_supplier_payment_profiles_provider" AS ENUM('mercado-pago');
  CREATE TYPE "public"."enum_supplier_payment_profiles_currency" AS ENUM('ARS');
  CREATE TYPE "public"."enum_supplier_payment_profiles_status" AS ENUM('pending', 'verified', 'disabled');
  CREATE TYPE "public"."enum_supplier_settlements_currency" AS ENUM('ARS');
  CREATE TYPE "public"."enum_supplier_settlements_status" AS ENUM('draft', 'approved', 'payment_pending', 'partially_paid', 'paid', 'cancelled');
  CREATE TYPE "public"."enum_supplier_payouts_currency" AS ENUM('ARS');
  CREATE TYPE "public"."enum_supplier_payouts_status" AS ENUM('awaiting_approval', 'submitting', 'submitted', 'processing', 'succeeded', 'failed', 'reconciliation_required');
  CREATE TABLE "supplier_payment_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"provider" "enum_supplier_payment_profiles_provider" DEFAULT 'mercado-pago' NOT NULL,
  	"recipient_email" varchar NOT NULL,
  	"currency" "enum_supplier_payment_profiles_currency" DEFAULT 'ARS' NOT NULL,
  	"status" "enum_supplier_payment_profiles_status" DEFAULT 'pending' NOT NULL,
  	"verified_at" timestamp(3) with time zone,
  	"verified_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_settlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"currency" "enum_supplier_settlements_currency" DEFAULT 'ARS' NOT NULL,
  	"amount_minor" numeric NOT NULL,
  	"outstanding_minor" numeric NOT NULL,
  	"status" "enum_supplier_settlements_status" DEFAULT 'draft' NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_payouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"settlement_id" integer NOT NULL,
  	"payment_profile_id" integer NOT NULL,
  	"amount_minor" numeric NOT NULL,
  	"currency" "enum_supplier_payouts_currency" DEFAULT 'ARS' NOT NULL,
  	"status" "enum_supplier_payouts_status" DEFAULT 'awaiting_approval' NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"provider_payout_id" varchar,
  	"provider_transaction_id" varchar,
  	"provider_status" varchar,
  	"destination_snapshot" jsonb,
  	"confirmed_by_id" integer,
  	"confirmed_at" timestamp(3) with time zone,
  	"failure_code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "supplier_payment_profiles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "supplier_settlements_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "supplier_payouts_id" integer;
  ALTER TABLE "cms_settings" ADD COLUMN "supplier_payment_profiles" boolean DEFAULT true NOT NULL;
  ALTER TABLE "cms_settings" ADD COLUMN "supplier_settlements" boolean DEFAULT true NOT NULL;
  ALTER TABLE "cms_settings" ADD COLUMN "supplier_payouts" boolean DEFAULT true NOT NULL;
  ALTER TABLE "supplier_payment_profiles" ADD CONSTRAINT "supplier_payment_profiles_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payment_profiles" ADD CONSTRAINT "supplier_payment_profiles_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_settlements" ADD CONSTRAINT "supplier_settlements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_settlements" ADD CONSTRAINT "supplier_settlements_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_settlement_id_supplier_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."supplier_settlements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_payment_profile_id_supplier_payment_profiles_id_fk" FOREIGN KEY ("payment_profile_id") REFERENCES "public"."supplier_payment_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payouts" ADD CONSTRAINT "supplier_payouts_confirmed_by_id_users_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "supplier_payment_profiles_supplier_idx" ON "supplier_payment_profiles" USING btree ("supplier_id");
  CREATE INDEX "supplier_payment_profiles_verified_by_idx" ON "supplier_payment_profiles" USING btree ("verified_by_id");
  CREATE INDEX "supplier_payment_profiles_updated_at_idx" ON "supplier_payment_profiles" USING btree ("updated_at");
  CREATE INDEX "supplier_payment_profiles_created_at_idx" ON "supplier_payment_profiles" USING btree ("created_at");
  CREATE UNIQUE INDEX "supplier_settlements_reference_idx" ON "supplier_settlements" USING btree ("reference");
  CREATE INDEX "supplier_settlements_supplier_idx" ON "supplier_settlements" USING btree ("supplier_id");
  CREATE INDEX "supplier_settlements_approved_by_idx" ON "supplier_settlements" USING btree ("approved_by_id");
  CREATE INDEX "supplier_settlements_updated_at_idx" ON "supplier_settlements" USING btree ("updated_at");
  CREATE INDEX "supplier_settlements_created_at_idx" ON "supplier_settlements" USING btree ("created_at");
  CREATE INDEX "supplier_payouts_supplier_idx" ON "supplier_payouts" USING btree ("supplier_id");
  CREATE UNIQUE INDEX "supplier_payouts_settlement_idx" ON "supplier_payouts" USING btree ("settlement_id");
  CREATE INDEX "supplier_payouts_payment_profile_idx" ON "supplier_payouts" USING btree ("payment_profile_id");
  CREATE UNIQUE INDEX "supplier_payouts_idempotency_key_idx" ON "supplier_payouts" USING btree ("idempotency_key");
  CREATE INDEX "supplier_payouts_confirmed_by_idx" ON "supplier_payouts" USING btree ("confirmed_by_id");
  CREATE INDEX "supplier_payouts_updated_at_idx" ON "supplier_payouts" USING btree ("updated_at");
  CREATE INDEX "supplier_payouts_created_at_idx" ON "supplier_payouts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_payment_profiles_fk" FOREIGN KEY ("supplier_payment_profiles_id") REFERENCES "public"."supplier_payment_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_settlements_fk" FOREIGN KEY ("supplier_settlements_id") REFERENCES "public"."supplier_settlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_payouts_fk" FOREIGN KEY ("supplier_payouts_id") REFERENCES "public"."supplier_payouts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_supplier_payment_profiles__idx" ON "payload_locked_documents_rels" USING btree ("supplier_payment_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_supplier_settlements_id_idx" ON "payload_locked_documents_rels" USING btree ("supplier_settlements_id");
  CREATE INDEX "payload_locked_documents_rels_supplier_payouts_id_idx" ON "payload_locked_documents_rels" USING btree ("supplier_payouts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "supplier_payment_profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "supplier_settlements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "supplier_payouts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "supplier_payment_profiles" CASCADE;
  DROP TABLE "supplier_settlements" CASCADE;
  DROP TABLE "supplier_payouts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_supplier_payment_profiles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_supplier_settlements_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_supplier_payouts_fk";
  
  DROP INDEX "payload_locked_documents_rels_supplier_payment_profiles__idx";
  DROP INDEX "payload_locked_documents_rels_supplier_settlements_id_idx";
  DROP INDEX "payload_locked_documents_rels_supplier_payouts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "supplier_payment_profiles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "supplier_settlements_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "supplier_payouts_id";
  ALTER TABLE "cms_settings" DROP COLUMN "supplier_payment_profiles";
  ALTER TABLE "cms_settings" DROP COLUMN "supplier_settlements";
  ALTER TABLE "cms_settings" DROP COLUMN "supplier_payouts";
  DROP TYPE "public"."enum_supplier_payment_profiles_provider";
  DROP TYPE "public"."enum_supplier_payment_profiles_currency";
  DROP TYPE "public"."enum_supplier_payment_profiles_status";
  DROP TYPE "public"."enum_supplier_settlements_currency";
  DROP TYPE "public"."enum_supplier_settlements_status";
  DROP TYPE "public"."enum_supplier_payouts_currency";
  DROP TYPE "public"."enum_supplier_payouts_status";`)
}
