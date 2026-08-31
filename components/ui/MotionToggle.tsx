'use client'

import { useEffect, useState } from 'react'

const KEY = 'mangal-motion'

/**
 * Спокойный режим: гасит покадровую анимацию и дрожание.
 * До гидрации режим уже верно задан медиазапросом prefers-reduced-motion,
 * тумблер лишь позволяет переопределить его вручную.
 */
export function MotionToggle() {
  const [calm, setCalm] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const value = stored ? stored === 'calm' : reduce
    setCalm(value)
    document.documentElement.dataset.motion = value ? 'calm' : 'full'
  }, [])

  function toggle() {
    const next = !calm
    setCalm(next)
    localStorage.setItem(KEY, next ? 'calm' : 'full')
    document.documentElement.dataset.motion = next ? 'calm' : 'full'
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={calm ?? false}
      className="inline-flex min-h-[44px] items-center gap-1 bevel bg-steel-700 px-2 text-[11px] uppercase tracking-widest text-bone hover:bg-steel-500"
    >
      <span aria-hidden="true" className={calm ? 'text-moss' : 'text-steel-500'}>
        {calm ? '[X]' : '[ ]'}
      </span>
      Спокойный режим
    </button>
  )
}
