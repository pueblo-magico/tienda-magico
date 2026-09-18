export function arsPesosToMinorUnits(value: unknown): number | null {
  if (typeof value !== 'string' || !isWholePesos(value)) return null
  const amount = Number(value.replaceAll('.', '')) * 100
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null
}

export function formatArsPesos(value: string): string {
  if (!isWholePesos(value)) return value
  return groupDigits(value.replaceAll('.', ''))
}

function isWholePesos(value: string): boolean {
  return /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value)
}

function groupDigits(value: string): string {
  return value.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatArsEdit(
  value: string,
  selection: number,
  inputType: string,
  previousValue = '',
) {
  const editing = inputType === 'insertText' || inputType.startsWith('delete')
  const previousValid = previousValue === '' || isWholePesos(previousValue)
  const insertedSeparator =
    inputType === 'insertText' && value.replaceAll('.', '') === previousValue.replaceAll('.', '')
  const canGroup = editing && previousValid && !insertedSeparator && /^[\d.]*$/.test(value)
  const text = canGroup ? groupDigits(value.replaceAll('.', '')) : formatArsPesos(value)
  if (text === value) return { text, selection }
  const digitsBefore = value.slice(0, selection).replace(/\D/g, '').length
  let cursor = 0
  let digits = 0
  while (cursor < text.length && digits < digitsBefore) {
    if (/\d/.test(text[cursor])) digits++
    cursor++
  }
  return { text, selection: cursor }
}

export function formatArsInputElement(
  input: HTMLInputElement,
  inputType: string,
  previousValue = '',
) {
  const formatted = formatArsEdit(
    input.value,
    input.selectionStart ?? input.value.length,
    inputType,
    previousValue,
  )
  input.value = formatted.text
  input.setSelectionRange(formatted.selection, formatted.selection)
}
