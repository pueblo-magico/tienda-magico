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

  if (!parentId) return data
  if (categoryId && String(parentId) === String(categoryId)) {
    throw new Error(
      req.locale === 'es'
        ? 'Una categoría no puede ser su propia categoría superior.'
        : 'A category cannot be its own parent.',
    )
  }

  const visited = new Set(categoryId ? [String(categoryId)] : [])
  let ancestorCount = 0
  while (parentId) {
    const key = String(parentId)
    if (visited.has(key)) {
      throw new Error(
        req.locale === 'es'
          ? 'Esta categoría superior generaría un ciclo.'
          : 'This parent would create a category cycle.',
      )
    }
    visited.add(key)
    ancestorCount += 1
    if (ancestorCount >= 3) {
      throw new Error(
        req.locale === 'es'
          ? 'Las categorías pueden tener como máximo tres niveles.'
          : 'Categories can have at most three levels.',
      )
    }

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
