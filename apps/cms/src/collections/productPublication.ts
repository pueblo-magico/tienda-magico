import { ValidationError } from 'payload'
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload'

type Item = {
  id?: unknown
  product?: unknown
  _status?: unknown
  priceInARSEnabled?: unknown
  priceInARS?: unknown
}
function idOf(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return idOf(value.id)
  return null
}

function validPrice(item: Item): boolean {
  return (
    item.priceInARSEnabled === true &&
    typeof item.priceInARS === 'number' &&
    Number.isSafeInteger(item.priceInARS) &&
    item.priceInARS >= 0
  )
}

function reject(req: PayloadRequest, path: string): never {
  throw new ValidationError({
    errors: [
      {
        path,
        message:
          req.locale === 'en'
            ? 'A published product needs a published variant with ARS enabled and a valid price. Save the product as a draft first, or publish another variant. Simple products need their own valid ARS price.'
            : 'Un producto publicado necesita una variante publicada con ARS activo y precio válido. Guardá primero el producto como borrador o publicá otra variante. Los productos simples necesitan su propio precio ARS válido.',
      },
    ],
  })
}

async function hasVariant(
  req: PayloadRequest,
  product: string | number,
  exclude?: string | number,
) {
  const result = await req.payload.find({
    collection: 'variants',
    req,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    draft: false,
    where: {
      and: [
        { product: { equals: product } },
        { _status: { equals: 'published' } },
        { priceInARSEnabled: { equals: true } },
        { priceInARS: { greater_than_equal: 0 } },
        ...(exclude == null ? [] : [{ id: { not_equals: exclude } }]),
      ],
    },
  })
  return result.docs.some((doc) => validPrice(doc))
}

export const validateProductPublication: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const next = { ...originalDoc, ...data }
  if (next._status !== 'published') return data
  if (next.enableVariants === true) {
    const id = idOf(originalDoc?.id)
    if (id == null || !(await hasVariant(req, id))) reject(req, 'enableVariants')
  } else if (!validPrice(next)) reject(req, 'priceInARS')
  return data
}

async function protectParent(req: PayloadRequest, original: Item, next?: Item) {
  const parentId = idOf(original.product)
  const variantId = idOf(original.id)
  if (
    parentId == null ||
    variantId == null ||
    original._status !== 'published' ||
    !validPrice(original)
  )
    return
  if (
    next &&
    String(idOf(next.product)) === String(parentId) &&
    next._status === 'published' &&
    validPrice(next)
  )
    return
  // Privileged reads enforce an invariant; collection access still authorizes the mutation.
  const parent = await req.payload.findByID({
    collection: 'products',
    id: parentId,
    req,
    overrideAccess: true,
    depth: 0,
    draft: false,
  })
  if (
    parent._status === 'published' &&
    parent.enableVariants &&
    !(await hasVariant(req, parentId, variantId))
  )
    reject(req, 'product')
}

export const protectPublishedVariant: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (originalDoc) await protectParent(req, originalDoc, { ...originalDoc, ...data })
  return data
}

export const protectDeletedVariant: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const original = await req.payload.findByID({
    collection: 'variants',
    id,
    req,
    overrideAccess: true,
    depth: 0,
    draft: false,
  })
  await protectParent(req, original)
}
