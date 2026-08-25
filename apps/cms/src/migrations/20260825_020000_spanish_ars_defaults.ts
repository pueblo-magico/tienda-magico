import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Preserve legacy USD data while requiring editors to enter ARS explicitly. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_carts_currency" ADD VALUE IF NOT EXISTS 'ARS';
    ALTER TYPE "public"."enum_orders_currency" ADD VALUE IF NOT EXISTS 'ARS';
    ALTER TYPE "public"."enum_transactions_currency" ADD VALUE IF NOT EXISTS 'ARS';

    ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "price_in_a_r_s_enabled" boolean;
    ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "price_in_a_r_s" numeric;
    ALTER TABLE "_variants_v" ADD COLUMN IF NOT EXISTS "version_price_in_a_r_s_enabled" boolean;
    ALTER TABLE "_variants_v" ADD COLUMN IF NOT EXISTS "version_price_in_a_r_s" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_in_a_r_s_enabled" boolean;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_in_a_r_s" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_price_in_a_r_s_enabled" boolean;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_price_in_a_r_s" numeric;

  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "variants" DROP COLUMN IF EXISTS "price_in_a_r_s_enabled";
    ALTER TABLE "variants" DROP COLUMN IF EXISTS "price_in_a_r_s";
    ALTER TABLE "_variants_v" DROP COLUMN IF EXISTS "version_price_in_a_r_s_enabled";
    ALTER TABLE "_variants_v" DROP COLUMN IF EXISTS "version_price_in_a_r_s";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "price_in_a_r_s_enabled";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "price_in_a_r_s";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_price_in_a_r_s_enabled";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_price_in_a_r_s";
  `)
}
