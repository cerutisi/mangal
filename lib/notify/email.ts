import 'server-only'
import { formatMoney } from '@/lib/money'
import { formatPhone } from '@/lib/validation'
import { withRetries } from './retry'

export type OrderEmailData = {
  number: string
  customerName: string
  phone: string
  email: string
  comment: string | null
  deliveryLabel: string
  address: string | null
  totalMinor: number
  currency: string
  items: { title: string; qty: number; priceMinor: number }[]
  replyTime: string
  siteUrl: string
}

/** Простая таблица без пиксельных шрифтов: почтовые клиенты их не отрисуют. */
function renderHtml(data: OrderEmailData, forManager: boolean): string {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #ddd">${i.title}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:center">${i.qty}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${formatMoney(
          i.priceMinor * i.qty,
          data.currency,
        )}</td></tr>`,
    )
    .join('')

  const head = forManager
    ? `<p>Новая заявка <strong>${data.number}</strong>.</p>
       <p>Клиент: ${data.customerName}, ${formatPhone(data.phone)}, ${data.email}</p>
       <p><a href="${data.siteUrl}/admin/orders">Открыть в админке</a></p>`
    : `<p>${data.customerName}, заявка <strong>${data.number}</strong> принята.</p>
       <p>Менеджер свяжется ${data.replyTime}. Оплата на сайте не производится.</p>`

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
    ${head}
    <table style="border-collapse:collapse;margin-top:12px;min-width:320px">
      <thead><tr>
        <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #111">Позиция</th>
        <th style="padding:6px 8px;border-bottom:2px solid #111">Кол-во</th>
        <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #111">Сумма</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="2" style="padding:6px 8px;font-weight:bold">Итого</td>
        <td style="padding:6px 8px;text-align:right;font-weight:bold">${formatMoney(
          data.totalMinor,
          data.currency,
        )}</td>
      </tr></tfoot>
    </table>
    <p style="margin-top:12px">Доставка: ${data.deliveryLabel}${
      data.address ? `, ${data.address}` : ''
    }</p>
    ${data.comment ? `<p>Комментарий: ${data.comment}</p>` : ''}
  </div>`
}

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM
  if (!key || !from) {
    console.warn('[notify:email] RESEND_API_KEY или ORDER_EMAIL_FROM не заданы — письмо пропущено')
    return null
  }

  return withRetries(`email:${to}`, async () => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!response.ok) throw new Error(`Resend ответил ${response.status}: ${await response.text()}`)
    return response.json()
  })
}

export async function sendOrderEmails(
  data: OrderEmailData,
  subjects: { client: string; manager: string },
) {
  const manager = process.env.ORDER_EMAIL_MANAGER
  await Promise.all([
    send(data.email, `${subjects.client} ${data.number}`, renderHtml(data, false)),
    manager ? send(manager, `${subjects.manager} ${data.number}`, renderHtml(data, true)) : null,
  ])
}
