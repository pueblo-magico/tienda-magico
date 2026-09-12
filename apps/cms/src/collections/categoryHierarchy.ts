import type { CollectionBeforeChangeHook } from 'payload'

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

export const preventCategoryCycles: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const categoryId = relationId(originalDoc?.id)
  let parentId = relationId(data.parent)

  if (!parentId || !categoryId) return data
  if (String(parentId) === String(categoryId)) {
    throw new Error(
      req.locale === 'en'
        ? 'A category cannot be its own parent.'
        : 'Una categoría no puede ser su propia categoría superior.',
    )
  }

  const visited = new Set([String(categoryId)])
  while (parentId) {
    const key = String(parentId)
    if (visited.has(key)) {
      throw new Error(
        req.locale === 'en'
          ? 'This parent would create a category cycle.'
          : 'Esta categoría superior generaría un ciclo.',
      )
    }
    visited.add(key)

    const parent = await req.payload.findByID({
      collection: 'categories',
      id: parentId,
      depth: 0,
      req,
    })
    parentId = relationId((parent as { parent?: unknown }).parent)
  }

  return data
}
