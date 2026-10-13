export type ScaledNumberFormat = {
  scale: number
  suffix?: string
}

function normalizedDecimal(value: string): string | null {
  const cleaned = value.trim().replace(/[%\s]/g, '')
  if (!cleaned) return ''
  if (!/^[0-9.,]+$/.test(cleaned)) return null

  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')
  const decimalIndex = Math.max(lastDot, lastComma)
  if (decimalIndex === -1) return cleaned

  const separator = cleaned[decimalIndex]
  const hasBothSeparators = lastDot !== -1 && lastComma !== -1
  const separatorCount = [...cleaned].filter((character) => character === separator).length
  const trailingDigits = cleaned.length - decimalIndex - 1
  if (!hasBothSeparators && trailingDigits === 3) return cleaned.replace(/[.,]/g, '')
  if (!hasBothSeparators && separatorCount > 1 && trailingDigits > 2)
    return cleaned.replace(/[.,]/g, '')

  const integerPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, '')
  const decimalPart = cleaned.slice(decimalIndex + 1)
  if (decimalPart.length > 2 || /[.,]/.test(decimalPart)) return null
  return `${integerPart || '0'}.${decimalPart}`
}

export function parseScaledNumberInput(value: string, scale: number): number | null | undefined {
  const normalized = normalizedDecimal(value)
  if (normalized == null) return undefined
  if (normalized === '') return null
  const major = Number(normalized)
  const scaled = major * scale
  return Number.isFinite(scaled) && scaled > 0 && Number.isSafeInteger(scaled) ? scaled : undefined
}

export function formatScaledNumberInput(
  value: number | null | undefined,
  { scale, suffix = '' }: ScaledNumberFormat,
): string {
  if (value == null || !Number.isSafeInteger(value)) return ''
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value / scale)
  return suffix ? `${formatted}${suffix}` : formatted
}
