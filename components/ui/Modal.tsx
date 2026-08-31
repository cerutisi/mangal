'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** Модалка с ловушкой фокуса, закрытием по Esc и возвратом фокуса на инициатор. */
export function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => router.back(), [router])

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    // Фокус на сам диалог, а не на первую кнопку: скринридер читает заголовок,
    // а Enter остаётся свободным для «взять» вместо случайного закрытия карточки
    dialogRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      openerRef.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/85 p-0 md:items-center md:p-3">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full bevel bg-surface p-2 pb-[120px] md:max-w-4xl md:p-4 md:pb-4"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть карточку"
          className="absolute right-2 top-2 flex h-[44px] w-[44px] items-center justify-center bevel bg-steel-700 text-hud text-bone hover:bg-blood"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
