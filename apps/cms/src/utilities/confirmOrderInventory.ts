import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'
import type { Order, Product } from '../payload-types'
import {
  configuredVariantTypes,
  hasCompleteVariantOptions,
  relationID,
} from '../collections/sellableItems'
import { inventoryLines, TransferConfirmationError } from './transferConfirmationPolicy'

function snapshotItems(value: unknown) {
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items))
    throw new TransferConfirmationError('catalog')
  return value.items as unknown[]
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TransferConfirmationError('catalog')
  return value as Record<string, unknown>
}

function cents(value: unknown) {
  const money = record(value)
  if (
    money.currencyCode !== 'ARS' ||
    typeof money.amount !== 'string' ||
    !/^\d+(\.\d{1,2})?$/.test(money.amount)
  )
    throw new TransferConfirmationError('catalog')
  const amount = Math.round(Number(money.amount) * 100)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new TransferConfirmationError('catalog')
  return amount
}

export function quotedInventory(
  order: Pick<Order, 'items' | 'commercialSnapshot' | 'amount' | 'currency'>,
) {
  const lines = inventoryLines(order.items)
  const quoted = new Map<string, { quantity: number; price: number; sku: string }>()
  let total = 0
  for (const raw of snapshotItems(order.commercialSnapshot)) {
    const item = record(raw)
    const product = Number(item.productId)
    const merchandise = String(item.merchandiseId)
    const line = lines.find(
      (candidate) =>
        candidate.product === product &&
        (candidate.collection === 'products'
          ? [`product:${product}`, String(product)].includes(merchandise)
          : [
              `variant:${candidate.id}`,
              `${product}:${candidate.id}`,
              String(candidate.id),
            ].includes(merchandise)),
    )
    if (
      !line ||
      typeof item.sku !== 'string' ||
      !item.sku ||
      !Number.isSafeInteger(item.quantity) ||
      Number(item.quantity) <= 0
    )
      throw new TransferConfirmationError('catalog')
    const key = `${line.collection}:${line.id}`
    const price = cents(item.unitPrice)
    const quantity = Number(item.quantity)
    if (cents(item.total) !== price * quantity) throw new TransferConfirmationError('catalog')
    const previous = quoted.get(key)
    if (previous && (previous.price !== price || previous.sku !== item.sku))
      throw new TransferConfirmationError('catalog')
    quoted.set(key, { quantity: (previous?.quantity ?? 0) + quantity, price, sku: item.sku })
    total += price * quantity
  }
  if (!Number.isSafeInteger(total) || total !== order.amount || order.currency !== 'ARS')
    throw new TransferConfirmationError('catalog')
  return lines.map((line) => {
    const quote = quoted.get(`${line.collection}:${line.id}`)
    if (!quote || quote.quantity !== line.quantity) throw new TransferConfirmationError('catalog')
    return { ...line, price: quote.price, sku: quote.sku }
  })
}

export async function confirmOrderInventory(
  req: PayloadRequest,
  transaction: PostgresAdapter['drizzle'],
  order: Order,
) {
  const lines = quotedInventory(order)
  const parents = new Map<number, Product>()
  for (const productID of [...new Set(lines.map((line) => line.product))].sort(
    (left, right) => left - right,
  )) {
    await transaction.execute(sql`SELECT id FROM products WHERE id = ${productID} FOR UPDATE`)
    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      req,
      depth: 0,
      overrideAccess: true,
      draft: false,
    })
    const latest = await req.payload.findByID({
      collection: 'products',
      id: productID,
      req,
      depth: 0,
      overrideAccess: true,
      draft: true,
    })
    if (
      product._status !== 'published' ||
      latest._status !== 'published' ||
      latest.inventory !== product.inventory ||
      latest.priceInARS !== product.priceInARS ||
      latest.lifecycleStatus !== product.lifecycleStatus ||
      product.lifecycleStatus === 'discontinued' ||
      product.deletedAt
    )
      throw new TransferConfirmationError('catalog')
    parents.set(productID, product)
  }
  const movements = []
  for (const line of lines) {
    const product = parents.get(line.product)
    if (!product || Boolean(product.enableVariants) !== (line.collection === 'variants'))
      throw new TransferConfirmationError('catalog')
    if (line.collection === 'variants')
      await transaction.execute(sql`SELECT id FROM variants WHERE id = ${line.id} FOR UPDATE`)
    const item =
      line.collection === 'products'
        ? product
        : await req.payload.findByID({
            collection: 'variants',
            id: line.id,
            req,
            depth: 1,
            overrideAccess: true,
            draft: false,
          })
    const latest =
      line.collection === 'products'
        ? item
        : await req.payload.findByID({
            collection: 'variants',
            id: line.id,
            req,
            depth: 0,
            overrideAccess: true,
            draft: true,
          })
    if (
      item._status !== 'published' ||
      latest._status !== 'published' ||
      latest.inventory !== item.inventory ||
      latest.priceInARS !== item.priceInARS ||
      latest.lifecycleStatus !== item.lifecycleStatus ||
      item.lifecycleStatus === 'discontinued' ||
      item.deletedAt ||
      item.sku !== line.sku ||
      item.priceInARSEnabled !== true ||
      item.priceInARS !== line.price
    )
      throw new TransferConfirmationError('catalog')
    if ('product' in item) {
      if (relationID(item.product) !== line.product) throw new TransferConfirmationError('catalog')
      const actual = (item.options ?? []).map((option) =>
        typeof option === 'object' && option ? String(relationID(option.variantType)) : '',
      )
      if (!hasCompleteVariantOptions(configuredVariantTypes(product.variantTypes), actual))
        throw new TransferConfirmationError('catalog')
    }
    if (
      !Number.isSafeInteger(item.inventory) ||
      Number(item.inventory) < line.quantity ||
      (item.oneOfAKind && line.quantity > 1)
    )
      throw new TransferConfirmationError('stock')
    const before = Number(item.inventory)
    const after = before - line.quantity
    await req.payload.update({
      collection: line.collection,
      id: line.id,
      data: { inventory: after },
      req,
      overrideAccess: true,
    })
    movements.push({
      collection: line.collection,
      itemID: line.id,
      quantity: -line.quantity,
      before,
      after,
      idempotencyKey: `transfer:${order.id}:${line.collection}:${line.id}`,
    })
  }
  return { movements, products: [...parents.values()].map((product) => ({ slug: product.slug })) }
}
