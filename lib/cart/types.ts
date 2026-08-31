/** Корзина на клиенте хранит только id и количество. Цены — на сервере. */
export type CartLine = { productId: string; qty: number }

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
}

export const MAX_QTY = 99
export const MAX_LINES = 20
