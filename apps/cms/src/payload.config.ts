import { postgresAdapter } from '@payloadcms/db-postgres'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { config as loadEnv } from 'dotenv'

import { adminOnlyFieldAccess } from './access/adminOnlyFieldAccess'
import { adminOrPublishedStatus } from './access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from './access/customerOnlyFieldAccess'
import { isAdmin } from './access/isAdmin'
import { isDocumentOwner } from './access/isDocumentOwner'
import { Categories } from './collections/Categories'
import { Brands } from './collections/Brands'
import { FAQs } from './collections/FAQs'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { productsCollectionOverride } from './collections/Products'
import { cartsCollectionOverride } from './collections/cartCommercialValidation'
import {
  variantsCollectionOverride,
  variantOptionsCollectionOverride,
  variantTypesCollectionOverride,
} from './collections/variantEditorGuidance'
import { Testimonials } from './collections/Testimonials'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SEO } from './globals/SEO'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const serverURL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:4000'

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Pueblo Mágico CMS',
    },
  },
  collections: [
    Users,
    Media,
    // Content (Phase 6)
    Pages,
    Posts,
    Testimonials,
    FAQs,
    // Shop catalogue helpers
    Categories,
    Brands,
    Tags,
  ],
  globals: [Header, Footer, SiteSettings, SEO],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    prodMigrations: migrations,
  }),
  cors: corsOrigins,
  csrf: corsOrigins,
  localization: {
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'es',
        label: 'Español',
      },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  sharp,
  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess,
        adminOrPublishedStatus,
        customerOnlyFieldAccess,
        isAdmin,
        isDocumentOwner,
      },
      customers: {
        slug: 'users',
      },
      currencies: {
        defaultCurrency: 'ARS',
        supportedCurrencies: [
          {
            code: 'ARS',
            decimals: 2,
            label: 'Peso argentino',
            symbol: '$',
          },
        ],
      },
      carts: {
        cartsCollectionOverride,
        allowGuestCarts: true,
      },
      // Payments/transactions can be added later (Stripe adapter).
      // Catalogue + carts work without a payment method configured.
      products: {
        productsCollectionOverride,
        variants: {
          variantsCollectionOverride,
          variantOptionsCollectionOverride,
          variantTypesCollectionOverride,
        },
      },
      addresses: true,
      orders: true,
    }),
  ],
})
