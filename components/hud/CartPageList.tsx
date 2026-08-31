'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart/store'
import { cartTotals } from '@/lib/cart/totals'
import type { CatalogEntry } from '@/lib/cart/types'
import { formatMoney } from '@/lib/money'
import { Sprite } from '@/components/ui/Sprite'
import { Stepper } from '@/components/ui/Stepper'
import { PixelButton, PixelLink } from '@/components/ui/PixelButton'
import { IS_STATIC_DEMO } from '@/lib/demo'

export function CartPageList({ catalog }: { catalog: CatalogEntry[] }) {
  const lines = useCart((s) => s.lines)
  const hydrated = useCart((s) => s.hydrated)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)

  const { lines: resolved, totalMinor, currency, count } = cartTotals(lines, catalog)

  if (!hydrated) {
    return <p className="text-steel-500">Восстанавливаем корзину…</p>
  }

  if (count === 0) {
    return (
      <div className="bevel bg-surface p-3">
        <p className="text-hud text-steel-500 uppercase">Арсенал пуст. Выберите оружие.</p>
        <PixelLink href="/#arsenal" className="mt-2">
          В арсенал
        </PixelLink>
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y-2 divide-steel-700 bevel bg-surface">
        {resolved.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-center gap-2 p-2">
            <Sprite
              src={line.product.spriteUrl}
              alt={line.product.spriteAlt}
              size={96}
              className="shrink-0"
            />

            <div className="min-w-[140px] flex-1">
              <Link
                href={`/product/${line.product.slug}`}
                className="text-hud text-bone uppercase hover:text-coal"
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-hud-lg text-coal tabular-nums">{formatMoney(totalMinor, currency)}</p>
        <PixelLink href={IS_STATIC_DEMO ? '/#contacts' : '/checkout'} className="px-3">
          {IS_STATIC_DEMO ? 'Связаться' : 'Оформить'}
        </PixelLink>
      </div>
    </div>
  )
}
