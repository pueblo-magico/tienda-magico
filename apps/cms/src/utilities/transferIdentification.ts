export function normalizeTransferIdentification(
  value: unknown,
): { type: string; number: string } | null {
  if (!value || typeof value !== 'object') return null
  const { type, number } = value as Record<string, unknown>
  if (typeof type !== 'string' || typeof number !== 'string' || number.length > 32) return null
  const normalizedType = type.trim().toUpperCase()
  if (!['DNI', 'CUIT', 'CUIL'].includes(normalizedType) || !/^[\d.\s-]+$/.test(number)) return null
  const normalizedNumber = number.replace(/[.\s-]/g, '')
  const valid =
    normalizedType === 'DNI'
      ? /^\d{6,9}$/.test(normalizedNumber)
      : /^\d{11}$/.test(normalizedNumber)
  return valid ? { type: normalizedType, number: normalizedNumber } : null
}
