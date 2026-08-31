import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { getCatalogEntries } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Оформление заявки',
  description: 'Оставьте контакты — менеджер подтвердит заказ и сроки.',
  robots: { index: false },
}

export default async function CheckoutPage() {
  const catalog = await getCatalogEntries()
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  return (
    <main className="mx-auto max-w-5xl px-2 py-4">
      <Link href="/#arsenal" className="text-hud text-steel-500 uppercase hover:text-coal">
        ← В арсенал
      </Link>

      <h1 className="mt-2 text-hud-lg text-bone uppercase">Оформление заявки</h1>
      <p className="mt-1 prose-column text-steel-500">
        Заполните контакты. Менеджер свяжется, подтвердит наличие и сроки, назовёт итоговую сумму.
      </p>

      <div className="mt-4">
        <CheckoutForm catalog={catalog} demo={demo} />
      </div>
    </main>
  )
}
