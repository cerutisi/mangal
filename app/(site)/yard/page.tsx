import type { Metadata } from 'next'
import Link from 'next/link'
import { YardScene } from '@/components/yard/YardScene'
import { getCatalogEntries } from '@/lib/catalog'

// Каталог нужен только как запасной мангал и для названий — статики достаточно
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Двор',
  description:
    'Ночь, изба, мангал уже разгорелся. Посмотрите, как выбранный мангал и ящик вашего пива стоят у дома.',
}

export default async function YardPage() {
  const catalog = await getCatalogEntries()

  return (
    <main className="mx-auto max-w-5xl px-2 py-4">
      <Link href="/#arsenal" className="text-hud text-steel-500 uppercase hover:text-coal">
        ← В арсенал
      </Link>

      <h1 className="mt-2 text-hud-lg text-coal uppercase md:text-[48px] md:leading-[56px]">Двор</h1>
      <p className="mt-1 prose-column text-steel-500">
        Вечер, изба, угли уже взялись. Здесь стоит то, что вы выбрали: мангал из арсенала и
        ящик пива из пивоварни.
      </p>

      <div className="mt-4">
        <YardScene catalog={catalog} />
      </div>
    </main>
  )
}
