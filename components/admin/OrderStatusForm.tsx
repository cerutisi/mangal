'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/db/schema'
import { STATUS_LABELS } from '@/lib/orders'
import { updateOrder } from '@/actions/admin-orders'
import { adminCard, adminInput, adminLabel, adminPrimaryButton } from './ui'

export function OrderStatusForm({
  orderId,
  status: initialStatus,
  managerNote: initialNote,
}: {
  orderId: string
  status: OrderStatus
  managerNote: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [managerNote, setManagerNote] = useState(initialNote)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    const result = await updateOrder({ orderId, status, managerNote })
    setPending(false)

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setMessage('Сохранено')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className={adminCard}>
      <h2 className="font-semibold">Статус заявки</h2>

      <label className="mt-3 block">
        <span className={adminLabel}>Текущий статус</span>
        <select
          className={adminInput}
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className={adminLabel}>Заметка менеджера</span>
        <textarea
          className={`${adminInput} min-h-24`}
          value={managerNote}
          onChange={(e) => setManagerNote(e.target.value)}
          placeholder="Договорились о доставке в субботу"
        />
      </label>

      <button type="submit" disabled={pending} className={`${adminPrimaryButton} mt-4 w-full`}>
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </button>

      {message && (
        <p role="status" className="mt-2 text-sm text-slate-600">
          {message}
        </p>
      )}
    </form>
  )
}
