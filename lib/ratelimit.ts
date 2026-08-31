import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, eq, gt, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rateEvents } from '@/lib/db/schema'

export type RateResult = { allowed: boolean; retryAfterSec: number }

/** Сколько событий в корзине за окно. Ничего не пишет — только считает. */
export async function countEvents(bucket: string, windowSec: number): Promise<number> {
  const since = Math.floor(Date.now() / 1000) - windowSec
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rateEvents)
    .where(and(eq(rateEvents.bucket, bucket), gt(rateEvents.createdAt, since)))
  return row?.count ?? 0
}

export async function recordEvent(bucket: string): Promise<void> {
  await db.insert(rateEvents).values({ id: randomUUID(), bucket })
}

/**
 * Скользящее окно на таблице событий. Для одного-двух инстансов этого достаточно;
 * при горизонтальном масштабировании сюда встанет Redis без смены сигнатуры.
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<RateResult> {
  const now = Math.floor(Date.now() / 1000)
  const since = now - windowSec

  // Чистим протухшее, иначе таблица растёт вечно
  await db.delete(rateEvents).where(lt(rateEvents.createdAt, since))

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rateEvents)
    .where(and(eq(rateEvents.bucket, bucket), gt(rateEvents.createdAt, since)))

  if ((row?.count ?? 0) >= limit) {
    return { allowed: false, retryAfterSec: windowSec }
  }

  await db.insert(rateEvents).values({ id: randomUUID(), bucket, createdAt: now })
  return { allowed: true, retryAfterSec: 0 }
}

/** IP из заголовков прокси. Отсутствие заголовка — не повод пропускать лимит. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
