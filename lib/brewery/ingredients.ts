/**
 * Сырьё пивоварни. Единый справочник для клиента и сервера:
 * клиент по нему показывает рецепт и ориентировочную цену, сервер — пересчитывает
 * цену при заказе. Клиентской цене сервер не верит, как и с мангалами.
 */

export type IngredientKind = 'malt' | 'hop' | 'yeast' | 'extra'

export type Ingredient = {
  id: string
  kind: IngredientKind
  title: string
  /** Вкусовая нота, одной строкой */
  note: string
  /** Имя спрайта в public/sprites */
  icon: string
  /** Вклад в цену бутылки 0,5 л, в грошах */
  priceMinor: number
  /** Цвет, единицы EBC. У солода — база, у добавки — прибавка */
  ebc?: number
  /** Горечь, единицы IBU */
  ibu?: number
  /** Крепость, %. У солода — база, у дрожжей и добавок — прибавка */
  abv?: number
}

export const MALTS = [
  { id: 'pils', kind: 'malt', title: 'ПИЛЬЗЕНСКИЙ', note: 'хлеб, мёд, чистота', icon: 'malt-pils', priceMinor: 150, ebc: 4, abv: 4.8 },
  { id: 'wheat', kind: 'malt', title: 'ПШЕНИЧНЫЙ', note: 'мягкость, лёгкая кислинка', icon: 'malt-wheat', priceMinor: 160, ebc: 5, abv: 5.0 },
  { id: 'vienna', kind: 'malt', title: 'ВЕНСКИЙ', note: 'сухарик, орех', icon: 'malt-vienna', priceMinor: 170, ebc: 9, abv: 5.2 },
  { id: 'smoked', kind: 'malt', title: 'КОПЧЁНЫЙ', note: 'дым с нашего мангала', icon: 'malt-smoked', priceMinor: 230, ebc: 14, abv: 5.3 },
  { id: 'caramel', kind: 'malt', title: 'КАРАМЕЛЬНЫЙ', note: 'ириска, сухофрукты', icon: 'malt-caramel', priceMinor: 190, ebc: 28, abv: 5.4 },
  { id: 'chocolate', kind: 'malt', title: 'ШОКОЛАДНЫЙ', note: 'какао, обжарка', icon: 'malt-chocolate', priceMinor: 220, ebc: 75, abv: 5.6 },
] as const satisfies readonly Ingredient[]

export const HOPS = [
  { id: 'saaz', kind: 'hop', title: 'ЗААЦ', note: 'пряность, луговые травы', icon: 'hop-saaz', priceMinor: 120, ibu: 18 },
  { id: 'cascade', kind: 'hop', title: 'КАСКАД', note: 'грейпфрут, хвоя', icon: 'hop-cascade', priceMinor: 160, ibu: 32 },
  { id: 'citra', kind: 'hop', title: 'ЦИТРА', note: 'манго, лайм', icon: 'hop-citra', priceMinor: 210, ibu: 38 },
  { id: 'magnum', kind: 'hop', title: 'МАГНУМ', note: 'чистая плотная горечь', icon: 'hop-magnum', priceMinor: 140, ibu: 52 },
] as const satisfies readonly Ingredient[]

export const YEASTS = [
  { id: 'lager', kind: 'yeast', title: 'ЛАГЕРНЫЕ', note: 'чисто и свежо', icon: 'yeast-lager', priceMinor: 90, abv: 0 },
  { id: 'ale', kind: 'yeast', title: 'ЭЛЕВЫЕ', note: 'фруктовые эфиры', icon: 'yeast-ale', priceMinor: 90, abv: 0.4 },
  { id: 'weizen', kind: 'yeast', title: 'ПШЕНИЧНЫЕ', note: 'банан, гвоздика', icon: 'yeast-weizen', priceMinor: 110, abv: 0.2 },
  { id: 'belgian', kind: 'yeast', title: 'БЕЛЬГИЙСКИЕ', note: 'перец, груша', icon: 'yeast-belgian', priceMinor: 150, abv: 1.6 },
] as const satisfies readonly Ingredient[]

export const EXTRAS = [
  { id: 'cherry', kind: 'extra', title: 'ВИШНЯ', note: 'кислая вишня', icon: 'extra-cherry', priceMinor: 180, ebc: 6, abv: 0.3 },
  { id: 'honey', kind: 'extra', title: 'МЁД', note: 'гречишный мёд', icon: 'extra-honey', priceMinor: 170, ebc: 2, abv: 0.6 },
  { id: 'coffee', kind: 'extra', title: 'КОФЕ', note: 'эспрессо', icon: 'extra-coffee', priceMinor: 190, ebc: 25 },
  { id: 'orange', kind: 'extra', title: 'ЦЕДРА', note: 'горький апельсин', icon: 'extra-orange', priceMinor: 120 },
  { id: 'chili', kind: 'extra', title: 'ЧИЛИ', note: 'жгучее послевкусие', icon: 'extra-chili', priceMinor: 130 },
] as const satisfies readonly Ingredient[]

export type MaltId = (typeof MALTS)[number]['id']
export type HopId = (typeof HOPS)[number]['id']
export type YeastId = (typeof YEASTS)[number]['id']
export type ExtraId = (typeof EXTRAS)[number]['id']

/** Кортежи id для z.enum: ему нужен непустой литеральный массив */
export const MALT_IDS = MALTS.map((m) => m.id) as [MaltId, ...MaltId[]]
export const HOP_IDS = HOPS.map((h) => h.id) as [HopId, ...HopId[]]
export const YEAST_IDS = YEASTS.map((y) => y.id) as [YeastId, ...YeastId[]]
export const EXTRA_IDS = EXTRAS.map((e) => e.id) as [ExtraId, ...ExtraId[]]

const ALL: readonly Ingredient[] = [...MALTS, ...HOPS, ...YEASTS, ...EXTRAS]
const BY_ID = new Map(ALL.map((i) => [i.id, i]))

export function ingredient(id: string): Ingredient {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Неизвестное сырьё: ${id}`)
  return found
}

export const INVENTORY: { kind: IngredientKind; title: string; items: readonly Ingredient[] }[] = [
  { kind: 'malt', title: 'СОЛОД', items: MALTS },
  { kind: 'hop', title: 'ХМЕЛЬ', items: HOPS },
  { kind: 'yeast', title: 'ДРОЖЖИ', items: YEASTS },
  { kind: 'extra', title: 'ДОБАВКИ', items: EXTRAS },
]

/** Цвета этикетки на выбор. Hex, а не CSS-переменные: бутылка — картинка. */
export const LABELS = [
  { id: 'ember', title: 'Жар', hex: '#f2701d' },
  { id: 'bone', title: 'Кость', hex: '#ddd0bb' },
  { id: 'moss', title: 'Мох', hex: '#7ba428' },
  { id: 'blood', title: 'Кровь', hex: '#a81616' },
  { id: 'steel', title: 'Сталь', hex: '#463a30' },
] as const

export type LabelId = (typeof LABELS)[number]['id']
export const LABEL_IDS = LABELS.map((l) => l.id) as [LabelId, ...LabelId[]]

/** Розлив: бутылка, этикетка, крышка, CO₂ — фикс на бутылку 0,5 л */
export const BOTTLING_MINOR = 900
export const BEER_CURRENCY = 'PLN'
export const MAX_HOPS = 2
