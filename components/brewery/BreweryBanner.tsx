import Link from 'next/link'
import { Sprite } from '@/components/ui/Sprite'
import { bottleDataUrl } from '@/lib/brewery/recipe'
import { SAMPLE_BEERS } from '@/lib/brewery/samples'
import { Kettle } from './Kettle'

/** Баннер-раздел на самом верху главной. Вся плашка — одна ссылка в пивоварню. */
export function BreweryBanner() {
  return (
    <section aria-labelledby="brewery-banner-title" className="border-b-2 border-steel-700">
      <div className="hazard-tape" aria-hidden="true" />

      <Link
        href="/brewery"
        className="group block bg-surface hover:bg-steel-700 focus-visible:outline-offset-[-4px]"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-2 py-2 md:gap-4 md:py-3">
          <Kettle small className="shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="inline-block bg-blood px-[6px] text-[11px] uppercase leading-5 tracking-widest text-bone">
              Новое
            </p>
            <h2
              id="brewery-banner-title"
              className="mt-[4px] text-hud-lg text-coal uppercase md:text-[32px] md:leading-[40px]"
            >
              Пивоварня
            </h2>
            <p className="text-sm text-bone md:text-base">
              Собери рецепт из нашего сырья — сварим и разольём по бутылкам.
            </p>
          </div>

          {/* Бутылки — только на широком экране, на телефоне им нет места */}
          <div className="hidden shrink-0 items-end gap-1 lg:flex" aria-hidden="true">
            {SAMPLE_BEERS.map((beer) => (
              <Sprite
                key={beer.name}
                src={bottleDataUrl(beer)}
                alt=""
                size={96}
                className="group-hover:-translate-y-[2px]"
              />
            ))}
          </div>

          <span className="hidden shrink-0 bevel bg-ember px-2 py-1 text-hud text-on-accent uppercase hard-shadow sm:inline-flex group-hover:bg-coal">
            К котлу →
          </span>
          {/* На телефоне кнопке нет места — стрелка показывает, что плашка кликабельна */}
          <span aria-hidden="true" className="shrink-0 text-hud-lg text-ember sm:hidden">
            →
          </span>
        </div>
      </Link>
    </section>
  )
}
