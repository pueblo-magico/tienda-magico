import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN "public_reference" varchar DEFAULT gen_random_uuid()::text NOT NULL;
    CREATE UNIQUE INDEX "orders_public_reference_idx" ON "orders" USING btree ("public_reference");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "orders_public_reference_idx";
    ALTER TABLE "orders" DROP COLUMN "public_reference";
  `)
}
