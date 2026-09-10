import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE products SET sku = 'PM-P-' || id WHERE sku IS NULL AND enable_variants IS NOT TRUE;
    UPDATE variants SET sku = 'PM-V-' || id WHERE sku IS NULL;
    UPDATE _products_v SET version_sku = products.sku FROM products WHERE _products_v.parent_id = products.id AND version_sku IS NULL;
    UPDATE _variants_v SET version_sku = variants.sku FROM variants WHERE _variants_v.parent_id = variants.id AND version_sku IS NULL;
    UPDATE variants SET combination_key = product_id || ':' || options.codes FROM (
      SELECT parent_id, string_agg(variant_options_id::text, ',' ORDER BY variant_options_id::text) AS codes
      FROM variants_rels WHERE path = 'options' AND variant_options_id IS NOT NULL GROUP BY parent_id
    ) options WHERE variants.id = options.parent_id;
    UPDATE _variants_v SET version_combination_key = variants.combination_key FROM variants WHERE _variants_v.parent_id = variants.id;
    CREATE FUNCTION enforce_commerce_sku() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.sku IS NULL THEN RETURN NEW; END IF;
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW.sku, 221));
      IF TG_TABLE_NAME = 'products' THEN
        IF EXISTS (SELECT 1 FROM variants WHERE sku = NEW.sku) THEN RAISE EXCEPTION 'SKU duplicado' USING ERRCODE = '23505'; END IF;
      ELSE
        IF EXISTS (SELECT 1 FROM products WHERE sku = NEW.sku) THEN RAISE EXCEPTION 'SKU duplicado' USING ERRCODE = '23505'; END IF;
      END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER products_commerce_sku BEFORE INSERT OR UPDATE OF sku ON products FOR EACH ROW EXECUTE FUNCTION enforce_commerce_sku();
    CREATE TRIGGER variants_commerce_sku BEFORE INSERT OR UPDATE OF sku ON variants FOR EACH ROW EXECUTE FUNCTION enforce_commerce_sku();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER products_commerce_sku ON products;
    DROP TRIGGER variants_commerce_sku ON variants;
    DROP FUNCTION enforce_commerce_sku();
  `)
}
