import type { CollectionBeforeValidateHook } from 'payload'

function relationKey(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null
  }
  return null
}

export const normalizeProductCategories: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  const primary = relationKey(data.category)
  const seen = new Set(primary ? [primary] : [])

  data.additionalCategories = Array.isArray(data.additionalCategories)
    ? data.additionalCategories.filter((category: unknown) => {
        const key = relationKey(category)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    : []

  return data
}
