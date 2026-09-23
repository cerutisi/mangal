import type { BeerRecipe } from '@/lib/brewery/recipe'

/**
 * Корзина на клиенте хранит только id и количество. Цены — на сервере.
 * Исключение — пиво из пивоварни: у него нет строки в каталоге, поэтому
 * строка несёт рецепт, а цену по рецепту сервер пересчитывает сам.
 */
export type CartLine = { productId: string; qty: number; recipe?: BeerRecipe }

/** Минимум данных о товаре, нужный HUD-корзине для отрисовки. */
export type CatalogEntry = {
  id: string
  slug: string
  title: string
  priceMinor: number
  currency: string
  spriteUrl: string
  spriteAlt: string
  inStock: boolean
  /** Куда ведёт строка корзины. По умолчанию — карточка товара */
  href?: string
}

export const MAX_QTY = 99
export const MAX_LINES = 20
