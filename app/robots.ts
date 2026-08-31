import type { MetadataRoute } from 'next'

// Статический экспорт требует явного указания: файл не пересобирается на лету
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/checkout', '/order'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
