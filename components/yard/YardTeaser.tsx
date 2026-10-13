import Link from 'next/link'
import { crateBottles, crateDataUrl } from '@/lib/brewery/crate'
import { SAMPLE_BEERS } from '@/lib/brewery/samples'
import { YardStage } from './YardStage'

/** Вход во двор с главной: та же живая сцена в малом масштабе и одна ссылка. */
export function YardTeaser({ mangalSrc }: { mangalSrc: string }) {
  const crate = crateDataUrl(crateBottles(SAMPLE_BEERS.map((recipe) => ({ recipe, qty: 2 }))))

  return (
    <section aria-labelledby="yard-teaser-title" className="mx-auto max-w-5xl px-2 py-6">
      <Link
        href="/yard"
        className="group flex flex-col items-center gap-3 bevel bg-surface p-2 hover:bg-steel-700 md:flex-row md:gap-4 md:p-3"
      >
        <div className="bevel-in bg-void p-[4px]">
          <YardStage
            mangalSrc={mangalSrc}
            crateSrc={crate}
            label="Ночной двор: изба, горящий мангал и ящик пива"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 id="yard-teaser-title" className="text-hud-lg text-coal uppercase">
            Двор
          </h2>
          <p className="mt-1 text-bone">
            Посмотрите, как ваш мангал и ящик вашего пива стоят у дома. Вечер уже начался.
          </p>
          <span className="mt-2 inline-flex min-h-[44px] items-center bevel bg-ember px-2 text-hud text-on-accent uppercase hard-shadow group-hover:bg-coal">
            Выйти во двор →
          </span>
        </div>
      </Link>
    </section>
  )
}
