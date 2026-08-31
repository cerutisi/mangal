import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Две сборки из одного кодбейза.
 *
 * Обычная: полноценный сайт с заказами и админкой.
 * Демо (BUILD_TARGET=demo): статический экспорт под GitHub Pages. Серверного
 * кода там нет вообще, поэтому маршруты с Server Actions, Route Handlers и
 * middleware в неё не попадают — они лежат в файлах *.server.tsx, а демо-сборка
 * не считает такое расширение маршрутом. Остаётся витрина: hero, арсенал,
 * карточки товаров и корзина в localStorage.
 */
const isDemo = process.env.BUILD_TARGET === 'demo'

/**
 * Заголовки безопасности для публичной части.
 *
 * Компромисс, который нужно знать: App Router встраивает RSC-payload инлайновыми
 * <script>. Убрать 'unsafe-inline' для них можно только через nonce, а nonce
 * несовместим со статической генерацией — витрина стала бы динамической и
 * потеряла бы ISR и целевой LCP. Поэтому строгий nonce-CSP включён только для
 * /admin/* (см. middleware.server.ts) — там страницы и так динамические, а риск
 * XSS выше. Инлайновых скриптов собственного авторства в проекте нет:
 * JSON-LD не исполняется.
 */
const PUBLIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" +
    (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const COMMON_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Иначе Next поднимается до домашнего каталога из-за чужого lock-файла
  // и тащит в трейс лишние файлы
  outputFileTracingRoot: path.join(__dirname),

  // Обычная сборка видит и обычные маршруты, и серверные; демо — только обычные
  pageExtensions: isDemo ? ['tsx', 'ts'] : ['server.tsx', 'server.ts', 'tsx', 'ts'],

  ...(isDemo
    ? {
        output: 'export' as const,
        images: { unoptimized: true },
        // Проект-страница живёт в подкаталоге: cerutisi.github.io/mangal/.
        // Для своего домена достаточно очистить NEXT_PUBLIC_BASE_PATH.
        basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
        // Ссылки без завершающего слэша на Pages отдают 404
        trailingSlash: true,
      }
    : {
        async headers() {
          return [
            {
              // CSP админки ставит middleware — здесь её не перекрываем
              source: '/((?!admin).*)',
              headers: [{ key: 'Content-Security-Policy', value: PUBLIC_CSP }, ...COMMON_HEADERS],
            },
            { source: '/admin/:path*', headers: COMMON_HEADERS },
          ]
        },
      }),
}

export default nextConfig
