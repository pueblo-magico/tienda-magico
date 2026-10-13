import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_supplier_finance_events_event_type" AS ENUM('payout_prepared', 'submission_started', 'submitted', 'provider_status_checked', 'succeeded', 'failed', 'reconciliation_required', 'manual_reconciled', 'partial_payment');
  CREATE TYPE "public"."enum_supplier_finance_events_provider" AS ENUM('mercado-pago', 'manual');
  CREATE TYPE "public"."enum_supplier_finance_events_fee_responsibility" AS ENUM('store', 'supplier', 'unknown');
  CREATE TYPE "public"."enum_supplier_finance_events_currency" AS ENUM('ARS');
  CREATE TABLE "supplier_finance_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_key" varchar NOT NULL,
  	"event_type" "enum_supplier_finance_events_event_type" NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"settlement_id" integer NOT NULL,
  	"payout_id" integer NOT NULL,
  	"provider" "enum_supplier_finance_events_provider" NOT NULL,
  	"amount_minor" numeric NOT NULL,
  	"applied_minor" numeric NOT NULL,
  	"outstanding_after_minor" numeric NOT NULL,
  	"received_minor" numeric,
  	"fee_minor" numeric DEFAULT 0 NOT NULL,
  	"fee_responsibility" "enum_supplier_finance_events_fee_responsibility" DEFAULT 'unknown' NOT NULL,
  	"currency" "enum_supplier_finance_events_currency" NOT NULL,
  	"previous_status" varchar,
  	"next_status" varchar NOT NULL,
  	"actor_id" integer,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"correlation_key" varchar NOT NULL,
  	"external_reference" varchar,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_payout_policy_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_key" varchar NOT NULL,
  	"emergency_stop" boolean DEFAULT false NOT NULL,
  	"outbound_provider_payments_enabled" boolean DEFAULT false NOT NULL,
  	"automatic_provider_payments_enabled" boolean DEFAULT false NOT NULL,
  	"previous_emergency_stop" boolean,
  	"previous_outbound_provider_payments_enabled" boolean,
  	"previous_automatic_provider_payments_enabled" boolean,
  	"actor_id" integer,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_payout_policy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"emergency_stop" boolean DEFAULT true NOT NULL,
  	"outbound_provider_payments_enabled" boolean DEFAULT false NOT NULL,
  	"automatic_provider_payments_enabled" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "supplier_finance_events" ADD CONSTRAINT "supplier_finance_events_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_finance_events" ADD CONSTRAINT "supplier_finance_events_settlement_id_supplier_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."supplier_settlements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_finance_events" ADD CONSTRAINT "supplier_finance_events_payout_id_supplier_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."supplier_payouts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_finance_events" ADD CONSTRAINT "supplier_finance_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_payout_policy_events" ADD CONSTRAINT "supplier_payout_policy_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "supplier_finance_events_event_key_idx" ON "supplier_finance_events" USING btree ("event_key");
  CREATE INDEX "supplier_finance_events_event_type_idx" ON "supplier_finance_events" USING btree ("event_type");
  CREATE INDEX "supplier_finance_events_supplier_idx" ON "supplier_finance_events" USING btree ("supplier_id");
  CREATE INDEX "supplier_finance_events_settlement_idx" ON "supplier_finance_events" USING btree ("settlement_id");
  CREATE INDEX "supplier_finance_events_payout_idx" ON "supplier_finance_events" USING btree ("payout_id");
  CREATE INDEX "supplier_finance_events_actor_idx" ON "supplier_finance_events" USING btree ("actor_id");
  CREATE INDEX "supplier_finance_events_occurred_at_idx" ON "supplier_finance_events" USING btree ("occurred_at");
  CREATE INDEX "supplier_finance_events_correlation_key_idx" ON "supplier_finance_events" USING btree ("correlation_key");
  CREATE INDEX "supplier_finance_events_updated_at_idx" ON "supplier_finance_events" USING btree ("updated_at");
  CREATE INDEX "supplier_finance_events_created_at_idx" ON "supplier_finance_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "supplier_payout_policy_events_event_key_idx" ON "supplier_payout_policy_events" USING btree ("event_key");
  CREATE INDEX "supplier_payout_policy_events_actor_idx" ON "supplier_payout_policy_events" USING btree ("actor_id");
  CREATE INDEX "supplier_payout_policy_events_occurred_at_idx" ON "supplier_payout_policy_events" USING btree ("occurred_at");
  CREATE INDEX "supplier_payout_policy_events_updated_at_idx" ON "supplier_payout_policy_events" USING btree ("updated_at");
  CREATE INDEX "supplier_payout_policy_events_created_at_idx" ON "supplier_payout_policy_events" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "supplier_finance_events" CASCADE;
  DROP TABLE "supplier_payout_policy_events" CASCADE;
  DROP TABLE "supplier_payout_policy" CASCADE;
  DROP TYPE "public"."enum_supplier_finance_events_event_type";
  DROP TYPE "public"."enum_supplier_finance_events_provider";
  DROP TYPE "public"."enum_supplier_finance_events_fee_responsibility";
  DROP TYPE "public"."enum_supplier_finance_events_currency";`)
}
