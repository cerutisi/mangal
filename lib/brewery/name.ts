/**
 * Правило для имени на этикетке. Отдельно от zod-схемы, чтобы клиент пивоварни
 * не тащил в бандл zod и описание таблиц. Схема заказа использует эти же
 * константы и сообщения — правило одно, проверок две.
 */
export const BEER_NAME_MAX = 24

/** Имя печатается на этикетке и уходит в письма — только текст, без разметки */
export const BEER_NAME_PATTERN = /^[\p{L}\p{N} .,!?«»"'-]+$/u

export const BEER_NAME_MESSAGES = {
  empty: 'Дайте пиву имя',
  tooLong: `Имя не длиннее ${BEER_NAME_MAX} символов`,
  pattern: 'В имени — только буквы, цифры, пробел и знаки препинания',
} as const

export function beerNameError(raw: string): string | null {
  const name = raw.trim()
  if (name.length === 0) return BEER_NAME_MESSAGES.empty
  if (name.length > BEER_NAME_MAX) return BEER_NAME_MESSAGES.tooLong
  if (!BEER_NAME_PATTERN.test(name)) return BEER_NAME_MESSAGES.pattern
  return null
}
