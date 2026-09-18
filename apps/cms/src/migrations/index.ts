import * as cashPickupWindow from './20260918_180000_cash_pickup_window'
import * as migration_20260917_150000_staff_cash_commerce from './20260917_150000_staff_cash_commerce'
import * as migration_20260917_120000_transfer_identification from './20260917_120000_transfer_identification'
import * as migration_20260917_130000_cash_payment from './20260917_130000_cash_payment'
import * as migration_20260917_140000_staff_cash from './20260917_140000_staff_cash'
import * as migration_20260917_150000_order_receipt_feedback from './20260917_150000_order_receipt_feedback'
import * as migration_20260917_110000_payment_notifications from './20260917_110000_payment_notifications'
import * as migration_20260916_100000_transfer_reported from './20260916_100000_transfer_reported'
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
import * as migration_20260911_213034_variant_sort_order from './20260911_213034_variant_sort_order'
import * as migration_20260912_022008_task_06_1_local_purchase from './20260912_022008_task_06_1_local_purchase'
import * as migration_20260912_122450_task_06_1_order_local_sale from './20260912_122450_task_06_1_order_local_sale'
import * as migration_20260912_223137_task_06_1_commerce_settings from './20260912_223137_task_06_1_commerce_settings'
import * as migration_20260912_231316_cms_user_editor_language from './20260912_231316_cms_user_editor_language'
import * as migration_20260912_231908_cms_navigation_visibility from './20260912_231908_cms_navigation_visibility'
import * as migration_20260913_191156_category_lucide_icons from './20260913_191156_category_lucide_icons'
import * as migration_20260913_220000_category_slogan from './20260913_220000_category_slogan'
import * as migration_20260914_010000_site_shop_hero from './20260914_010000_site_shop_hero'
import * as migration_20260915_120000_payment_method_transfer from './20260915_120000_payment_method_transfer'
import * as migration_20260915_150000_pending_transfer_orders from './20260915_150000_pending_transfer_orders'
import * as migration_20260915_160000_order_public_reference from './20260915_160000_order_public_reference'

import * as migration_20260917_100000_transfer_verification from './20260917_100000_transfer_verification'

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
  {
    up: migration_20260911_213034_variant_sort_order.up,
    down: migration_20260911_213034_variant_sort_order.down,
    name: '20260911_213034_variant_sort_order',
  },
  {
    up: migration_20260912_022008_task_06_1_local_purchase.up,
    down: migration_20260912_022008_task_06_1_local_purchase.down,
    name: '20260912_022008_task_06_1_local_purchase',
  },
  {
    up: migration_20260912_122450_task_06_1_order_local_sale.up,
    down: migration_20260912_122450_task_06_1_order_local_sale.down,
    name: '20260912_122450_task_06_1_order_local_sale',
  },
  {
    up: migration_20260912_223137_task_06_1_commerce_settings.up,
    down: migration_20260912_223137_task_06_1_commerce_settings.down,
    name: '20260912_223137_task_06_1_commerce_settings',
  },
  {
    up: migration_20260912_231316_cms_user_editor_language.up,
    down: migration_20260912_231316_cms_user_editor_language.down,
    name: '20260912_231316_cms_user_editor_language',
  },
  {
    up: migration_20260912_231908_cms_navigation_visibility.up,
    down: migration_20260912_231908_cms_navigation_visibility.down,
    name: '20260912_231908_cms_navigation_visibility',
  },
  {
    up: migration_20260913_191156_category_lucide_icons.up,
    down: migration_20260913_191156_category_lucide_icons.down,
    name: '20260913_191156_category_lucide_icons',
  },
  {
    up: migration_20260913_220000_category_slogan.up,
    down: migration_20260913_220000_category_slogan.down,
    name: '20260913_220000_category_slogan',
  },
  {
    up: migration_20260914_010000_site_shop_hero.up,
    down: migration_20260914_010000_site_shop_hero.down,
    name: '20260914_010000_site_shop_hero',
  },
  {
    up: migration_20260915_120000_payment_method_transfer.up,
    down: migration_20260915_120000_payment_method_transfer.down,
    name: '20260915_120000_payment_method_transfer',
  },
  {
    up: migration_20260915_150000_pending_transfer_orders.up,
    down: migration_20260915_150000_pending_transfer_orders.down,
    name: '20260915_150000_pending_transfer_orders',
  },
  {
    up: migration_20260915_160000_order_public_reference.up,
    down: migration_20260915_160000_order_public_reference.down,
    name: '20260915_160000_order_public_reference',
  },
  {
    up: migration_20260916_100000_transfer_reported.up,
    down: migration_20260916_100000_transfer_reported.down,
    name: '20260916_100000_transfer_reported',
  },
  {
    up: migration_20260917_100000_transfer_verification.up,
    down: migration_20260917_100000_transfer_verification.down,
    name: '20260917_100000_transfer_verification',
  },
  {
    up: migration_20260917_110000_payment_notifications.up,
    down: migration_20260917_110000_payment_notifications.down,
    name: '20260917_110000_payment_notifications',
  },
  {
    up: migration_20260917_120000_transfer_identification.up,
    down: migration_20260917_120000_transfer_identification.down,
    name: '20260917_120000_transfer_identification',
  },
  {
    up: migration_20260917_130000_cash_payment.up,
    down: migration_20260917_130000_cash_payment.down,
    name: '20260917_130000_cash_payment',
  },
  {
    up: migration_20260917_140000_staff_cash.up,
    down: migration_20260917_140000_staff_cash.down,
    name: '20260917_140000_staff_cash',
  },
  {
    up: migration_20260917_150000_staff_cash_commerce.up,
    down: migration_20260917_150000_staff_cash_commerce.down,
    name: '20260917_150000_staff_cash_commerce',
  },
  {
    up: migration_20260917_150000_order_receipt_feedback.up,
    down: migration_20260917_150000_order_receipt_feedback.down,
    name: '20260917_150000_order_receipt_feedback',
  },
  {
    name: '20260918_180000_cash_pickup_window',
    up: cashPickupWindow.up,
    down: cashPickupWindow.down,
  },
]
