import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "variant_types_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "variant_options_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "variant_types_locales" ADD CONSTRAINT "variant_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_options_locales" ADD CONSTRAINT "variant_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "variant_types_locales_locale_parent_id_unique" ON "variant_types_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "variant_options_locales_locale_parent_id_unique" ON "variant_options_locales" USING btree ("_locale","_parent_id");
  INSERT INTO "variant_types_locales" (label, _locale, _parent_id) SELECT label, locale::"_locales", id FROM "variant_types" CROSS JOIN (VALUES ('es'), ('en')) locales(locale);
  ALTER TABLE "variant_types" DROP COLUMN "label";
  INSERT INTO "variant_options_locales" (label, _locale, _parent_id) SELECT label, locale::"_locales", id FROM "variant_options" CROSS JOIN (VALUES ('es'), ('en')) locales(locale);
  ALTER TABLE "variant_options" DROP COLUMN "label";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variant_types" ADD COLUMN "label" varchar;
  UPDATE "variant_types" SET label = COALESCE((SELECT label FROM "variant_types_locales" WHERE _parent_id = "variant_types".id ORDER BY CASE WHEN _locale = 'es' THEN 0 ELSE 1 END LIMIT 1), 'Sin etiqueta');
  ALTER TABLE "variant_types" ALTER COLUMN "label" SET NOT NULL;
  DROP TABLE "variant_types_locales" CASCADE;
  ALTER TABLE "variant_options" ADD COLUMN "label" varchar;
  UPDATE "variant_options" SET label = COALESCE((SELECT label FROM "variant_options_locales" WHERE _parent_id = "variant_options".id ORDER BY CASE WHEN _locale = 'es' THEN 0 ELSE 1 END LIMIT 1), 'Sin etiqueta');
  ALTER TABLE "variant_options" ALTER COLUMN "label" SET NOT NULL;
  DROP TABLE "variant_options_locales" CASCADE;`)
}
