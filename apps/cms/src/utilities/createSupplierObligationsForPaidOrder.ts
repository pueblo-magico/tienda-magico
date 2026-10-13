import type { CollectionAfterChangeHook } from 'payload'

import { resolveEffectiveSupplierAgreement } from '../collections/SupplierAgreements'
import type { CommercialTerms } from '../collections/commercialAgreements'
import { relationID } from '../collections/sellableItems'
import { deriveSupplierObligation } from '../lib/supplierFinance/orderObligations'

type SnapshotItem = {
  productId: string
  merchandiseId: string
  sku: string | null
  quantity: number
  total: { amount: string; currencyCode: string }
}

function snapshotItems(value: unknown): SnapshotItem[] {
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items))
    throw new Error('El pedido pagado no tiene un snapshot comercial válido.')
  return value.items as SnapshotItem[]
}

export const createSupplierObligationsForPaidOrder: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc.paymentStatus !== 'approved' || previousDoc?.paymentStatus === 'approved') return doc
  const lines = Array.isArray(doc.items) ? doc.items : []
  const snapshots = snapshotItems(doc.commercialSnapshot)
  if (lines.length !== snapshots.length)
    throw new Error('Las líneas del pedido no coinciden con su snapshot comercial.')
  const calculatedAt = new Date().toISOString()

  for (const [index, line] of lines.entries()) {
    const sourceKey = `order:${String(doc.id)}:line:${index}`
    const existing = await req.payload.find({
      collection: 'supplier-obligations',
      where: { sourceKey: { equals: sourceKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (existing.docs.length) continue
    const productID = relationID(line.product)
    const variantID = relationID(line.variant)
    if (productID == null) throw new Error('La línea pagada no referencia un producto válido.')
    const productRelation = Number(productID)
    const variantRelation = variantID == null ? null : Number(variantID)
    if (
      !Number.isSafeInteger(productRelation) ||
      productRelation <= 0 ||
      (variantRelation != null && (!Number.isSafeInteger(variantRelation) || variantRelation <= 0))
    )
      throw new Error('La línea pagada no referencia un producto o variante válida.')
    const product = await req.payload.findByID({
      collection: 'products',
      id: productRelation,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const supplierID = relationID(product.supplier)
    const supplierRelation = supplierID == null ? null : Number(supplierID)
    if (
      supplierRelation != null &&
      (!Number.isSafeInteger(supplierRelation) || supplierRelation <= 0)
    )
      throw new Error('El producto pagado no referencia un proveedor válido.')
    const resolution = await resolveEffectiveSupplierAgreement(req, {
      supplier: supplierRelation,
      product: productRelation,
      variant: variantRelation,
      effectiveAt: calculatedAt,
    })
    const agreement = resolution.kind === 'resolved' ? resolution.agreement : null
    const terms = (agreement?.terms ?? null) as CommercialTerms | null
    const snapshot = snapshots[index]
    const derived = deriveSupplierObligation({
      currency: snapshot.total.currencyCode,
      totalAmount: snapshot.total.amount,
      quantity: snapshot.quantity,
      terms,
    })
    if (derived.kind === 'none') continue
    const reviewReason =
      resolution.kind === 'ambiguous'
        ? 'ambiguous_agreement'
        : resolution.kind === 'missing'
          ? 'missing_agreement'
          : derived.kind === 'review'
            ? derived.reason
            : null
    await req.payload.create({
      collection: 'supplier-obligations',
      data: {
        sourceKey,
        order: doc.id,
        orderLine: index,
        product: productRelation,
        ...(variantRelation == null ? {} : { variant: variantRelation }),
        ...(supplierRelation == null ? {} : { supplier: supplierRelation }),
        ...(agreement?.id == null ? {} : { agreement: Number(relationID(agreement.id)) }),
        agreementRevision: agreement?.revision ?? null,
        status: derived.kind === 'eligible' && !reviewReason ? 'eligible' : 'held',
        currency: snapshot.total.currencyCode,
        eligibleBaseMinor: derived.eligibleBaseMinor,
        supplierAmountMinor: derived.kind === 'eligible' ? derived.supplierAmountMinor : null,
        storeAmountMinor: derived.kind === 'eligible' ? derived.storeAmountMinor : null,
        outstandingMinor: derived.kind === 'eligible' ? derived.supplierAmountMinor : null,
        reviewReason,
        calculatedAt,
        snapshot: {
          order: doc.id,
          orderLine: index,
          product: productRelation,
          variant: variantRelation,
          supplier: supplierRelation,
          sku: snapshot.sku,
          merchandiseId: snapshot.merchandiseId,
          quantity: snapshot.quantity,
          saleTotal: snapshot.total,
          agreement: agreement
            ? {
                id: relationID(agreement.id),
                reference: agreement.reference ?? null,
                revision: agreement.revision ?? null,
                terms,
              }
            : null,
          calculationVersion: 1,
        },
      },
      overrideAccess: true,
      req,
    })
  }
  return doc
}
