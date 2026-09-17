import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_payment_method" ADD VALUE IF NOT EXISTS 'cash';
    ALTER TYPE "public"."enum_local_sales_payment_method" ADD VALUE IF NOT EXISTS 'cash';
    ALTER TABLE "commerce_settings" ADD COLUMN "cash_enabled" boolean DEFAULT false NOT NULL;
    ALTER TABLE "orders" ADD COLUMN "cash_verification" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    LOCK TABLE "orders", "local_sales" IN ACCESS EXCLUSIVE MODE;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "orders" WHERE "payment_method" = 'cash' OR "cash_verification" IS NOT NULL)
        OR EXISTS (SELECT 1 FROM "local_sales" WHERE "payment_method" = 'cash') THEN
        RAISE EXCEPTION 'No se puede revertir efectivo mientras existan pedidos, ventas o auditorías de efectivo. Conservá estos registros y desplegá una corrección compatible.';
      END IF;
    END $$;
    ALTER TABLE "orders" ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "local_sales" ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE text USING "payment_method"::text;
    ALTER TABLE "local_sales" ALTER COLUMN "payment_method" TYPE text USING "payment_method"::text;
    DROP TYPE "public"."enum_orders_payment_method";
    DROP TYPE "public"."enum_local_sales_payment_method";
    CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('mercado-pago', 'bank-transfer');
    CREATE TYPE "public"."enum_local_sales_payment_method" AS ENUM('mercado-pago', 'bank-transfer');
    ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "public"."enum_orders_payment_method" USING "payment_method"::"public"."enum_orders_payment_method";
    ALTER TABLE "local_sales" ALTER COLUMN "payment_method" TYPE "public"."enum_local_sales_payment_method" USING "payment_method"::"public"."enum_local_sales_payment_method";
    ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'mercado-pago';
    ALTER TABLE "local_sales" ALTER COLUMN "payment_method" SET DEFAULT 'mercado-pago';
    ALTER TABLE "commerce_settings" DROP COLUMN "cash_enabled";
    ALTER TABLE "orders" DROP COLUMN "cash_verification";
  `)
}
