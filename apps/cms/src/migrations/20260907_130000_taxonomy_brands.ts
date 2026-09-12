import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN "parent_id" integer;
    ALTER TABLE "categories" ADD COLUMN "display_order" numeric DEFAULT 0 NOT NULL;
    ALTER TABLE "categories" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;
    ALTER TABLE "categories_locales" ADD COLUMN "seo_title" varchar;
    ALTER TABLE "categories_locales" ADD COLUMN "seo_description" varchar;

    CREATE TABLE "brands" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "logo_id" integer,
      "country_code" varchar,
      "website" varchar,
      "is_active" boolean DEFAULT true NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE "brands_locales" (
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "group" varchar,
      "is_visible" boolean DEFAULT true NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE "tags_locales" (
      "label" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "products" ADD COLUMN "brand_id" integer;
    ALTER TABLE "products_rels" ADD COLUMN "categories_id" integer;
    ALTER TABLE "products_rels" ADD COLUMN "tags_id" integer;
    ALTER TABLE "_products_v" ADD COLUMN "version_brand_id" integer;
    ALTER TABLE "_products_v_rels" ADD COLUMN "categories_id" integer;
    ALTER TABLE "_products_v_rels" ADD COLUMN "tags_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;

    ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "brands_locales" ADD CONSTRAINT "brands_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
    CREATE INDEX "categories_display_order_idx" ON "categories" USING btree ("display_order");
    CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
    CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
    CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
    CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
    CREATE UNIQUE INDEX "brands_locales_locale_parent_id_unique" ON "brands_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
    CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
    CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
    CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
    CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
    CREATE INDEX "products_rels_tags_id_idx" ON "products_rels" USING btree ("tags_id");
    CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
    CREATE INDEX "_products_v_rels_categories_id_idx" ON "_products_v_rels" USING btree ("categories_id");
    CREATE INDEX "_products_v_rels_tags_id_idx" ON "_products_v_rels" USING btree ("tags_id");
    CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
    CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
    ALTER TABLE "_products_v_rels" DROP COLUMN "categories_id";
    ALTER TABLE "_products_v_rels" DROP COLUMN "tags_id";
    ALTER TABLE "_products_v" DROP COLUMN "version_brand_id";
    ALTER TABLE "products_rels" DROP COLUMN "categories_id";
    ALTER TABLE "products_rels" DROP COLUMN "tags_id";
    ALTER TABLE "products" DROP COLUMN "brand_id";
    ALTER TABLE "categories" DROP COLUMN "parent_id";
    ALTER TABLE "categories" DROP COLUMN "display_order";
    ALTER TABLE "categories" DROP COLUMN "is_visible";
    ALTER TABLE "categories_locales" DROP COLUMN "seo_title";
    ALTER TABLE "categories_locales" DROP COLUMN "seo_description";
    DROP TABLE "brands_locales" CASCADE;
    DROP TABLE "brands" CASCADE;
    DROP TABLE "tags_locales" CASCADE;
    DROP TABLE "tags" CASCADE;
  `)
}
