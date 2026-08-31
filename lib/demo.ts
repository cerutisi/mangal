/**
 * Статическая демо-сборка под GitHub Pages.
 * Сервера там нет: заказ оформить нельзя, админки не существует.
 * Витрина, карточки и корзина работают полностью.
 */
export const IS_STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === 'true'

/** Подкаталог проекта на Pages, например '/mangal'. Пусто для своего домена. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * Приписывает basePath к пути в public/.
 *
 * next/link и бандлы Next получают basePath сами, а вот next/image с
 * unoptimized — нет: он отдаёт src как есть, и на Pages путь уходит в корень
 * домена мимо подкаталога проекта. CSS про basePath тоже не знает.
 */
export function asset(path: string): string {
  if (!BASE_PATH || !path.startsWith('/') || path.startsWith(`${BASE_PATH}/`)) return path
  return `${BASE_PATH}${path}`
}

export const DEMO_NOTICE =
  'ВИТРИНА-ДЕМО. ЗАКАЗ НА САЙТЕ НЕ ОФОРМЛЯЕТСЯ — ПОЗВОНИТЕ ИЛИ НАПИШИТЕ В МЕССЕНДЖЕР.'
