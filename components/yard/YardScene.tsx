'use client'

import { useEffect, useMemo, useState } from 'react'
import { PixelButton, PixelLink } from '@/components/ui/PixelButton'
import { useCart } from '@/lib/cart/store'
import { cartTotals } from '@/lib/cart/totals'
import type { CatalogEntry } from '@/lib/cart/types'
import { CRATE_SLOTS, crateBottles, crateDataUrl } from '@/lib/brewery/crate'
import { YardStage } from './YardStage'

const STOKE_MS = 6000

export function YardScene({ catalog }: { catalog: CatalogEntry[] }) {
  const lines = useCart((s) => s.lines)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [stoked, setStoked] = useState(false)

  const { mangals, beers } = useMemo(() => {
    const resolved = cartTotals(lines, catalog).lines
    return {
      mangals: resolved.filter((l) => !l.recipe),
      beers: resolved.flatMap((l) => (l.recipe ? [{ ...l, recipe: l.recipe }] : [])),
    }
  }, [lines, catalog])

  // Во дворе стоит мангал из корзины; пока она пуста — первый из арсенала
  const fromCart = mangals.find((l) => l.productId === chosenId) ?? mangals[0]
  const mangal = fromCart?.product ?? catalog[0]

  const bottles = useMemo(() => crateBottles(beers), [beers])
  const bottleCount = beers.reduce((sum, l) => sum + l.qty, 0)

  useEffect(() => {
    if (!stoked) return
    const timer = setTimeout(() => setStoked(false), STOKE_MS)
    return () => clearTimeout(timer)
  }, [stoked])

  if (!mangal) {
    return <p className="text-steel-500">В арсенале пока пусто — двору нечего показать.</p>
  }

  const label =
    `Ночь, бревенчатая изба с горящими окнами и дымом из трубы. ` +
    `У дома горит мангал ${mangal.title}` +
    (bottles.length > 0 ? `, рядом ящик пива: ${beers.map((b) => b.product.title).join(', ')}.` : '.')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bevel-in bg-void p-[4px]">
        <YardStage
          full
          stoked={stoked}
          mangalSrc={mangal.spriteUrl}
          crateSrc={bottles.length > 0 ? crateDataUrl(bottles) : null}
          label={label}
        />
      </div>

      <div className="grid w-full max-w-[968px] gap-2 md:grid-cols-2">
        <section aria-labelledby="yard-mangal-title" className="bevel bg-surface p-2">
          <h2 id="yard-mangal-title" className="text-hud text-ember uppercase">
            Мангал
          </h2>
          <p className="mt-1 text-hud-lg text-bone uppercase">{mangal.title}</p>

          {fromCart ? (
            <p className="mt-1 text-steel-500">Из вашей корзины. Уже разгорелся.</p>
          ) : (
            <>
              <p className="mt-1 text-steel-500">
                Пока во дворе стоит наш. Выберите свой в арсенале — он встанет на это место.
              </p>
              <PixelLink href="/#arsenal" variant="ghost" className="mt-2">
                В арсенал
              </PixelLink>
            </>
          )}

          {mangals.length > 1 && (
            <fieldset className="mt-2">
              <legend className="text-[11px] uppercase tracking-widest text-steel-500">
                Какой поставить
              </legend>
              <div className="mt-[4px] flex flex-wrap gap-1">
                {mangals.map((line) => (
                  <label key={line.productId} className="cursor-pointer">
                    <input
                      type="radio"
                      name="yard-mangal"
                      className="peer sr-only"
                      checked={line.productId === fromCart?.productId}
                      onChange={() => setChosenId(line.productId)}
                    />
                    <span className="flex min-h-[44px] items-center bevel bg-steel-700 px-2 text-hud text-bone uppercase peer-checked:bg-rust/40 peer-checked:text-coal peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-coal">
                      {line.product.title}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PixelButton onClick={() => setStoked(true)} disabled={stoked}>
              Подбросить углей
            </PixelButton>
            <span role="status" className="text-sm text-moss">
              {stoked ? 'Огонь разошёлся.' : ''}
            </span>
          </div>
        </section>

        <section aria-labelledby="yard-crate-title" className="bevel bg-surface p-2">
          <h2 id="yard-crate-title" className="text-hud text-ember uppercase">
            Ящик пива
          </h2>

          {beers.length > 0 ? (
            <>
              <ul className="mt-1 space-y-[4px]">
                {beers.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-2">
                    <span className="text-hud text-bone uppercase">{line.product.title}</span>
                    <span className="shrink-0 text-hud text-coal tabular-nums">× {line.qty}</span>
                  </li>
                ))}
              </ul>
              {bottleCount > CRATE_SLOTS && (
                <p className="mt-1 text-sm text-steel-500">
                  В ящик на картинке помещается {CRATE_SLOTS} бутылок — остальные {bottleCount - CRATE_SLOTS}{' '}
                  ждут в погребе.
                </p>
              )}
              <PixelLink href="/brewery" variant="ghost" className="mt-2">
                Сварить ещё
              </PixelLink>
            </>
          ) : (
            <>
              <p className="mt-1 text-steel-500">
                Ящика пока нет. Сварите пиво в пивоварне и возьмите его в корзину — бутылки
                с вашими этикетками встанут у мангала.
              </p>
              <PixelLink href="/brewery" className="mt-2">
                В пивоварню
              </PixelLink>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
