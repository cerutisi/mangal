'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/store'
import { cartTotals } from '@/lib/cart/totals'
import type { CatalogEntry } from '@/lib/cart/types'
import { formatMoney } from '@/lib/money'
import { Sprite } from '@/components/ui/Sprite'
import { Stepper } from '@/components/ui/Stepper'
import { PixelButton, PixelLink } from '@/components/ui/PixelButton'
import { IS_STATIC_DEMO } from '@/lib/demo'
import { CartFace } from './CartFace'

const PULSE_MS = 450

export function CartHudClient({ catalog }: { catalog: CatalogEntry[] }) {
  const lines = useCart((s) => s.lines)
  const expanded = useCart((s) => s.expanded)
  const pulseAt = useCart((s) => s.pulseAt)
  const hydrated = useCart((s) => s.hydrated)
  const setExpanded = useCart((s) => s.setExpanded)
  const toggleExpanded = useCart((s) => s.toggleExpanded)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const prune = useCart((s) => s.prune)

  const [pulsing, setPulsing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Товар мог исчезнуть из каталога, пока корзина лежала в localStorage
  useEffect(() => {
    if (hydrated) prune(catalog.map((p) => p.id))
  }, [hydrated, catalog, prune])

  useEffect(() => {
    if (!pulseAt) return
    setPulsing(true)
    const timer = setTimeout(() => setPulsing(false), PULSE_MS)
    return () => clearTimeout(timer)
  }, [pulseAt])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, setExpanded])

  const { lines: resolved, count, totalMinor, currency } = cartTotals(lines, catalog)
  const empty = count === 0

  return (
    <aside
      aria-label="Корзина"
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {expanded && (
        <>
          {/* На мобиле список раскрывается на весь экран, на десктопе — панелью */}
          <button
            type="button"
            aria-label="Свернуть корзину"
            className="fixed inset-0 -z-10 bg-void/80 md:bg-void/60"
            onClick={() => setExpanded(false)}
          />
          <div
            id="cart-lines"
            ref={panelRef}
            className="mx-auto max-h-[70vh] w-full overflow-y-auto border-x-2 border-t-2 border-steel-500 bg-surface md:max-w-5xl"
          >
            {empty ? (
              <p className="p-3 text-hud text-steel-500 uppercase">
                Арсенал пуст. Выберите оружие.
              </p>
            ) : (
              <ul className="divide-y-2 divide-steel-700">
                {resolved.map((line) => (
                  <li key={line.productId} className="flex flex-wrap items-center gap-2 p-2">
                    <Sprite
                      src={line.product.spriteUrl}
                      alt={line.product.spriteAlt}
                      size={48}
                      className="shrink-0"
                    />

                    {/* min-width заставляет управление переехать на вторую строку,
                        а не наползать на название на узком экране */}
                    <div className="min-w-[140px] flex-1">
                      <Link
                        href={`/product/${line.product.slug}`}
                        className="text-hud text-bone uppercase hover:text-coal"
                        onClick={() => setExpanded(false)}
                      >
                        {line.product.title}
                      </Link>
                      <p className="text-sm text-steel-500">
                        {formatMoney(line.product.priceMinor, line.product.currency)} за штуку
                      </p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
                      <Stepper
                        value={line.qty}
                        label={line.product.title}
                        onChange={(next) => setQty(line.productId, next)}
                      />
                      <output className="text-right text-hud text-coal tabular-nums sm:w-[128px]">
                        {formatMoney(line.sumMinor, line.product.currency)}
                      </output>
                      <PixelButton
                        variant="danger"
                        className="w-[44px] shrink-0 px-0"
                        onClick={() => remove(line.productId)}
                        aria-label={`Убрать из корзины: ${line.product.title}`}
                      >
                        ✕
                      </PixelButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="border-t-2 border-steel-500 bg-surface">
        <div className="mx-auto flex h-[88px] max-w-5xl items-stretch gap-2 px-2 py-2 md:h-[96px]">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls="cart-lines"
            className="flex min-w-0 flex-1 items-center gap-2 bevel-in bg-void px-2 text-left md:gap-4 md:px-3"
          >
            <span className="flex flex-col justify-center">
              <span className="text-[11px] uppercase tracking-widest text-steel-500">Позиций</span>
              <span className="text-hud-lg text-bone tabular-nums" aria-live="polite">
                {String(count).padStart(2, '0')}
              </span>
            </span>

            <span className="hidden shrink-0 sm:block">
              <CartFace count={count} pulsing={pulsing} />
            </span>

            <span className="flex min-w-0 flex-col justify-center">
              <span className="text-[11px] uppercase tracking-widest text-steel-500">Сумма</span>
              <span className="truncate text-hud-lg text-coal tabular-nums">
                {formatMoney(totalMinor, currency)}
              </span>
            </span>

            <span className="ml-auto hidden text-[11px] uppercase tracking-widest text-steel-500 lg:block">
              {empty ? 'Арсенал пуст' : expanded ? 'Свернуть' : 'Развернуть'}
            </span>
          </button>

          {empty ? (
            <PixelLink href="/#arsenal" variant="ghost" className="shrink-0 px-2 md:px-3">
              В арсенал
            </PixelLink>
          ) : (
            <PixelLink
              href={IS_STATIC_DEMO ? '/#contacts' : '/checkout'}
              className="shrink-0 px-2 md:px-3"
              onClick={() => setExpanded(false)}
            >
              {IS_STATIC_DEMO ? 'Связаться' : 'Оформить'}
            </PixelLink>
          )}
        </div>
      </div>
    </aside>
  )
}
