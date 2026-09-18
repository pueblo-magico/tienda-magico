import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE orders ADD COLUMN transfer_identification jsonb;
    CREATE INDEX orders_transfer_payer_idx ON orders ((transfer_identification->>'type'), (transfer_identification->>'number'));
    ALTER TABLE payment_notifications
      ADD COLUMN payer_type varchar,
      ADD COLUMN payer_number varchar,
      ADD COLUMN payment_type varchar,
      ADD COLUMN status_detail varchar,
      ADD COLUMN refunded_amount numeric,
      ADD COLUMN approved_at timestamp(3) with time zone,
      ADD COLUMN reconciliation varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX orders_transfer_payer_idx;
    ALTER TABLE orders DROP COLUMN transfer_identification;
    ALTER TABLE payment_notifications
      DROP COLUMN payer_type, DROP COLUMN payer_number, DROP COLUMN payment_type,
      DROP COLUMN status_detail, DROP COLUMN refunded_amount, DROP COLUMN approved_at, DROP COLUMN reconciliation;
  `)
}
