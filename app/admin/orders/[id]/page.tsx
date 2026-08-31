import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { formatMoney } from '@/lib/money'
import { formatPhone } from '@/lib/validation'
import { DELIVERY_LABELS } from '@/lib/orders'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'
import { adminCard } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Заявка', robots: { index: false } }

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) notFound()

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))

  return (
    <div>
      <Link href="/admin/orders" className="text-sm underline">
        ← Все заявки
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">{order.number}</h1>
      <p className="text-sm text-slate-600">
        {new Date(order.createdAt * 1000).toLocaleString('ru-RU')}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className={adminCard}>
            <h2 className="font-semibold">Клиент</h2>
            <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-slate-500">Имя</dt>
              <dd>{order.customerName}</dd>
              <dt className="text-slate-500">Телефон</dt>
              <dd>
                <a href={`tel:${order.phone}`} className="underline">
                  {formatPhone(order.phone)}
                </a>
              </dd>
              <dt className="text-slate-500">Почта</dt>
              <dd>
                <a href={`mailto:${order.email}`} className="underline">
                  {order.email}
                </a>
              </dd>
              <dt className="text-slate-500">Доставка</dt>
              <dd>{DELIVERY_LABELS[order.deliveryType]}</dd>
              {order.address && (
                <>
                  <dt className="text-slate-500">Адрес</dt>
                  <dd>{order.address}</dd>
                </>
              )}
              {order.comment && (
                <>
                  <dt className="text-slate-500">Комментарий</dt>
                  <dd>{order.comment}</dd>
                </>
              )}
            </dl>
          </section>

          <section className={adminCard}>
            <h2 className="font-semibold">Состав заявки</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-2">{item.titleSnapshot}</td>
                    <td className="py-2 text-slate-500">× {item.qty}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatMoney(item.priceMinorSnapshot * item.qty, order.currency)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-semibold" colSpan={2}>
                    Итого
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {formatMoney(order.totalMinor, order.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              Цены — снимок на момент заявки. Правка товара их не меняет.
            </p>
          </section>

          <section className={adminCard}>
            <h2 className="font-semibold">Технические данные</h2>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-600">
              {JSON.stringify(order.meta, null, 2)}
            </pre>
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            managerNote={order.managerNote ?? ''}
          />
        </aside>
      </div>
    </div>
  )
}
