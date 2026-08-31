'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart/store'
import { PixelButton } from '@/components/ui/PixelButton'
import { Stepper } from '@/components/ui/Stepper'

export function AddToCart({
  productId,
  title,
  inStock,
  /** Enter добавляет товар, пока карточка открыта */
  enterAdds = false,
}: {
  productId: string
  title: string
  inStock: boolean
  enterAdds?: boolean
}) {
  const add = useCart((s) => s.add)
  const setExpanded = useCart((s) => s.setExpanded)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(timer)
  }, [added])

  useEffect(() => {
    if (!enterAdds || !inStock) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName))
      ) {
        return
      }
      e.preventDefault()
      add(productId, qty)
      setAdded(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enterAdds, inStock, add, productId, qty])

  if (!inStock) {
    return (
      <div className="flex flex-col gap-1">
        <PixelButton disabled>Нет на складе</PixelButton>
        <p className="text-sm text-steel-500">
          Напишите в мессенджер — скажем срок следующей партии.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stepper value={qty} onChange={setQty} label={title} />

      <PixelButton
        onClick={() => {
          add(productId, qty)
          setAdded(true)
          setExpanded(false)
        }}
        className="px-3"
      >
        Взять
      </PixelButton>

      {/* Скринридер получает подтверждение, а не только цвет кнопки */}
      <p role="status" className="text-sm text-moss">
        {added ? `Добавлено в корзину: ${title} ×${qty}` : ''}
      </p>

      {enterAdds && (
        <p className="w-full text-[11px] uppercase tracking-widest text-steel-500">
          <kbd className="bevel-in bg-void px-[4px] text-coal">Enter</kbd> — взять,{' '}
          <kbd className="bevel-in bg-void px-[4px] text-coal">Esc</kbd> — закрыть
        </p>
      )}
    </div>
  )
}
