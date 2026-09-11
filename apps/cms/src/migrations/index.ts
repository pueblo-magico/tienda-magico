import * as migration_20260825_001134_initial_schema from './20260825_001134_initial_schema'
import * as migration_20260825_020000_spanish_ars_defaults from './20260825_020000_spanish_ars_defaults'
import * as migration_20260825_020001_ars_defaults from './20260825_020001_ars_defaults'
import * as migration_20260907_130000_taxonomy_brands from './20260907_130000_taxonomy_brands'
import * as migration_20260908_041909_task_03_product_content_media from './20260908_041909_task_03_product_content_media'
import * as migration_20260910_143311_task_03_origin_seo from './20260910_143311_task_03_origin_seo'
import * as migration_20260910_160000_category_icons from './20260910_160000_category_icons'
import * as migration_20260910_170000_task_03_lifecycle from './20260910_170000_task_03_lifecycle'
import * as migration_20260910_190000_task_03_first_publication from './20260910_190000_task_03_first_publication'
import * as migration_20260910_214050_task_04_sellable_items from './20260910_214050_task_04_sellable_items'
import * as migration_20260910_214849_task_04_option_labels from './20260910_214849_task_04_option_labels'
import * as migration_20260910_220000_task_04_identity_backfill from './20260910_220000_task_04_identity_backfill'
import * as migration_20260910_224721_task_04_cart_price_snapshot from './20260910_224721_task_04_cart_price_snapshot'
import * as migration_20260911_001000_task_04_active_combination_index from './20260911_001000_task_04_active_combination_index'
import * as migration_20260911_142004_task_04_schema_alignment from './20260911_142004_task_04_schema_alignment'

export const migrations = [
  {
    up: migration_20260825_001134_initial_schema.up,
    down: migration_20260825_001134_initial_schema.down,
    name: '20260825_001134_initial_schema',
  },
  {
    up: migration_20260825_020000_spanish_ars_defaults.up,
    down: migration_20260825_020000_spanish_ars_defaults.down,
    name: '20260825_020000_spanish_ars_defaults',
  },
  {
    up: migration_20260825_020001_ars_defaults.up,
    down: migration_20260825_020001_ars_defaults.down,
    name: '20260825_020001_ars_defaults',
  },
  {
    up: migration_20260907_130000_taxonomy_brands.up,
    down: migration_20260907_130000_taxonomy_brands.down,
    name: '20260907_130000_taxonomy_brands',
  },
  {
    up: migration_20260908_041909_task_03_product_content_media.up,
    down: migration_20260908_041909_task_03_product_content_media.down,
    name: '20260908_041909_task_03_product_content_media',
  },
  {
    up: migration_20260910_143311_task_03_origin_seo.up,
    down: migration_20260910_143311_task_03_origin_seo.down,
    name: '20260910_143311_task_03_origin_seo',
  },
  {
    up: migration_20260910_160000_category_icons.up,
    down: migration_20260910_160000_category_icons.down,
    name: '20260910_160000_category_icons',
  },
  {
    up: migration_20260910_170000_task_03_lifecycle.up,
    down: migration_20260910_170000_task_03_lifecycle.down,
    name: '20260910_170000_task_03_lifecycle',
  },
  {
    up: migration_20260910_190000_task_03_first_publication.up,
    down: migration_20260910_190000_task_03_first_publication.down,
    name: '20260910_190000_task_03_first_publication',
  },
  {
    up: migration_20260910_214050_task_04_sellable_items.up,
    down: migration_20260910_214050_task_04_sellable_items.down,
    name: '20260910_214050_task_04_sellable_items',
  },
  {
    up: migration_20260910_214849_task_04_option_labels.up,
    down: migration_20260910_214849_task_04_option_labels.down,
    name: '20260910_214849_task_04_option_labels',
  },
  {
    up: migration_20260910_220000_task_04_identity_backfill.up,
    down: migration_20260910_220000_task_04_identity_backfill.down,
    name: '20260910_220000_task_04_identity_backfill',
  },
  {
    up: migration_20260910_224721_task_04_cart_price_snapshot.up,
    down: migration_20260910_224721_task_04_cart_price_snapshot.down,
    name: '20260910_224721_task_04_cart_price_snapshot',
  },
  {
    up: migration_20260911_001000_task_04_active_combination_index.up,
    down: migration_20260911_001000_task_04_active_combination_index.down,
    name: '20260911_001000_task_04_active_combination_index',
  },
  {
    up: migration_20260911_142004_task_04_schema_alignment.up,
    down: migration_20260911_142004_task_04_schema_alignment.down,
    name: '20260911_142004_task_04_schema_alignment',
  },
]
