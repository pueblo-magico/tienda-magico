import { sql } from '@payloadcms/db-postgres'
import { APIError, ValidationError } from 'payload'
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'

import { canManagePurchasing, purchasingFinanceAccess } from '../access/purchasingFinanceAccess'
import { activeTransaction } from '../utilities/transferWriteLock'
import {
  agreementPeriodsOverlap,
  applyAgreementTransition,
  commercialTermsFields,
  resolveEffectiveCommercialTerms,
  type AgreementLifecycle,
  type CommercialTerms,
} from './commercialAgreements'

type Relation = number | string | { id?: number | string } | null | undefined

type AgreementScope = 'supplier' | 'product' | 'variant'

type AgreementResolutionInput = {
  supplier: Relation
  product?: Relation
  variant?: Relation
  effectiveAt: string | Date
}

export type EffectiveSupplierAgreement =
  | { kind: 'resolved'; scope: AgreementScope; agreement: AgreementLifecycle }
  | { kind: 'ambiguous'; scope: AgreementScope; agreements: AgreementLifecycle[] }
  | { kind: 'missing' }

type ProductAgreementData = {
  id?: Relation
  _status?: string | null
  supplier?: Relation
  termsOverride?: CommercialTerms | null
  [key: string]: unknown
}

function relationID(value: Relation): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  return value?.id ?? null
}

function sameRelation(left: Relation, right: Relation): boolean {
  return String(relationID(left) ?? '') === String(relationID(right) ?? '')
}

function isEffectiveAt(terms: CommercialTerms | null | undefined, timestamp: number): boolean {
  const from = terms?.effectiveFrom ? Date.parse(terms.effectiveFrom) : Number.NEGATIVE_INFINITY
  const to = terms?.effectiveTo ? Date.parse(terms.effectiveTo) : Number.POSITIVE_INFINITY
  return Number.isFinite(timestamp) && from <= timestamp && timestamp < to
}

export function selectEffectiveSupplierAgreement(
  agreements: AgreementLifecycle[],
  input: AgreementResolutionInput,
): EffectiveSupplierAgreement {
  const timestamp =
    input.effectiveAt instanceof Date ? input.effectiveAt.getTime() : Date.parse(input.effectiveAt)
  if (!Number.isFinite(timestamp)) fieldError('La fecha de resolución no es válida.', 'effectiveAt')

  const applicable = agreements.filter(
    (agreement) =>
      sameRelation(agreement.supplier as Relation, input.supplier) &&
      agreement.status !== 'draft' &&
      isEffectiveAt(agreement.terms, timestamp),
  )
  const scopes: Array<{ scope: AgreementScope; matches: AgreementLifecycle[] }> = [
    {
      scope: 'variant',
      matches: input.variant
        ? applicable.filter((agreement) =>
            sameRelation(agreement.variant as Relation, input.variant),
          )
        : [],
    },
    {
      scope: 'product',
      matches: input.product
        ? applicable.filter(
            (agreement) =>
              !relationID(agreement.variant as Relation) &&
              sameRelation(agreement.product as Relation, input.product),
          )
        : [],
    },
    {
      scope: 'supplier',
      matches: applicable.filter(
        (agreement) =>
          !relationID(agreement.product as Relation) && !relationID(agreement.variant as Relation),
      ),
    },
  ]

  for (const { scope, matches } of scopes) {
    if (matches.length === 1) return { kind: 'resolved', scope, agreement: matches[0] }
    if (matches.length > 1) return { kind: 'ambiguous', scope, agreements: matches }
  }
  return { kind: 'missing' }
}

export async function resolveEffectiveSupplierAgreement(
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  input: AgreementResolutionInput,
): Promise<EffectiveSupplierAgreement> {
  const supplier = relationID(input.supplier)
  if (supplier == null) return { kind: 'missing' }
  const result = await req.payload.find({
    collection: 'supplier-agreements',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { supplier: { equals: supplier } },
        { status: { in: ['active', 'expired', 'terminated'] } },
      ],
    },
  })
  return selectEffectiveSupplierAgreement(result.docs as unknown as AgreementLifecycle[], input)
}

