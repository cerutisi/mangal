import { beerPriceMinor, beerTitle, bottleDataUrl, beerStats, formatAbv } from '@/lib/brewery/recipe'
import { BEER_CURRENCY } from '@/lib/brewery/ingredients'
import { MAX_QTY, type CartLine, type CatalogEntry } from './types'

/** Складывает количества одинаковых позиций и режет по потолку. */
export function mergeLine(
  lines: CartLine[],
  productId: string,
  qty: number,
  recipe?: CartLine['recipe'],
): CartLine[] {
  const delta = Math.trunc(qty)
  if (delta <= 0) return lines
  const existing = lines.find((l) => l.productId === productId)
  if (!existing) {
    return [...lines, { productId, qty: Math.min(delta, MAX_QTY), ...(recipe ? { recipe } : {}) }]
  }
  return lines.map((l) =>
    l.productId === productId ? { ...l, qty: Math.min(l.qty + delta, MAX_QTY) } : l,
  )
}

export function setLineQty(lines: CartLine[], productId: string, qty: number): CartLine[] {
  const next = Math.trunc(qty)
  if (next <= 0) return lines.filter((l) => l.productId !== productId)
  return lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(next, MAX_QTY) } : l))
}

export type ResolvedLine = CartLine & { product: CatalogEntry; sumMinor: number }

/** Пиво собирается в запись каталога из рецепта: так его рисуют те же компоненты */
function beerEntry(line: CartLine): CatalogEntry | null {
  if (!line.recipe) return null
  try {
    const stats = beerStats(line.recipe)
    return {
      id: line.productId,
      slug: '',
      href: '/brewery',
      title: beerTitle(line.recipe),
      priceMinor: beerPriceMinor(line.recipe),
      currency: BEER_CURRENCY,
      spriteUrl: bottleDataUrl(line.recipe),
      spriteAlt: `Бутылка пива «${line.recipe.name}», ${stats.style.toLowerCase()}, ${formatAbv(stats.abv)}`,
      inStock: true,
    }
  } catch {
    // Сырьё могли убрать из справочника — строку прячем, но не удаляем
    return null
  }
}

/**
 * Позиции, которые можно показать: те, что есть в каталоге страницы.
 *
 * Неизвестные позиции только скрываются, но из корзины НЕ удаляются.
 * Каталог приходит со страницы и может быть устаревшим — например, статическая
 * страница собрана, когда база была пустой. Если удалять по нему, одна такая
 * страница стирает корзину целиком. Авторитет по наличию — сервер при заказе.
 */
export function resolveLines(lines: CartLine[], catalog: CatalogEntry[]): ResolvedLine[] {
  const byId = new Map(catalog.map((p) => [p.id, p]))
  return lines.flatMap((line) => {
    const product = line.recipe ? beerEntry(line) : byId.get(line.productId)
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
    hasBeer: resolved.some((l) => l.recipe),
  }
}
