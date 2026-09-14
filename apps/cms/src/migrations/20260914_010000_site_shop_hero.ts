import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings_locales" ADD COLUMN "shop_hero_image_id" integer;
    ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_shop_hero_image_id_media_id_fk" FOREIGN KEY ("shop_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "site_settings_locales_shop_hero_image_idx" ON "site_settings_locales" USING btree ("shop_hero_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings_locales" DROP CONSTRAINT "site_settings_locales_shop_hero_image_id_media_id_fk";
    DROP INDEX "site_settings_locales_shop_hero_image_idx";
    ALTER TABLE "site_settings_locales" DROP COLUMN "shop_hero_image_id";
  `)
}