export async function validateProductAgreementCoverage({
  data,
  originalDoc,
  req,
}: Parameters<CollectionBeforeChangeHook>[0]) {
  if (!data) return data
  const current: ProductAgreementData = { ...(originalDoc ?? {}), ...data }
  if (current._status !== 'published' || !current.supplier) return data

  const resolution = await resolveEffectiveSupplierAgreement(req, {
    supplier: current.supplier,
    product: current.id,
    effectiveAt: new Date(),
  })
  if (resolution.kind === 'resolved') return data
  if (resolution.kind === 'ambiguous')
    fieldError(
      'Hay más de un acuerdo contractual vigente para este producto. Resolvé la superposición antes de publicar.',
      'supplier',
    )

  const populatedSupplier =
    current.supplier && typeof current.supplier === 'object' && 'defaultTerms' in current.supplier
      ? current.supplier
      : await req.payload.findByID({
          collection: 'suppliers',
          id: relationID(current.supplier)!,
          depth: 0,
          overrideAccess: true,
          req,
        })
  try {
    resolveEffectiveCommercialTerms(
      current.termsOverride,
      (populatedSupplier as { defaultTerms?: CommercialTerms | null }).defaultTerms,
      new Date(),
    )
    return data
  } catch {
    fieldError(
      'No existe un acuerdo contractual vigente para este producto. Creá y activá una revisión antes de publicar.',
      'supplier',
    )
  }
}

const endpointResponse = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function queryRelation(value: string | null): string | null {
  if (!value || value.length > 100 || !/^[A-Za-z0-9_-]+$/.test(value)) return null
  return value
}

