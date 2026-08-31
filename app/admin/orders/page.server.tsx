import type { Metadata } from 'next'
import Link from 'next/link'
import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, ORDER_STATUSES, type OrderStatus } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { formatMoney } from '@/lib/money'
import { formatPhone } from '@/lib/validation'
import { STATUS_LABELS, STATUS_TONE } from '@/lib/orders'
import { adminButton } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Заявки', robots: { index: false } }

type Search = { status?: string; from?: string; to?: string }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireSession()
  const { status, from, to } = await searchParams

  const filters: SQL[] = []
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    filters.push(eq(orders.status, status as OrderStatus))
  }
  if (from) filters.push(gte(orders.createdAt, Math.floor(new Date(from).getTime() / 1000)))
  if (to) filters.push(lte(orders.createdAt, Math.floor(new Date(to).getTime() / 1000) + 86399))

  const rows = await db
    .select()
    .from(orders)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(orders.createdAt))

  const exportQuery = new URLSearchParams()
  if (status) exportQuery.set('status', status)
  if (from) exportQuery.set('from', from)
  if (to) exportQuery.set('to', to)

  return (
    <div>
      <h1 className="text-2xl font-semibold">Заявки</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 rounded border border-slate-300 bg-white p-4">
        <label className="text-sm">
          <span className="block text-slate-700">Статус</span>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="mt-1 rounded border border-slate-300 px-3 py-2"
          >
            <option value="">любой</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-slate-700">С даты</span>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ''}
            className="mt-1 rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700">По дату</span>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ''}
            className="mt-1 rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <button type="submit" className={adminButton}>
          Показать
        </button>

        <Link href="/admin/orders" className={adminButton}>
          Сбросить
        </Link>

        <a href={`/api/admin/orders/export?${exportQuery}`} className={`${adminButton} ml-auto`}>
          Выгрузить CSV
        </a>
      </form>

      {rows.length === 0 ? (
        <p className="mt-6 text-slate-600">Заявок по этим условиям нет.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse rounded border border-slate-300 bg-white text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-medium">Номер</th>
              <th className="p-3 font-medium">Дата</th>
              <th className="p-3 font-medium">Клиент</th>
              <th className="p-3 font-medium">Сумма</th>
              <th className="p-3 font-medium">Статус</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-t border-slate-200">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium underline">
                    {order.number}
                  </Link>
                </td>
                <td className="p-3 text-slate-600">
                  {new Date(order.createdAt * 1000).toLocaleString('ru-RU')}
                </td>
                <td className="p-3">
                  {order.customerName}
                  <span className="block text-xs text-slate-500">{formatPhone(order.phone)}</span>
                </td>
                <td className="p-3 tabular-nums">
                  {formatMoney(order.totalMinor, order.currency)}
                </td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
