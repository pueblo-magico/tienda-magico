import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "seo_no_index" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "country_of_origin" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "region" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "community" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "origin_story" jsonb;
  ALTER TABLE "_products_v" ADD COLUMN "version_seo_image_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_seo_no_index" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_country_of_origin" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_region" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_community" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_origin_story" jsonb;
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_seo_seo_image_idx" ON "products" USING btree ("seo_image_id");
  CREATE INDEX "_products_v_version_seo_version_seo_image_idx" ON "_products_v" USING btree ("version_seo_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_seo_image_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_seo_image_id_media_id_fk";
  
  DROP INDEX "products_seo_seo_image_idx";
  DROP INDEX "_products_v_version_seo_version_seo_image_idx";
  ALTER TABLE "products" DROP COLUMN "seo_image_id";
  ALTER TABLE "products" DROP COLUMN "seo_no_index";
  ALTER TABLE "products" DROP COLUMN "country_of_origin";
  ALTER TABLE "products_locales" DROP COLUMN "seo_title";
  ALTER TABLE "products_locales" DROP COLUMN "seo_description";
  ALTER TABLE "products_locales" DROP COLUMN "region";
  ALTER TABLE "products_locales" DROP COLUMN "community";
  ALTER TABLE "products_locales" DROP COLUMN "origin_story";
  ALTER TABLE "_products_v" DROP COLUMN "version_seo_image_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_seo_no_index";
  ALTER TABLE "_products_v" DROP COLUMN "version_country_of_origin";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_seo_title";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_seo_description";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_region";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_community";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_origin_story";`)
}
