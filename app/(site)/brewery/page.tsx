import type { Metadata } from 'next'
import Link from 'next/link'
import { AgeGate } from '@/components/brewery/AgeGate'
import { BrewLab } from '@/components/brewery/BrewLab'

export const metadata: Metadata = {
  title: 'Пивоварня',
  description:
    'Соберите рецепт из нашего сырья — солод, хмель, дрожжи, добавки. Сварим, выдержим и разольём по бутылкам. 18+.',
}

export default function BreweryPage() {
  return (
    <main className="mx-auto max-w-6xl px-2 py-4">
      <Link href="/#arsenal" className="text-hud text-steel-500 uppercase hover:text-coal">
        ← В арсенал
      </Link>

      <h1 className="mt-2 text-hud-lg text-coal uppercase md:text-[48px] md:leading-[56px]">
        Пивоварня
      </h1>
      <p className="mt-1 prose-column text-steel-500">
        Соберите рецепт из того, что есть на складе. Мы сварим его на мангале, выдержим и
        разольём по бутылкам 0,5 л с вашим именем на этикетке.
      </p>

      <div className="mt-4">
        <AgeGate>
          <BrewLab />
        </AgeGate>
      </div>

      <p className="mt-4 text-sm text-steel-500">
        Чрезмерное употребление алкоголя вредит вашему здоровью. Продажа — только лицам старше 18 лет.
      </p>
    </main>
  )
}
