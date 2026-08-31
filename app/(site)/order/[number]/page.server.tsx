import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders } from '@/lib/db/schema'
import { formatMoney } from '@/lib/money'
import { formatPhone } from '@/lib/validation'
import { DELIVERY_LABELS } from '@/lib/orders'
import { getSettings } from '@/lib/settings.server'
import { PixelLink } from '@/components/ui/PixelButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Заявка принята',
  robots: { index: false },
}

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params

  const [order] = await db.select().from(orders).where(eq(orders.number, number)).limit(1)
  if (!order) notFound()

  const [items, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getSettings(),
  ])

  return (
    <main className="mx-auto max-w-3xl px-2 py-6">
      <p className="text-hud text-moss uppercase">Заявка принята</p>

      <h1 className="mt-1 text-hud-lg text-bone uppercase md:text-[48px] md:leading-[56px]">
        {order.number}
      </h1>

      <p className="mt-2 prose-column text-bone">
        {order.customerName}, менеджер свяжется {settings.emails.replyTime} по номеру{' '}
        <span className="text-coal">{formatPhone(order.phone)}</span>. Подтверждение продублировано
        на {order.email}.
      </p>

      <dl className="mt-4 bevel bg-surface p-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2 border-b-2 border-steel-700 py-1">
            <dt className="text-bone">
              {item.titleSnapshot}
              <span className="text-steel-500"> × {item.qty}</span>
            </dt>
            <dd className="shrink-0 text-coal tabular-nums">
              {formatMoney(item.priceMinorSnapshot * item.qty, order.currency)}
            </dd>
          </div>
        ))}

        <div className="flex justify-between gap-2 pt-2 text-hud">
          <dt className="text-steel-500">Итого</dt>
          <dd className="text-coal tabular-nums">
            {formatMoney(order.totalMinor, order.currency)}
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-steel-500">
        Доставка: {DELIVERY_LABELS[order.deliveryType]}
        {order.address ? `, ${order.address}` : ''}
      </p>

      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <p className="mt-3 border-2 border-rust p-2 text-[11px] uppercase leading-5 tracking-widest text-rust">
          {settings.demoNotice}
        </p>
      )}

      <PixelLink href="/#arsenal" variant="ghost" className="mt-4">
        Вернуться в арсенал
      </PixelLink>
    </main>
  )
}
