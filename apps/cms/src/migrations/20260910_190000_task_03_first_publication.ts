import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN "first_published_at" timestamp(3) with time zone;
    ALTER TABLE "_products_v" ADD COLUMN "version_first_published_at" timestamp(3) with time zone;
    UPDATE "products"
    SET "first_published_at" = "created_at"
    WHERE "_status" = 'published' AND "first_published_at" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_products_v" DROP COLUMN "version_first_published_at";
    ALTER TABLE "products" DROP COLUMN "first_published_at";
  `)
}