async function effectiveAgreementEndpoint(req: PayloadRequest) {
  if (!canManagePurchasing(req.user)) return endpointResponse({ code: 'forbidden' }, 403)
  const url = new URL(req.url ?? req.payload.config.serverURL)
  const supplier = queryRelation(url.searchParams.get('supplier'))
  const product = queryRelation(url.searchParams.get('product'))
  const variant = queryRelation(url.searchParams.get('variant'))
  if (!supplier) return endpointResponse({ code: 'invalidSupplier' }, 400)

  const resolution = await resolveEffectiveSupplierAgreement(req, {
    supplier,
    product,
    variant,
    effectiveAt: new Date(),
  })
  if (resolution.kind === 'ambiguous')
    return endpointResponse({ kind: 'ambiguous', scope: resolution.scope }, 409)
  if (resolution.kind === 'resolved') {
    const agreement = resolution.agreement as AgreementLifecycle & {
      id?: Relation
      reference?: string | null
    }
    return endpointResponse({
      kind: 'resolved',
      scope: resolution.scope,
      agreement: {
        id: relationID(agreement.id),
        reference: agreement.reference ?? null,
        revision: agreement.revision ?? null,
        mode: agreement.terms?.mode ?? null,
        effectiveFrom: agreement.terms?.effectiveFrom ?? null,
        effectiveTo: agreement.terms?.effectiveTo ?? null,
      },
    })
  }

  const supplierDocument = await req.payload.findByID({
    collection: 'suppliers',
    id: supplier,
    depth: 0,
    overrideAccess: true,
    req,
  })
  let productTerms: CommercialTerms | null | undefined = { mode: 'inherit' }
  if (product) {
    const productDocument = await req.payload.findByID({
      collection: 'products',
      id: product,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!sameRelation(productDocument.supplier as Relation, supplier))
      return endpointResponse({ code: 'supplierMismatch' }, 400)
    productTerms = productDocument.termsOverride as CommercialTerms | null | undefined
  }
  try {
    const legacy = resolveEffectiveCommercialTerms(
      productTerms,
      supplierDocument.defaultTerms as CommercialTerms | null | undefined,
      new Date(),
    )
    return endpointResponse({
      kind: 'legacy',
      scope: legacy.source === 'product' ? 'product' : 'supplier',
      terms: {
        mode: legacy.terms.mode ?? null,
        effectiveFrom: legacy.terms.effectiveFrom ?? null,
        effectiveTo: legacy.terms.effectiveTo ?? null,
      },
    })
  } catch {
    return endpointResponse({ kind: 'missing' }, 404)
  }
}

function fieldError(message: string, path: string): never {
  throw new ValidationError({ errors: [{ message, path }] })
}

async function validatePreviousRevision(
  agreement: AgreementLifecycle,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
) {
  if ((agreement.revision ?? 1) === 1) return
  const previousID = relationID(agreement.previousAgreement as Relation)
  if (!previousID) fieldError('Vinculá la revisión contractual anterior.', 'previousAgreement')
  const previous = (await req.payload.findByID({
    collection: 'supplier-agreements',
    id: previousID,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as AgreementLifecycle
  if (
    previous.revision !== (agreement.revision ?? 0) - 1 ||
    !sameRelation(previous.supplier as Relation, agreement.supplier as Relation) ||
    !sameRelation(previous.product as Relation, agreement.product as Relation) ||
    !sameRelation(previous.variant as Relation, agreement.variant as Relation)
  )
    fieldError(
      'La revisión anterior debe pertenecer al mismo proveedor y alcance, y ser consecutiva.',
      'previousAgreement',
    )
}

async function validateVariantScope(
  agreement: AgreementLifecycle,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
) {
  const variantID = relationID(agreement.variant as Relation)
  if (!variantID) return
  const variant =
    agreement.variant && typeof agreement.variant === 'object' && 'product' in agreement.variant
      ? agreement.variant
      : await req.payload.findByID({
          collection: 'variants',
          id: variantID,
          depth: 0,
          overrideAccess: true,
          req,
        })
  if (!sameRelation((variant as { product?: Relation }).product, agreement.product as Relation))
    fieldError('La variante seleccionada no pertenece al producto del acuerdo.', 'variant')
}

async function rejectDuplicateRevision(
  agreement: AgreementLifecycle,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  currentID?: number | string,
) {
  const supplierID = relationID(agreement.supplier as Relation)
  const productID = relationID(agreement.product as Relation)
  const variantID = relationID(agreement.variant as Relation)
  const transaction = await activeTransaction(req)
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-agreement:${String(supplierID)}:${String(productID ?? '*')}:${String(variantID ?? '*')}`}, 0))`,
  )
  const existing = await req.payload.find({
    collection: 'supplier-agreements',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: { supplier: { equals: supplierID } },
  })
  const duplicate = existing.docs.find((candidate) => {
    const other = candidate as unknown as AgreementLifecycle & { id?: Relation }
    return (
      !sameRelation(other.id, currentID) &&
      sameRelation(other.product as Relation, agreement.product as Relation) &&
      sameRelation(other.variant as Relation, agreement.variant as Relation) &&
      other.revision === agreement.revision
    )
  })
  if (duplicate)
    fieldError('Ya existe una revisión con ese número para el mismo alcance.', 'revision')
}

async function rejectOverlappingAgreement(
  agreement: AgreementLifecycle,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  currentID?: number | string,
) {
  const supplierID = relationID(agreement.supplier as Relation)
  const productID = relationID(agreement.product as Relation)
  const variantID = relationID(agreement.variant as Relation)
  const transaction = await activeTransaction(req)
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-agreement:${String(supplierID)}:${String(productID ?? '*')}:${String(variantID ?? '*')}`}, 0))`,
  )

  const active = await req.payload.find({
    collection: 'supplier-agreements',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { supplier: { equals: supplierID } },
        { status: { in: ['active', 'expired', 'terminated'] } },
        ...(currentID == null ? [] : [{ id: { not_equals: currentID } }]),
      ],
    },
  })
  const conflict = active.docs.find((candidate) => {
    const other = candidate as unknown as AgreementLifecycle
    return (
      sameRelation(other.product as Relation, agreement.product as Relation) &&
      sameRelation(other.variant as Relation, agreement.variant as Relation) &&
      agreementPeriodsOverlap(
        (other.terms ?? {}) as CommercialTerms,
        (agreement.terms ?? {}) as CommercialTerms,
      )
    )
  })
  if (conflict)
    fieldError(
      'Ya existe un acuerdo activo y vigente para este proveedor y alcance.',
      'terms.effectiveFrom',
    )
}

