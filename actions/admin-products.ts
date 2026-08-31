'use server'

import { randomUUID } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { productSchema } from '@/lib/validation'
import { requireSession } from '@/lib/auth/current-user'
import { PRODUCTS_TAG } from '@/lib/catalog'

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

function collectErrors(error: import('zod').ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
  }
  return fieldErrors
}

/** Любое изменение товара переклеивает витрину. */
function refresh() {
  revalidateTag(PRODUCTS_TAG)
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  await requireSession()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: 'Проверьте поля формы', fieldErrors: collectErrors(parsed.error) }
  }

  const taken = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, parsed.data.slug))
    .limit(1)

  if (taken.length > 0) {
    return { ok: false, message: 'Такой слаг уже занят', fieldErrors: { slug: 'Слаг уже занят' } }
  }

  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(products).values({ ...parsed.data, id, createdAt: now, updatedAt: now })

  refresh()
  return { ok: true, id }
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  await requireSession()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: 'Проверьте поля формы', fieldErrors: collectErrors(parsed.error) }
  }

  const clash = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, parsed.data.slug))
    .limit(1)

  if (clash.length > 0 && clash[0].id !== id) {
    return { ok: false, message: 'Такой слаг уже занят', fieldErrors: { slug: 'Слаг уже занят' } }
  }

  await db
    .update(products)
    .set({ ...parsed.data, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(products.id, id))

  refresh()
  return { ok: true, id }
}

/** Мягкое удаление: товар исчезает с витрины, но остаётся в истории заказов. */
export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireSession()

  await db
    .update(products)
    .set({ isActive, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(products.id, id))

  refresh()
  return { ok: true, id }
}

/** Порядок слотов: массив id в новом порядке, слоты назначаются 1..N. */
export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  await requireSession()

  if (ids.length === 0) return { ok: true }
  if (ids.length > 9) {
    return { ok: false, message: 'Слотов на витрине только девять — остальное уберите в архив' }
  }

  const known = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, ids))

  if (known.length !== ids.length) {
    return { ok: false, message: 'Часть товаров не найдена, обновите страницу' }
  }

  const now = Math.floor(Date.now() / 1000)
  // Драйвер better-sqlite3 синхронный: колбэк транзакции не должен возвращать промис
  db.transaction((tx) => {
    for (const [index, id] of ids.entries()) {
      tx.update(products)
        .set({ slotIndex: index + 1, updatedAt: now })
        .where(eq(products.id, id))
        .run()
    }
  })

  refresh()
  return { ok: true }
}
