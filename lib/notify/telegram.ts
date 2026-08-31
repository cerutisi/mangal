import 'server-only'
import { formatMoney } from '@/lib/money'
import { formatPhone } from '@/lib/validation'
import { withRetries } from './retry'
import type { OrderEmailData } from './email'

/** Менеджеры читают Telegram, а не почту — сообщение со ссылкой прямо на заказ. */
export async function sendTelegramOrder(data: OrderEmailData) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[notify:telegram] токен или chat id не заданы — сообщение пропущено')
    return null
  }

  const items = data.items.map((i) => `• ${i.title} × ${i.qty}`).join('\n')
  const text = [
    `Заявка ${data.number}`,
    `${data.customerName}, ${formatPhone(data.phone)}`,
    data.email,
    '',
    items,
    '',
    `Итого: ${formatMoney(data.totalMinor, data.currency)}`,
    `Доставка: ${data.deliveryLabel}${data.address ? `, ${data.address}` : ''}`,
    data.comment ? `Комментарий: ${data.comment}` : '',
    '',
    `${data.siteUrl}/admin/orders`,
  ]
    .filter(Boolean)
    .join('\n')

  return withRetries('telegram', async () => {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    })
    if (!response.ok) throw new Error(`Telegram ответил ${response.status}`)
    return response.json()
  })
}
