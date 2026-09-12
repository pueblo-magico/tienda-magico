import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_editor_language" AS ENUM('es', 'en');
  ALTER TABLE "pages_blocks_newsletter_locales" ALTER COLUMN "button_label" DROP DEFAULT;
  ALTER TABLE "pages_blocks_newsletter_locales" ALTER COLUMN "success_message" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_newsletter_locales" ALTER COLUMN "button_label" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_newsletter_locales" ALTER COLUMN "success_message" DROP DEFAULT;
  ALTER TABLE "users" ADD COLUMN "editor_language" "enum_users_editor_language" DEFAULT 'es' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_newsletter_locales" ALTER COLUMN "button_label" SET DEFAULT 'Subscribe';
  ALTER TABLE "pages_blocks_newsletter_locales" ALTER COLUMN "success_message" SET DEFAULT 'Thanks for subscribing.';
  ALTER TABLE "_pages_v_blocks_newsletter_locales" ALTER COLUMN "button_label" SET DEFAULT 'Subscribe';
  ALTER TABLE "_pages_v_blocks_newsletter_locales" ALTER COLUMN "success_message" SET DEFAULT 'Thanks for subscribing.';
  ALTER TABLE "users" DROP COLUMN "editor_language";
  DROP TYPE "public"."enum_users_editor_language";`)
}
