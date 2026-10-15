import { sql } from '@payloadcms/db-postgres'
import { APIError, type GlobalAfterChangeHook, type GlobalBeforeChangeHook } from 'payload'

import { activeTransaction } from './transferWriteLock'

type PolicyValues = {
  emergencyStop: boolean
  outboundProviderPaymentsEnabled: boolean
  automaticProviderPaymentsEnabled: boolean
}

function normalizedPolicy(doc: Record<string, unknown> | null | undefined): PolicyValues {
  return {
    emergencyStop: doc?.emergencyStop !== false,
    outboundProviderPaymentsEnabled: doc?.outboundProviderPaymentsEnabled === true,
    automaticProviderPaymentsEnabled: doc?.automaticProviderPaymentsEnabled === true,
  }
}

export const validateSupplierPayoutPolicy: GlobalBeforeChangeHook = ({ data, originalDoc }) => {
  const policy = normalizedPolicy({ ...originalDoc, ...data })
  if (
    policy.automaticProviderPaymentsEnabled &&
    (!policy.outboundProviderPaymentsEnabled || policy.emergencyStop)
  )
    throw new APIError(
      'Para habilitar la ejecución automática, habilitá los envíos y desactivá el freno de emergencia.',
      400,
    )
  return data
}

export const lockSupplierPayoutPolicy: GlobalBeforeChangeHook = async ({ data, req }) => {
  const transaction = await activeTransaction(req)
  await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended('supplier-payout-policy', 0))`,
  )
  return data
}

export const appendSupplierPayoutPolicyEvent: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const current = normalizedPolicy(doc)
  const previous = normalizedPolicy(previousDoc)
  if (
    current.emergencyStop === previous.emergencyStop &&
    current.outboundProviderPaymentsEnabled === previous.outboundProviderPaymentsEnabled &&
    current.automaticProviderPaymentsEnabled === previous.automaticProviderPaymentsEnabled
  )
    return doc

  const occurredAt = typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString()
  const eventKey = `supplier-payout-policy:${occurredAt}`
  const existing = await req.payload.find({
    collection: 'supplier-payout-policy-events',
    where: { eventKey: { equals: eventKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (existing.docs.length > 0) return doc

  await req.payload.create({
    collection: 'supplier-payout-policy-events',
    data: {
      eventKey,
      ...current,
      previousEmergencyStop: previous.emergencyStop,
      previousOutboundProviderPaymentsEnabled: previous.outboundProviderPaymentsEnabled,
      previousAutomaticProviderPaymentsEnabled: previous.automaticProviderPaymentsEnabled,
      actor: req.user?.id,
      occurredAt,
    },
    overrideAccess: true,
    req,
  })
  return doc
}
