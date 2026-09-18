type TransferMatch = {
  payerType: string
  payerNumber: string
  amount: number
  currency: string
  publicReference: string | null
  approvedAt: string
}
type Candidate = {
  id: number
  transferIdentification?: unknown
  amount?: number | null
  currency?: string | null
  publicReference?: string | null
  createdAt: string
  paymentExpiresAt?: string | null
  paymentMethod?: string | null
}
export function selectTransferOrder(orders: Candidate[], payment: TransferMatch): number | null {
  const paidAt = Date.parse(payment.approvedAt)
  const matches = orders.filter((order) => {
    const identity = order.transferIdentification
    return (
      identity !== null &&
      typeof identity === 'object' &&
      'type' in identity &&
      identity.type === payment.payerType &&
      'number' in identity &&
      identity.number === payment.payerNumber &&
      order.paymentMethod === 'bank-transfer' &&
      order.amount === payment.amount &&
      order.currency === payment.currency &&
      (!payment.publicReference || order.publicReference === payment.publicReference) &&
      paidAt >= Date.parse(order.createdAt) &&
      paidAt < Date.parse(order.paymentExpiresAt ?? '')
    )
  })
  return matches.length === 1 ? matches[0].id : null
}
