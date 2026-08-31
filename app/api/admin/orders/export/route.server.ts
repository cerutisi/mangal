import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, ORDER_STATUSES, type OrderStatus } from '@/lib/db/schema'
import { getSession } from '@/lib/auth/current-user'
import { DELIVERY_LABELS, STATUS_LABELS } from '@/lib/orders'
import { formatPhone } from '@/lib/validation'

export const runtime = 'nodejs'

/** Экранирование по RFC 4180: кавычки удваиваются, поле берётся в кавычки. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return new Response('Требуется вход', { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

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

  const header = [
    'Номер',
    'Дата',
    'Статус',
    'Имя',
    'Телефон',
    'Почта',
    'Доставка',
    'Адрес',
    'Сумма',
    'Валюта',
    'Комментарий клиента',
    'Заметка менеджера',
  ]

  const body = rows.map((order) =>
    [
      order.number,
      new Date(order.createdAt * 1000).toISOString().slice(0, 19).replace('T', ' '),
      STATUS_LABELS[order.status],
      order.customerName,
      formatPhone(order.phone),
      order.email,
      DELIVERY_LABELS[order.deliveryType],
      order.address ?? '',
      (order.totalMinor / 100).toFixed(2),
      order.currency,
      order.comment ?? '',
      order.managerNote ?? '',
    ]
      .map(csvCell)
      .join(';'),
  )

  // BOM: без него Excel открывает кириллицу как кракозябры
  const csv = '﻿' + [header.map(csvCell).join(';'), ...body].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
