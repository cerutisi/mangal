'use server'

import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, ORDER_STATUSES, type OrderStatus } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { DELIVERY_LABELS, STATUS_LABELS } from '@/lib/orders'
import { formatPhone } from '@/lib/validation'

export type OrdersFilter = { status?: string; from?: string; to?: string }
export type ExportResult = { csv: string; filename: string }

/** Экранирование по RFC 4180: кавычки удваиваются, поле берётся в кавычки. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const HEADER = [
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

export async function exportOrdersCsv(filter: OrdersFilter): Promise<ExportResult> {
  await requireSession()

  const filters: SQL[] = []
  if (filter.status && ORDER_STATUSES.includes(filter.status as OrderStatus)) {
    filters.push(eq(orders.status, filter.status as OrderStatus))
  }
  if (filter.from) {
    filters.push(gte(orders.createdAt, Math.floor(new Date(filter.from).getTime() / 1000)))
  }
  if (filter.to) {
    // Верхняя граница включает весь последний день
    filters.push(lte(orders.createdAt, Math.floor(new Date(filter.to).getTime() / 1000) + 86399))
  }

  const rows = await db
    .select()
    .from(orders)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(orders.createdAt))

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
  const csv = '﻿' + [HEADER.map(csvCell).join(';'), ...body].join('\r\n')

  return { csv, filename: `orders-${new Date().toISOString().slice(0, 10)}.csv` }
}
