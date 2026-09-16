import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "payment_notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "idempotency_key" varchar NOT NULL,
      "resource_id" varchar NOT NULL,
      "payment_status" varchar NOT NULL,
      "amount" numeric NOT NULL,
      "currency" varchar NOT NULL,
      "public_reference" varchar,
      "live_mode" boolean NOT NULL,
      "provider_updated_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "payment_notifications_idempotency_key_idx" ON "payment_notifications" ("idempotency_key");
    CREATE INDEX "payment_notifications_resource_id_idx" ON "payment_notifications" ("resource_id");
    CREATE INDEX "payment_notifications_public_reference_idx" ON "payment_notifications" ("public_reference");
    CREATE INDEX "payment_notifications_updated_at_idx" ON "payment_notifications" ("updated_at");
    CREATE INDEX "payment_notifications_created_at_idx" ON "payment_notifications" ("created_at");
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_notifications_id" integer REFERENCES "payment_notifications"("id") ON DELETE CASCADE;
    CREATE INDEX "payload_locked_documents_rels_payment_notifications_id_idx" ON "payload_locked_documents_rels" ("payment_notifications_id");
    ALTER TABLE "cms_settings" ADD COLUMN "payment_notifications" boolean DEFAULT true NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "cms_settings" DROP COLUMN "payment_notifications";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_notifications_id";
    DROP TABLE "payment_notifications";
  `)
}
