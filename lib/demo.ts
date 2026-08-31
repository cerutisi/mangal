/**
 * Статическая демо-сборка под GitHub Pages.
 * Сервера там нет: заказ оформить нельзя, админки не существует.
 * Витрина, карточки и корзина работают полностью.
 */
export const IS_STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === 'true'

/** Подкаталог проекта на Pages, например '/mangal'. Пусто для своего домена. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** basePath к статике из CSS: next/image и next/link подставляют его сами, CSS — нет. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`
}

export const DEMO_NOTICE =
  'ВИТРИНА-ДЕМО. ЗАКАЗ НА САЙТЕ НЕ ОФОРМЛЯЕТСЯ — ПОЗВОНИТЕ ИЛИ НАПИШИТЕ В МЕССЕНДЖЕР.'
