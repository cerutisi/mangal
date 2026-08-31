import type { MetadataRoute } from 'next'
import { getActiveProducts } from '@/lib/catalog'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const products = await getActiveProducts()

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: new Date(product.updatedAt * 1000),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
