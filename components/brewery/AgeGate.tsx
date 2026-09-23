'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { PixelButton, PixelLink } from '@/components/ui/PixelButton'

const KEY = 'mangal-age-ok'

/**
 * Пивоварня продаёт алкоголь — сначала возраст. Ответ помним в localStorage,
 * чтобы не спрашивать на каждом заходе. Это не проверка документов, а честное
 * предупреждение; окончательно возраст подтверждается при оформлении заказа.
 */
export function AgeGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'unknown' | 'adult' | 'minor'>('unknown')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === 'yes') setState('adult')
    } catch {
      // Приватный режим без хранилища — просто спросим ещё раз
    }
    setMounted(true)
  }, [])

  function confirm() {
    try {
      localStorage.setItem(KEY, 'yes')
    } catch {}
    setState('adult')
  }

  // До гидрации ничего не показываем: иначе совершеннолетние каждый раз
  // видели бы вспышку вопроса про возраст
  if (!mounted) {
    return <p className="p-3 text-hud text-steel-500 uppercase">Разогреваем котёл…</p>
  }

  if (state === 'adult') return <>{children}</>

  if (state === 'minor') {
    return (
      <div className="bevel bg-surface p-3">
        <p className="text-hud text-bone uppercase">Приходите через пару лет.</p>
        <p className="mt-1 text-steel-500">А мангал можно выбрать уже сейчас.</p>
        <PixelLink href="/#arsenal" className="mt-2">
          В арсенал
        </PixelLink>
      </div>
    )
  }

  return (
    <div role="dialog" aria-labelledby="age-title" className="bevel bg-surface p-3 md:p-4">
      <p className="text-hud text-blood uppercase">18+</p>
      <h2 id="age-title" className="mt-1 text-hud-lg text-bone uppercase">
        Здесь варят пиво
      </h2>
      <p className="mt-1 prose-column text-steel-500">
        Пивоварня — только для тех, кому уже исполнилось 18 лет.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <PixelButton onClick={confirm}>Мне есть 18</PixelButton>
        <PixelButton variant="ghost" onClick={() => setState('minor')}>
          Мне нет 18
        </PixelButton>
      </div>
    </div>
  )
}
