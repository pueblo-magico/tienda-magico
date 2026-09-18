import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('mercado-pago', 'bank-transfer');
    CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'unverified');
    CREATE TYPE "public"."enum_local_sales_payment_method" AS ENUM('mercado-pago', 'bank-transfer');
    ALTER TABLE "orders" ADD COLUMN "payment_method" "enum_orders_payment_method" DEFAULT 'mercado-pago' NOT NULL;
    ALTER TABLE "orders" ADD COLUMN "payment_expires_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN "payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL;
    ALTER TABLE "local_sales" ADD COLUMN "payment_method" "enum_local_sales_payment_method" DEFAULT 'mercado-pago' NOT NULL;
    ALTER TABLE "local_sales" ADD COLUMN "payment_expires_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN "payment_method";
    ALTER TABLE "orders" DROP COLUMN "payment_expires_at";
    ALTER TABLE "orders" DROP COLUMN "payment_status";
    ALTER TABLE "local_sales" DROP COLUMN "payment_method";
    ALTER TABLE "local_sales" DROP COLUMN "payment_expires_at";
    DROP TYPE "public"."enum_orders_payment_method";
    DROP TYPE "public"."enum_orders_payment_status";
    DROP TYPE "public"."enum_local_sales_payment_method";
  `)
}
