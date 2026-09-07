import * as migration_20260825_001134_initial_schema from './20260825_001134_initial_schema'
import * as migration_20260825_020000_spanish_ars_defaults from './20260825_020000_spanish_ars_defaults'
import * as migration_20260825_020001_ars_defaults from './20260825_020001_ars_defaults'
import * as migration_20260907_130000_taxonomy_brands from './20260907_130000_taxonomy_brands'

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
]
