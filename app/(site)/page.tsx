import type { Metadata } from 'next'
import { Hero } from '@/components/storefront/Hero'
import { Arsenal } from '@/components/storefront/Arsenal'
import { Production } from '@/components/storefront/Production'
import { Contacts } from '@/components/storefront/Contacts'
import { getActiveProducts } from '@/lib/catalog'
import { getSettings } from '@/lib/settings.server'
import { formatMoney } from '@/lib/money'

// Витрина статична и переклеивается по тегу products из админки
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: settings.hero.title,
    description: settings.hero.subtitle,
    openGraph: { title: settings.hero.title, description: settings.hero.subtitle },
  }
}

export default async function HomePage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()])
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/product/${p.slug}`,
    })),
  }

  return (
    <main>
      <Hero settings={settings} demo={demo} />
      <Arsenal products={products} />
      <Production blocks={settings.production} />
      <Contacts contacts={settings.contacts} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <p className="sr-only">
        Цены от {formatMoney(Math.min(...products.map((p) => p.priceMinor)), products[0]?.currency)}
      </p>
    </main>
  )
}
