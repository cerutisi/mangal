import type { Metadata } from 'next'
import Link from 'next/link'
import { CartPageList } from '@/components/hud/CartPageList'
import { getCatalogEntries } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Корзина',
  robots: { index: false },
}

/** Отдельный роут корзины — для мобильных и для прямых ссылок. */
export default async function CartPage() {
  const catalog = await getCatalogEntries()

  return (
    <main className="mx-auto max-w-3xl px-2 py-4">
      <Link href="/#arsenal" className="text-hud text-steel-500 uppercase hover:text-coal">
        ← В арсенал
      </Link>

      <h1 className="mt-2 text-hud-lg text-bone uppercase">Корзина</h1>

      <div className="mt-3">
        <CartPageList catalog={catalog} />
      </div>
    </main>
  )
}
