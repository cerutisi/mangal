'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/db/schema'
import { formatMoney } from '@/lib/money'
import { reorderProducts, setProductActive } from '@/actions/admin-products'
import { adminButton, adminDangerButton, adminPrimaryButton } from './ui'

export function ProductsTable({ initial }: { initial: Product[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')

  const active = rows.filter((p) => p.isActive)
  const archived = rows.filter((p) => !p.isActive)

  function move(id: string, direction: -1 | 1) {
    const index = rows.findIndex((p) => p.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    setDirty(true)
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = rows.findIndex((p) => p.id === dragId)
    const to = rows.findIndex((p) => p.id === targetId)
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)
    setDirty(true)
    setDragId(null)
  }

  async function saveOrder() {
    setMessage('')
    const result = await reorderProducts(rows.filter((p) => p.isActive).map((p) => p.id))
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setDirty(false)
    router.refresh()
  }

  async function toggleActive(product: Product) {
    const result = await setProductActive(product.id, !product.isActive)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setRows((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)),
    )
    router.refresh()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/products/new" className={adminPrimaryButton}>
          Новый товар
        </Link>

        {dirty && (
          <>
            <button type="button" className={adminPrimaryButton} onClick={saveOrder}>
              Сохранить порядок слотов
            </button>
            <button
              type="button"
              className={adminButton}
              onClick={() => {
                setRows(initial)
                setDirty(false)
              }}
            >
              Вернуть как было
            </button>
          </>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-3 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {message}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-600">
        Порядок задаётся перетаскиванием строки или стрелками — стрелки работают с клавиатуры.
        Слоты нумеруются сверху вниз, 1–9.
      </p>

      <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse rounded border border-slate-300 bg-white text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="p-3 font-medium">Слот</th>
            <th className="p-3 font-medium">Товар</th>
            <th className="p-3 font-medium">Цена</th>
            <th className="p-3 font-medium">Склад</th>
            <th className="p-3 font-medium">Порядок</th>
            <th className="p-3 font-medium">Действия</th>
          </tr>
        </thead>

        <tbody>
          {active.map((product, index) => (
            <tr
              key={product.id}
              draggable
              onDragStart={() => setDragId(product.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(product.id)}
              className={`border-t border-slate-200 ${dragId === product.id ? 'opacity-50' : ''}`}
            >
              <td className="p-3 tabular-nums text-slate-500">{index + 1}</td>

              <td className="p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.spriteUrl}
                    alt=""
                    width={40}
                    height={40}
                    style={{ imageRendering: 'pixelated' }}
                    className="bg-slate-900"
                  />
                  <div>
                    <Link href={`/admin/products/${product.id}`} className="font-medium underline">
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-500">/{product.slug}</p>
                  </div>
                </div>
              </td>

              <td className="p-3 tabular-nums">
                {formatMoney(product.priceMinor, product.currency)}
              </td>

              <td className="p-3">
                {product.inStock ? (
                  <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-900">
                    в наличии
                  </span>
                ) : (
                  <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">
                    нет
                  </span>
                )}
              </td>

              <td className="p-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={adminButton}
                    onClick={() => move(product.id, -1)}
                    disabled={index === 0}
                    aria-label={`Поднять выше: ${product.title}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={adminButton}
                    onClick={() => move(product.id, 1)}
                    disabled={index === active.length - 1}
                    aria-label={`Опустить ниже: ${product.title}`}
                  >
                    ↓
                  </button>
                </div>
              </td>

              <td className="p-3">
                <button type="button" className={adminDangerButton} onClick={() => toggleActive(product)}>
                  В архив
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Архив</h2>
          <p className="text-sm text-slate-600">
            Товар снят с витрины, но остаётся в истории заказов.
          </p>

          <ul className="mt-3 divide-y divide-slate-200 rounded border border-slate-300 bg-white">
            {archived.map((product) => (
              <li key={product.id} className="flex items-center gap-3 p-3 text-sm">
                <Link href={`/admin/products/${product.id}`} className="font-medium underline">
                  {product.title}
                </Link>
                <span className="text-slate-500">
                  {formatMoney(product.priceMinor, product.currency)}
                </span>
                <button
                  type="button"
                  className={`${adminButton} ml-auto`}
                  onClick={() => toggleActive(product)}
                >
                  Вернуть на витрину
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
