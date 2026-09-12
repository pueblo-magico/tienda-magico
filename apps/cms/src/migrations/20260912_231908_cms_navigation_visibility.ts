import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cms_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"media" boolean DEFAULT true NOT NULL,
  	"pages" boolean DEFAULT true NOT NULL,
  	"posts" boolean DEFAULT true NOT NULL,
  	"testimonials" boolean DEFAULT true NOT NULL,
  	"faqs" boolean DEFAULT true NOT NULL,
  	"header" boolean DEFAULT true NOT NULL,
  	"footer" boolean DEFAULT true NOT NULL,
  	"local_sales" boolean DEFAULT true NOT NULL,
  	"categories" boolean DEFAULT true NOT NULL,
  	"brands" boolean DEFAULT true NOT NULL,
  	"tags" boolean DEFAULT true NOT NULL,
  	"addresses" boolean DEFAULT true NOT NULL,
  	"variants" boolean DEFAULT true NOT NULL,
  	"variant_types" boolean DEFAULT true NOT NULL,
  	"variant_options" boolean DEFAULT true NOT NULL,
  	"products" boolean DEFAULT true NOT NULL,
  	"carts" boolean DEFAULT true NOT NULL,
  	"orders" boolean DEFAULT true NOT NULL,
  	"transactions" boolean DEFAULT true NOT NULL,
  	"users" boolean DEFAULT true NOT NULL,
  	"site_settings" boolean DEFAULT true NOT NULL,
  	"commerce_settings" boolean DEFAULT true NOT NULL,
  	"seo" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms_settings" CASCADE;`)
}
