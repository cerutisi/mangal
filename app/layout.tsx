import type { Metadata, Viewport } from 'next'
import { Handjet, IBM_Plex_Mono } from 'next/font/google'
import { getSettings } from '@/lib/settings.server'
import './globals.css'

// Кириллица проверена вживую: Handjet рисует заглавные ровно и без артефактов.
// Pixelify Sans отвергнут — его кириллическая «К» идёт с лишним штрихом («СТАЛЌЕР»).
const pixel = Handjet({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-pixel',
  display: 'swap',
})

const plex = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Мангалы из чёрной стали',
    template: '%s — Мангалы из чёрной стали',
  },
  description:
    'Мастерская стальных мангалов: лист 3–10 мм, сплошной шов, термостойкая эмаль. Гарантия 5 лет на прогар.',
  openGraph: { type: 'website', locale: 'ru_RU' },
}

export const viewport: Viewport = {
  themeColor: '#0b0908',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="ru" data-theme={settings.theme} className={`${pixel.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  )
}
