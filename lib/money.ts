export type Currency = 'PLN' | 'BYN' | 'RUB'

const SUFFIX: Record<Currency, string> = { PLN: 'zł', BYN: 'Br', RUB: '₽' }

/** Неразрывный узкий пробел — цена не должна разрываться переносом строки. */
const NNBSP = ' '

/**
 * Форматирует минорные единицы (гроши) как «4 350 zł».
 * Дробную часть показываем только если она есть — у мангалов её обычно нет.
 */
export function formatMoney(minor: number, currency: string = 'PLN'): string {
  const suffix = SUFFIX[currency as Currency] ?? currency
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(Math.round(minor))
  const major = Math.floor(abs / 100)
  const cents = abs % 100
  const grouped = String(major).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP)
  const body = cents ? `${grouped},${String(cents).padStart(2, '0')}` : grouped
  return `${sign}${body}${NNBSP}${suffix}`
}

/** '4350' | '4350.50' | '4 350,50' -> 435050 */
export function parseMoneyToMinor(input: string): number | null {
  const normalized = input.replace(/[\s  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [major, cents = ''] = normalized.split('.')
  return Number(major) * 100 + Number(cents.padEnd(2, '0'))
}
