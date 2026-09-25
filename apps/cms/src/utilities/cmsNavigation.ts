import type { VisibleEntities } from 'payload'

type LocalizedLabel = { es: string; en: string }

export const CMS_VISIBILITY_ROLES = [
  { key: 'admin', enabled: true },
  { key: 'purchasing', enabled: true },
  { key: 'finance', enabled: true },
  { key: 'editor', enabled: false },
  { key: 'customer', enabled: false },
] as const

export const CMS_VISIBILITY_ROLE_LABELS = {
  admin: { es: 'Administrador', en: 'Admin' },
  purchasing: { es: 'Compras', en: 'Purchasing' },
  finance: { es: 'Finanzas', en: 'Finance' },
  editor: { es: 'Editor', en: 'Editor' },
  customer: { es: 'Cliente', en: 'Customer' },
} as const

export type CmsNavigationItem = {
  key: string
  slug: string
  entityType: 'collection' | 'global'
  group: 'content' | 'shop' | 'settings'
  label: LocalizedLabel
}

export const CMS_NAVIGATION_ITEMS: CmsNavigationItem[] = [
  {
    key: 'suppliers',
    slug: 'suppliers',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Proveedores', en: 'Suppliers' },
  },
  {
    key: 'paymentNotifications',
    slug: 'payment-notifications',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Notificaciones de pago', en: 'Payment notifications' },
  },
  {
    key: 'users',
    slug: 'users',
    entityType: 'collection',
    group: 'settings',
    label: { es: 'Usuarios', en: 'Users' },
  },
  {
    key: 'media',
    slug: 'media',
    entityType: 'collection',
    group: 'content',
    label: { es: 'Medios', en: 'Media' },
  },
  {
    key: 'localSales',
    slug: 'localSales',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Ventas locales', en: 'Local sales' },
  },
  {
    key: 'pages',
    slug: 'pages',
    entityType: 'collection',
    group: 'content',
    label: { es: 'Páginas', en: 'Pages' },
  },
  {
    key: 'posts',
    slug: 'posts',
    entityType: 'collection',
    group: 'content',
    label: { es: 'Publicaciones', en: 'Posts' },
  },
  {
    key: 'testimonials',
    slug: 'testimonials',
    entityType: 'collection',
    group: 'content',
    label: { es: 'Testimonios', en: 'Testimonials' },
  },
  {
    key: 'faqs',
    slug: 'faqs',
    entityType: 'collection',
    group: 'content',
    label: { es: 'Preguntas frecuentes', en: 'FAQs' },
  },
  {
    key: 'categories',
    slug: 'categories',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Categorías', en: 'Categories' },
  },
  {
    key: 'brands',
    slug: 'brands',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Marcas', en: 'Brands' },
  },
  {
    key: 'tags',
    slug: 'tags',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Etiquetas', en: 'Tags' },
  },
  {
    key: 'addresses',
    slug: 'addresses',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Direcciones', en: 'Addresses' },
  },
  {
    key: 'variants',
    slug: 'variants',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Variantes', en: 'Variants' },
  },
  {
    key: 'variantTypes',
    slug: 'variantTypes',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Tipos de variante', en: 'Variant types' },
  },
  {
    key: 'variantOptions',
    slug: 'variantOptions',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Opciones de variante', en: 'Variant options' },
  },
  {
    key: 'products',
    slug: 'products',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Productos', en: 'Products' },
  },
  {
    key: 'carts',
    slug: 'carts',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Carritos', en: 'Carts' },
  },
  {
    key: 'orders',
    slug: 'orders',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Pedidos', en: 'Orders' },
  },
  {
    key: 'transactions',
    slug: 'transactions',
    entityType: 'collection',
    group: 'shop',
    label: { es: 'Transacciones', en: 'Transactions' },
  },
  {
    key: 'header',
    slug: 'header',
    entityType: 'global',
    group: 'content',
    label: { es: 'Encabezado', en: 'Header' },
  },
  {
    key: 'footer',
    slug: 'footer',
    entityType: 'global',
    group: 'content',
    label: { es: 'Pie de página', en: 'Footer' },
  },
  {
    key: 'siteSettings',
    slug: 'site-settings',
    entityType: 'global',
    group: 'settings',
    label: { es: 'Configuración del sitio', en: 'Site settings' },
  },
  {
    key: 'commerceSettings',
    slug: 'commerce-settings',
    entityType: 'global',
    group: 'settings',
    label: { es: 'Configuración de comercio', en: 'Commerce settings' },
  },
  {
    key: 'seo',
    slug: 'seo',
    entityType: 'global',
    group: 'settings',
    label: { es: 'SEO', en: 'SEO' },
  },
]

export type CmsNavigationVisibility = Record<string, boolean>

export const defaultCmsNavigationVisibility: CmsNavigationVisibility = Object.fromEntries(
  CMS_NAVIGATION_ITEMS.map((item) => [item.key, true]),
)

export function parseCmsNavigationVisibility(value: unknown): CmsNavigationVisibility {
  if (!value || typeof value !== 'object') return defaultCmsNavigationVisibility

  const settings = value as Record<string, unknown>
  return Object.fromEntries(
    CMS_NAVIGATION_ITEMS.map((item) => [
      item.key,
      typeof settings[item.key] === 'boolean' ? settings[item.key] : true,
    ]),
  ) as CmsNavigationVisibility
}

export function filterVisibleEntities(
  visibleEntities: VisibleEntities,
  visibility: CmsNavigationVisibility,
): VisibleEntities {
  const disabledCollections = new Set(
    CMS_NAVIGATION_ITEMS.filter(
      (item) => item.entityType === 'collection' && visibility[item.key] === false,
    ).map((item) => item.slug),
  )
  const disabledGlobals = new Set(
    CMS_NAVIGATION_ITEMS.filter(
      (item) => item.entityType === 'global' && visibility[item.key] === false,
    ).map((item) => item.slug),
  )

  return {
    collections: visibleEntities.collections.filter((slug) => !disabledCollections.has(slug)),
    globals: visibleEntities.globals.filter((slug) => !disabledGlobals.has(slug)),
  }
}
