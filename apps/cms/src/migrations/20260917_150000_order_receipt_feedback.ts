import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN "received_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN "experience_rating" numeric;
    ALTER TABLE "orders" ADD COLUMN "experience_comment" varchar;
    ALTER TABLE "orders" ADD CONSTRAINT "orders_experience_rating_check"
      CHECK ("experience_rating" IS NULL OR ("experience_rating" >= 0 AND "experience_rating" <= 5 AND trunc("experience_rating") = "experience_rating"));
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM "orders"
        WHERE "received_at" IS NOT NULL
          OR "experience_rating" IS NOT NULL
          OR "experience_comment" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'No se puede revertir la recepción mientras existan confirmaciones o reseñas. Conservá los registros y desplegá una corrección compatible.';
      END IF;
    END $$;
    ALTER TABLE "orders" DROP CONSTRAINT "orders_experience_rating_check";
    ALTER TABLE "orders" DROP COLUMN "received_at";
    ALTER TABLE "orders" DROP COLUMN "experience_rating";
    ALTER TABLE "orders" DROP COLUMN "experience_comment";
  `)
}
