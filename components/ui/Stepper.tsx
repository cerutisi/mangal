'use client'

import { MAX_QTY } from '@/lib/cart/types'

export function Stepper({
  value,
  onChange,
  label,
  min = 1,
}: {
  value: number
  onChange: (next: number) => void
  label: string
  min?: number
}) {
  const button =
    'flex h-[44px] w-[44px] items-center justify-center bevel bg-steel-700 text-hud text-bone ' +
    'hover:bg-steel-500 disabled:bg-surface disabled:text-steel-500'

  return (
    <div className="flex items-stretch" role="group" aria-label={label}>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Уменьшить количество: ${label}`}
      >
        −
      </button>
      <output
        className="flex h-[44px] w-[56px] items-center justify-center bevel-in bg-void text-hud text-coal tabular-nums"
        aria-live="polite"
        aria-label={`Количество: ${label}`}
      >
        {String(value).padStart(2, '0')}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(MAX_QTY, value + 1))}
        disabled={value >= MAX_QTY}
        aria-label={`Увеличить количество: ${label}`}
      >
        +
      </button>
    </div>
  )
}
