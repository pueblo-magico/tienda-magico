import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'ARS';
    ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'ARS';
    ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'ARS';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';
    ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
    ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';
  `)
}
