'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Клавиши 1–9 открывают карточку соответствующего слота. */
export function Hotkeys({ slots }: { slots: Record<string, string> }) {
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Хоткеи не перехватываются, когда человек печатает
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      const slug = slots[e.key]
      if (!slug) return
      e.preventDefault()
      router.push(`/product/${slug}`)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slots, router])

  return null
}
