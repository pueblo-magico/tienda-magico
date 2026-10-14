import type { PayloadRequest } from 'payload'

export type SupplierFinanceEventInput = {
  eventKey: string
  eventType:
    | 'payout_prepared'
    | 'submission_started'
    | 'submitted'
    | 'provider_status_checked'
    | 'succeeded'
    | 'failed'
    | 'reconciliation_required'
    | 'manual_reconciled'
    | 'partial_payment'
  supplier: number
  settlement: number
  payout: number
  provider: 'mercado-pago' | 'manual'
  amountMinor: number
  appliedMinor: number
  outstandingAfterMinor: number
  receivedMinor?: number
  feeMinor: number
  feeResponsibility: 'store' | 'supplier' | 'unknown'
  currency: 'ARS'
  previousStatus?: string
  nextStatus: string
  actor?: number
  occurredAt: string
  correlationKey: string
  externalReference?: string
  reason?: string
}

export async function appendSupplierFinanceEvent(
  req: Pick<PayloadRequest, 'payload' | 'transactionID'>,
  input: SupplierFinanceEventInput,
): Promise<void> {
  const existing = await req.payload.find({
    collection: 'supplier-finance-events',
    where: { eventKey: { equals: input.eventKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req: req as PayloadRequest,
  })
  if (existing.docs.length > 0) return

  await req.payload.create({
    collection: 'supplier-finance-events',
    data: {
      eventKey: input.eventKey,
      eventType: input.eventType,
      supplier: input.supplier,
      settlement: input.settlement,
      payout: input.payout,
      provider: input.provider,
      amountMinor: input.amountMinor,
      appliedMinor: input.appliedMinor,
      outstandingAfterMinor: input.outstandingAfterMinor,
      receivedMinor: input.receivedMinor,
      feeMinor: input.feeMinor,
      feeResponsibility: input.feeResponsibility,
      currency: input.currency,
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      actor: input.actor,
      occurredAt: input.occurredAt,
      correlationKey: input.correlationKey,
      externalReference: input.externalReference,
      reason: input.reason,
    },
    overrideAccess: true,
    req: req as PayloadRequest,
  })
}
