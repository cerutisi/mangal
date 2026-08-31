'use server'

import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders, products } from '@/lib/db/schema'
import { createOrderSchema } from '@/lib/validation'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { formatOrderNumber, DELIVERY_LABELS } from '@/lib/orders'
import { getSettings } from '@/lib/settings.server'
import { sendOrderEmails, type OrderEmailData } from '@/lib/notify/email'
import { sendTelegramOrder } from '@/lib/notify/telegram'

export type CreateOrderResult =
  | { ok: true; number: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

/** Форму, заполненную быстрее двух секунд, заполнял не человек. */
const MIN_FILL_MS = 2000
const ORDER_LIMIT = 5
const ORDER_WINDOW_SEC = 60 * 60

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  const requestHeaders = await headers()
  const ip = clientIp(requestHeaders)

  const limit = await rateLimit(`order:${ip}`, ORDER_LIMIT, ORDER_WINDOW_SEC)
  if (!limit.allowed) {
    return {
      ok: false,
      message: 'С этого адреса уже отправлено пять заявок за час. Позвоните — так быстрее.',
    }
  }

  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.filter((p) => p !== 'fields').join('.')
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return {
      ok: false,
      message: 'Проверьте выделенные поля.',
      fieldErrors,
    }
  }

  const { fields, items, website, startedAt } = parsed.data

  // Honeypot и время заполнения — тихий отказ, боту не объясняем причину
  if (website.length > 0 || Date.now() - startedAt < MIN_FILL_MS) {
    return {
      ok: false,
      message: 'Заявка выглядит автоматической. Заполните форму ещё раз или позвоните нам.',
    }
  }

  const ids = items.map((i) => i.productId)
  const rows = await db.select().from(products).where(inArray(products.id, ids))
  const byId = new Map(rows.map((p) => [p.id, p]))

  const unavailable = items.filter((i) => {
    const product = byId.get(i.productId)
    return !product || !product.isActive || !product.inStock
  })

  if (unavailable.length > 0) {
    const names = unavailable
      .map((i) => byId.get(i.productId)?.title ?? 'позиция снята с продажи')
      .join(', ')
    return {
      ok: false,
      message: `Эти позиции больше недоступны: ${names}. Уберите их из корзины и отправьте заявку снова.`,
    }
  }

  // Сумма считается здесь и только здесь: клиентскому total веры нет
  const currency = byId.get(ids[0])!.currency
  const totalMinor = items.reduce((sum, i) => sum + byId.get(i.productId)!.priceMinor * i.qty, 0)

  const idempotencyKey = String(
    (input as { idempotencyKey?: unknown }).idempotencyKey ?? randomUUID(),
  ).slice(0, 64)

  const existing = await db
    .select({ number: orders.number })
    .from(orders)
    .where(sql`${orders.idempotencyKey} = ${idempotencyKey}`)
    .limit(1)

  if (existing.length > 0) {
    // Двойной сабмит: возвращаем тот же заказ, второй не создаём
    return { ok: true, number: existing[0].number }
  }

  const meta = {
    ip,
    userAgent: requestHeaders.get('user-agent'),
    referrer: requestHeaders.get('referer'),
  }

  const orderId = randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // Драйвер better-sqlite3 синхронный: колбэк транзакции не должен возвращать промис
  const number = db.transaction((tx) => {
    const [{ count }] = tx.select({ count: sql<number>`count(*)` }).from(orders).all()
    const orderNumber = formatOrderNumber(count + 1)

    tx.insert(orders).values({
      id: orderId,
      number: orderNumber,
      idempotencyKey,
      customerName: fields.customerName,
      phone: fields.phone,
      email: fields.email,
      comment: fields.comment || null,
      deliveryType: fields.deliveryType,
      address: fields.deliveryType === 'pickup' ? null : fields.address,
      status: 'new',
      totalMinor,
      currency,
      meta,
      createdAt: now,
      updatedAt: now,
    }).run()

    tx.insert(orderItems).values(
      items.map((i) => {
        const product = byId.get(i.productId)!
        return {
          id: randomUUID(),
          orderId,
          productId: product.id,
          titleSnapshot: product.title,
          priceMinorSnapshot: product.priceMinor,
          qty: i.qty,
        }
      }),
    ).run()

    return orderNumber
  })

  // Заказ уже сохранён. Всё, что ниже, не должно ронять ответ клиенту.
  const settings = await getSettings()
  const payload: OrderEmailData = {
    number,
    customerName: fields.customerName,
    phone: fields.phone,
    email: fields.email,
    comment: fields.comment || null,
    deliveryLabel: DELIVERY_LABELS[fields.deliveryType],
    address: fields.deliveryType === 'pickup' ? null : fields.address,
    totalMinor,
    currency,
    items: items.map((i) => {
      const product = byId.get(i.productId)!
      return { title: product.title, qty: i.qty, priceMinor: product.priceMinor }
    }),
    replyTime: settings.emails.replyTime,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
  }

  try {
    await Promise.all([
      sendOrderEmails(payload, {
        client: settings.emails.clientSubject,
        manager: settings.emails.managerSubject,
      }),
      sendTelegramOrder(payload),
    ])
  } catch (error) {
    console.error('[order] уведомления не отправлены, заказ сохранён', error)
  }

  return { ok: true, number }
}
