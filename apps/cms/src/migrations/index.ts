import * as migration_20260825_001134_initial_schema from './20260825_001134_initial_schema'
import * as migration_20260825_020001_ars_defaults from './20260825_020001_ars_defaults'
import * as migration_20260825_020000_spanish_ars_defaults from './20260825_020000_spanish_ars_defaults'
import * as migration_20260907_130000_taxonomy_brands from './20260907_130000_taxonomy_brands'
import * as migration_20260908_041909_task_03_product_content_media from './20260908_041909_task_03_product_content_media'
import * as migration_20260910_143311_task_03_origin_seo from './20260910_143311_task_03_origin_seo'
import * as migration_20260910_160000_category_icons from './20260910_160000_category_icons'
import * as migration_20260910_170000_task_03_lifecycle from './20260910_170000_task_03_lifecycle'
import * as migration_20260910_190000_task_03_first_publication from './20260910_190000_task_03_first_publication'

// El enum ARS debe existir antes de asignarlo como valor por defecto.
export const migrations = [
  {
    up: migration_20260825_001134_initial_schema.up,
    down: migration_20260825_001134_initial_schema.down,
    name: '20260825_001134_initial_schema',
  },
  {
    up: migration_20260825_020001_ars_defaults.up,
    down: migration_20260825_020001_ars_defaults.down,
    name: '20260825_020001_ars_defaults',
  },
  {
    up: migration_20260825_020000_spanish_ars_defaults.up,
    down: migration_20260825_020000_spanish_ars_defaults.down,
    name: '20260825_020000_spanish_ars_defaults',
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
]
