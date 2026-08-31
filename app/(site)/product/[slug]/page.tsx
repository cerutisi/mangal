import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductDetail } from '@/components/storefront/ProductDetail'
import { getActiveProducts, getProductBySlug } from '@/lib/catalog'

export const revalidate = 60

export async function generateStaticParams() {
  const products = await getActiveProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Мангал не найден' }

  return {
    title: product.title,
    description: product.tagline,
    openGraph: {
      title: product.title,
      description: product.tagline,
      images: [{ url: product.spriteUrl, width: 96, height: 96, alt: product.spriteAlt }],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.isActive) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.tagline,
    image: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${product.spriteUrl}`,
    offers: {
      '@type': 'Offer',
      price: (product.priceMinor / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <main className="mx-auto max-w-5xl px-2 py-4">
      <Link href="/#arsenal" className="text-hud text-steel-500 uppercase hover:text-coal">
        ← В арсенал
      </Link>

      <div className="mt-3">
        <ProductDetail product={product} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
