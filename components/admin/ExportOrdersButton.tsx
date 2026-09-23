'use client'

import { useState } from 'react'
import { exportOrdersCsv, type OrdersFilter } from '@/actions/admin-export'
import { adminButton } from './ui'

/**
 * CSV приходит из Server Action строкой, а скачиванием занимается браузер:
 * отдельный Route Handler ради одного заголовка Content-Disposition не нужен.
 */
export function ExportOrdersButton({ filter }: { filter: OrdersFilter }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setBusy(true)
    setError('')
    try {
      const { csv, filename } = await exportOrdersCsv(filter)
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Не удалось выгрузить. Обновите страницу и попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="ml-auto flex items-center gap-3">
      {error && (
        <span role="alert" className="text-sm text-rose-700">
          {error}
        </span>
      )}
      <button type="button" onClick={download} disabled={busy} className={adminButton}>
        {busy ? 'Готовим…' : 'Выгрузить CSV'}
      </button>
    </span>
  )
}
