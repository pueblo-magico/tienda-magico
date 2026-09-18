export class TransferConfirmationError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

export function confirmationInput(value: unknown) {
  if (!value || typeof value !== 'object') throw new TransferConfirmationError('invalid')
  const input = value as Record<string, unknown>
  if (
    typeof input.reference !== 'string' ||
    !/^[a-zA-Z0-9_-]{3,100}$/.test(input.reference.trim()) ||
    !Number.isSafeInteger(input.amount) ||
    Number(input.amount) <= 0 ||
    input.received !== true
  ) {
    throw new TransferConfirmationError('invalid')
  }
  return {
    reference: input.reference.trim().toUpperCase(),
    amount: Number(input.amount),
    acceptLate: input.acceptLate === true,
  }
}

export function validateTransfer(
  order: {
    paymentMethod?: string | null
    paymentStatus?: string | null
    status?: string | null
    amount?: number | null
    currency?: string | null
    paymentExpiresAt?: string | null
  },
  input: ReturnType<typeof confirmationInput>,
  now: number,
) {
  if (
    order.paymentMethod !== 'bank-transfer' ||
    order.status !== 'processing' ||
    !['pending', 'unverified'].includes(order.paymentStatus ?? '')
  )
    throw new TransferConfirmationError('state')
  if (order.currency !== 'ARS' || order.amount !== input.amount)
    throw new TransferConfirmationError('amount')
  const deadline = Date.parse(order.paymentExpiresAt ?? '')
  if (!Number.isFinite(deadline)) throw new TransferConfirmationError('invalid')
  const late = deadline <= now
  if (late && !input.acceptLate) throw new TransferConfirmationError('late')
  return late
}

export function inventoryLines(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) throw new TransferConfirmationError('items')
  const lines = new Map<
    string,
    { collection: 'products' | 'variants'; id: number; product: number; quantity: number }
  >()
  for (const item of items) {
    if (
      !item ||
      typeof item !== 'object' ||
      !Number.isSafeInteger(item.product) ||
      item.product <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    )
      throw new TransferConfirmationError('items')
    const collection = item.variant == null ? 'products' : 'variants'
    const id = item.variant ?? item.product
    if (!Number.isSafeInteger(id) || id <= 0) throw new TransferConfirmationError('items')
    const key = `${collection}:${id}`
    const previous = lines.get(key)
    if (previous && previous.product !== item.product) throw new TransferConfirmationError('items')
    const quantity = (previous?.quantity ?? 0) + item.quantity
    if (!Number.isSafeInteger(quantity)) throw new TransferConfirmationError('items')
    lines.set(key, { collection, id, product: item.product, quantity })
  }
  return [...lines.values()].sort((left, right) =>
    `${left.collection}:${left.id}`.localeCompare(`${right.collection}:${right.id}`),
  )
}
