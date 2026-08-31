'use client'

import type { ProductStat } from '@/lib/db/schema'
import { adminButton, adminDangerButton, adminInput, adminLabel } from './ui'

export function StatsEditor({
  stats,
  onChange,
}: {
  stats: ProductStat[]
  onChange: (next: ProductStat[]) => void
}) {
  function update(index: number, patch: Partial<ProductStat>) {
    onChange(stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)))
  }

  return (
    <fieldset>
      <legend className={adminLabel}>Характеристики</legend>
      <p className="mt-1 text-xs text-slate-500">
        Показываются в карточке HUD-строками. Шкала 0–100 рисует полоску; оставьте пустой, если
        полоска не нужна.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.4fr_1fr_90px_auto]"
          >
            <label className="text-xs text-slate-600">
              Ключ
              <input
                className={adminInput}
                value={stat.key}
                onChange={(e) => update(index, { key: e.target.value })}
                placeholder="steel"
              />
            </label>

            <label className="text-xs text-slate-600">
              Подпись
              <input
                className={adminInput}
                value={stat.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="ТОЛЩИНА СТАЛИ"
              />
            </label>

            <label className="text-xs text-slate-600">
              Значение
              <input
                className={adminInput}
                value={stat.value}
                onChange={(e) => update(index, { value: e.target.value })}
                placeholder="6 мм"
              />
            </label>

            <label className="text-xs text-slate-600">
              Шкала
              <input
                className={adminInput}
                type="number"
                min={0}
                max={100}
                value={stat.bar ?? ''}
                onChange={(e) =>
                  update(index, {
                    bar: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                className={adminDangerButton}
                onClick={() => onChange(stats.filter((_, i) => i !== index))}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${adminButton} mt-3`}
        disabled={stats.length >= 8}
        onClick={() => onChange([...stats, { key: '', label: '', value: '' }])}
      >
        Добавить строку
      </button>
    </fieldset>
  )
}
