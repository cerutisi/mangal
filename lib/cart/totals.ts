import { MAX_QTY, type CartLine, type CatalogEntry } from './types'

/** Складывает количества одинаковых позиций и режет по потолку. */
export function mergeLine(lines: CartLine[], productId: string, qty: number): CartLine[] {
  const delta = Math.trunc(qty)
  if (delta <= 0) return lines
  const existing = lines.find((l) => l.productId === productId)
  if (!existing) return [...lines, { productId, qty: Math.min(delta, MAX_QTY) }]
  return lines.map((l) =>
    l.productId === productId ? { ...l, qty: Math.min(l.qty + delta, MAX_QTY) } : l,
  )
}

export function setLineQty(lines: CartLine[], productId: string, qty: number): CartLine[] {
  const next = Math.trunc(qty)
  if (next <= 0) return lines.filter((l) => l.productId !== productId)
  return lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(next, MAX_QTY) } : l))
}

/**
 * Отбрасывает позиции, которых больше нет в каталоге.
 * Товар могли удалить или снять с публикации, пока корзина лежала в localStorage.
 */
export function pruneLines(lines: CartLine[], catalog: CatalogEntry[]): CartLine[] {
  const known = new Set(catalog.map((p) => p.id))
  return lines.filter((l) => known.has(l.productId) && l.qty > 0)
}

export type ResolvedLine = CartLine & { product: CatalogEntry; sumMinor: number }

export function resolveLines(lines: CartLine[], catalog: CatalogEntry[]): ResolvedLine[] {
  const byId = new Map(catalog.map((p) => [p.id, p]))
  return lines.flatMap((line) => {
    const product = byId.get(line.productId)
    if (!product) return []
    return [{ ...line, product, sumMinor: product.priceMinor * line.qty }]
  })
}

export function cartTotals(lines: CartLine[], catalog: CatalogEntry[]) {
  const resolved = resolveLines(lines, catalog)
  return {
    lines: resolved,
    count: resolved.reduce((s, l) => s + l.qty, 0),
    totalMinor: resolved.reduce((s, l) => s + l.sumMinor, 0),
    currency: resolved[0]?.product.currency ?? 'PLN',
  }
}
