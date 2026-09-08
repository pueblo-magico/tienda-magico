import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Agrega únicamente las estructuras persistidas introducidas por PMG-220. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "products_gallery_locales" (
      "caption" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "products_information_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" varchar,
      "is_visible" boolean DEFAULT true
    );

    CREATE TABLE "products_information_sections_locales" (
      "title" varchar,
      "body" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "_products_v_version_gallery_locales" (
      "caption" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_products_v_version_information_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar,
      "is_visible" boolean DEFAULT true,
      "_uuid" varchar
    );

    CREATE TABLE "_products_v_version_information_sections_locales" (
      "title" varchar,
      "body" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "products_gallery" ADD COLUMN "external_video_url" varchar;
    ALTER TABLE "products_gallery" ADD COLUMN "is_primary" boolean DEFAULT false;
    ALTER TABLE "_products_v_version_gallery" ADD COLUMN "external_video_url" varchar;
    ALTER TABLE "_products_v_version_gallery" ADD COLUMN "is_primary" boolean DEFAULT false;

    ALTER TABLE "products_gallery_locales" ADD CONSTRAINT "products_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_gallery"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "products_information_sections" ADD CONSTRAINT "products_information_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "products_information_sections_locales" ADD CONSTRAINT "products_information_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_information_sections"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_products_v_version_gallery_locales" ADD CONSTRAINT "_products_v_version_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_gallery"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_products_v_version_information_sections" ADD CONSTRAINT "_products_v_version_information_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_products_v_version_information_sections_locales" ADD CONSTRAINT "_products_v_version_information_sections_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_information_sections"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "products_gallery_locales_locale_parent_id_unique" ON "products_gallery_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX "products_information_sections_order_idx" ON "products_information_sections" USING btree ("_order");
    CREATE INDEX "products_information_sections_parent_id_idx" ON "products_information_sections" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "products_information_sections_locales_locale_parent_id_uniqu" ON "products_information_sections_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX "_products_v_version_gallery_locales_locale_parent_id_unique" ON "_products_v_version_gallery_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX "_products_v_version_information_sections_order_idx" ON "_products_v_version_information_sections" USING btree ("_order");
    CREATE INDEX "_products_v_version_information_sections_parent_id_idx" ON "_products_v_version_information_sections" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "_products_v_version_information_sections_locales_locale_pare" ON "_products_v_version_information_sections_locales" USING btree ("_locale", "_parent_id");
  `)
}

/** El rollback elimina contenido de secciones, captions y configuración de videos externos. */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "products_gallery_locales" CASCADE;
    DROP TABLE "products_information_sections_locales" CASCADE;
    DROP TABLE "products_information_sections" CASCADE;
    DROP TABLE "_products_v_version_gallery_locales" CASCADE;
    DROP TABLE "_products_v_version_information_sections_locales" CASCADE;
    DROP TABLE "_products_v_version_information_sections" CASCADE;

    ALTER TABLE "products_gallery" DROP COLUMN "external_video_url";
    ALTER TABLE "products_gallery" DROP COLUMN "is_primary";
    ALTER TABLE "_products_v_version_gallery" DROP COLUMN "external_video_url";
    ALTER TABLE "_products_v_version_gallery" DROP COLUMN "is_primary";
  `)
}
