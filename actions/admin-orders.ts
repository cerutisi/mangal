'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { orderStatusSchema } from '@/lib/validation'
import { requireSession } from '@/lib/auth/current-user'

export type OrderActionResult = { ok: true } | { ok: false; message: string }

export async function updateOrder(input: unknown): Promise<OrderActionResult> {
  await requireSession()

  const parsed = orderStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Некорректные данные' }
  }

  const { orderId, status, managerNote } = parsed.data

  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!existing) return { ok: false, message: 'Заявка не найдена' }

  await db
    .update(orders)
    .set({ status, managerNote: managerNote || null, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(orders.id, orderId))

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true }
}
