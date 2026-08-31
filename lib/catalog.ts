import 'server-only'
import { unstable_cache } from 'next/cache'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import type { CatalogEntry } from '@/lib/cart/types'

export const PRODUCTS_TAG = 'products'

/** Полные карточки для витрины, в порядке слотов арсенала. */
export const getActiveProducts = unstable_cache(
  async () =>
    db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.slotIndex)),
  ['active-products'],
  { tags: [PRODUCTS_TAG], revalidate: 60 },
)

/** Урезанный срез для HUD-корзины: она не должна тянуть описания и характеристики. */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  const rows = await getActiveProducts()
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    priceMinor: p.priceMinor,
    currency: p.currency,
    spriteUrl: p.spriteUrl,
    spriteAlt: p.spriteAlt,
    inStock: p.inStock,
  }))
}

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
    return row ?? null
  },
  ['product-by-slug'],
  { tags: [PRODUCTS_TAG], revalidate: 60 },
)
