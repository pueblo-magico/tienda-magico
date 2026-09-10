import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type CatalogDocument = { slug?: unknown }

async function notifyStorefront(
  resource: 'product' | 'media',
  documents: CatalogDocument[],
  logger: { warn: (message: string) => void },
) {
  const url = process.env.STOREFRONT_REVALIDATION_URL
  const secret = process.env.STOREFRONT_REVALIDATION_SECRET
  if (!url || !secret) return
  const slugs = documents.flatMap((document) =>
    typeof document.slug === 'string' && document.slug ? [document.slug] : [],
  )
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidation-secret': secret,
      },
      body: JSON.stringify({ resource, slugs: [...new Set(slugs)] }),
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) logger.warn(`No se pudo revalidar el catálogo (${response.status}).`)
  } catch {
    logger.warn('No se pudo contactar al storefront para revalidar el catálogo.')
  }
}

export const revalidateStorefrontProduct: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  await notifyStorefront('product', [doc, previousDoc], req.payload.logger)
  return doc
}

export const revalidateStorefrontProductDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  await notifyStorefront('product', [doc], req.payload.logger)
  return doc
}

export const revalidateStorefrontMedia: CollectionAfterChangeHook = async ({ doc, req }) => {
  await notifyStorefront('media', [doc], req.payload.logger)
  return doc
}

export const revalidateStorefrontMediaDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await notifyStorefront('media', [doc], req.payload.logger)
  return doc
}