export const prepareSupplierAgreement: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const now = new Date().toISOString()
  const next = applyAgreementTransition({
    original: originalDoc as AgreementLifecycle | undefined,
    data: data as AgreementLifecycle,
    user: req.user,
    now,
  })
  await validateVariantScope(next, req)
  await validatePreviousRevision(next, req)
  const currentID = relationID((originalDoc as { id?: Relation } | undefined)?.id) ?? undefined
  await rejectDuplicateRevision(next, req, currentID)
  if (next.status === 'active' && originalDoc?.status !== 'active')
    await rejectOverlappingAgreement(next, req, currentID)
  return next
}

export const deleteDraftAgreementOnly: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const agreement = await req.payload.findByID({
    collection: 'supplier-agreements',
    id,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (agreement.status !== 'draft')
    throw new APIError(
      'Los acuerdos aprobados se conservan para auditoría y no se pueden eliminar.',
      409,
    )
}

export const SupplierAgreements: CollectionConfig = {
  slug: 'supplier-agreements',
  labels: {
    singular: { es: 'Acuerdo con proveedor', en: 'Supplier agreement' },
    plural: { es: 'Acuerdos con proveedores', en: 'Supplier agreements' },
  },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'supplier', 'product', 'variant', 'revision', 'status'],
    group: { es: 'Tienda', en: 'Shop' },
    description: {
      es: 'Revisiones privadas y auditables. Activá una nueva revisión en lugar de modificar términos aprobados.',
      en: 'Private auditable revisions. Activate a new revision instead of changing approved terms.',
    },
  },
  access: {
    create: purchasingFinanceAccess,
    delete: purchasingFinanceAccess,
    read: purchasingFinanceAccess,
    update: purchasingFinanceAccess,
  },
  lockDocuments: false,
  versions: { drafts: false, maxPerDoc: 100 },
  hooks: {
    beforeChange: [prepareSupplierAgreement],
    beforeDelete: [deleteDraftAgreementOnly],
  },
  endpoints: [{ path: '/effective', method: 'get', handler: effectiveAgreementEndpoint }],
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { es: 'Referencia contractual', en: 'Agreement reference' },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      index: true,
      label: { es: 'Proveedor', en: 'Supplier' },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      index: true,
      label: { es: 'Producto específico', en: 'Specific product' },
      admin: {
        description: {
          es: 'Dejalo vacío para un acuerdo predeterminado del proveedor.',
          en: 'Leave empty for a supplier default agreement.',
        },
      },
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'variants',
      index: true,
      label: { es: 'Variante específica', en: 'Specific variant' },
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.product),
      },
    },
    {
      name: 'revision',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      label: { es: 'Revisión', en: 'Revision' },
    },
    {
      name: 'previousAgreement',
      type: 'relationship',
      relationTo: 'supplier-agreements',
      label: { es: 'Revisión anterior', en: 'Previous revision' },
      admin: { condition: (_, siblingData) => Number(siblingData?.revision) > 1 },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: { es: 'Estado', en: 'Status' },
      options: [
        { label: { es: 'Borrador', en: 'Draft' }, value: 'draft' },
        { label: { es: 'Activo', en: 'Active' }, value: 'active' },
        { label: { es: 'Vencido', en: 'Expired' }, value: 'expired' },
        { label: { es: 'Terminado', en: 'Terminated' }, value: 'terminated' },
      ],
    },
    {
      name: 'terms',
      type: 'group',
      required: true,
      label: { es: 'Términos comerciales', en: 'Commercial terms' },
      fields: commercialTermsFields({ allowInherit: false }),
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: { es: 'Aprobado por', en: 'Approved by' },
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'approvedAt',
      type: 'date',
      label: { es: 'Fecha de aprobación', en: 'Approved at' },
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'terminatedAt',
      type: 'date',
      label: { es: 'Fecha de terminación', en: 'Terminated at' },
      admin: { readOnly: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'terminationReason',
      type: 'textarea',
      label: { es: 'Motivo de terminación', en: 'Termination reason' },
      admin: { condition: (_, siblingData) => siblingData?.status === 'terminated' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: { es: 'Notas privadas', en: 'Private notes' },
    },
  ],
}
