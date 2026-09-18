import type { CollectionBeforeChangeHook } from 'payload'

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

function maximumDepthError(locale: unknown) {
  return new Error(
    locale === 'es'
      ? 'Las categorías pueden tener como máximo tres niveles.'
      : 'Categories can have at most three levels.',
  )
}

async function descendantDepth(
  categoryId: string | number,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  visited = new Set<string>(),
): Promise<number> {
  const key = String(categoryId)
  if (visited.has(key)) return 0
  visited.add(key)

  const result = await req.payload.find({
    collection: 'categories',
    where: { parent: { equals: categoryId } },
    depth: 0,
    pagination: false,
    req,
  })
  const depths = await Promise.all(
    result.docs.map(async (child) => {
      const childId = relationId(child.id)
      return childId ? 1 + (await descendantDepth(childId, req, visited)) : 0
    }),
  )
  return depths.length ? Math.max(...depths) : 0
}

export const preventCategoryCycles: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const categoryId = relationId(originalDoc?.id)
  let parentId = relationId(data.parent === undefined ? originalDoc?.parent : data.parent)

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
      throw maximumDepthError(req.locale)
    }

    const parent = await req.payload.findByID({
      collection: 'categories',
      id: parentId,
      depth: 0,
      req,
    })
    parentId = relationId((parent as { parent?: unknown }).parent)
  }

  if (categoryId && typeof req.payload.find === 'function') {
    const childDepth = await descendantDepth(categoryId, req)
    if (ancestorCount + 1 + childDepth > 3) {
      throw maximumDepthError(req.locale)
    }
  }

  return data
}
