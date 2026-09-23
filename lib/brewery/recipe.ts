import {
  BOTTLING_MINOR,
  LABELS,
  ingredient,
  type ExtraId,
  type HopId,
  type LabelId,
  type MaltId,
  type YeastId,
} from './ingredients'

export type BeerRecipe = {
  malt: MaltId
  hops: HopId[]
  yeast: YeastId
  extra: ExtraId | null
  name: string
  label: LabelId
}

export type BeerStats = {
  abv: number
  ibu: number
  ebc: number
  style: string
  /** Цвет пива в бутылке */
  color: string
  notes: string[]
  /** Сколько дней выдерживаем — честно, пиво не варится за вечер */
  agingDays: [number, number]
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function beerStats(recipe: Pick<BeerRecipe, 'malt' | 'hops' | 'yeast' | 'extra'>): BeerStats {
  const malt = ingredient(recipe.malt)
  const hops = recipe.hops.map(ingredient)
  const yeast = ingredient(recipe.yeast)
  const extra = recipe.extra ? ingredient(recipe.extra) : null

  const ebc = (malt.ebc ?? 0) + (extra?.ebc ?? 0)
  const ibu = Math.min(100, hops.reduce((sum, h) => sum + (h.ibu ?? 0), 0))
  const abv = round1((malt.abv ?? 0) + (yeast.abv ?? 0) + (extra?.abv ?? 0))

  return {
    abv,
    ibu,
    ebc,
    style: styleName(recipe, { abv, ibu, ebc }),
    color: ebcToHex(ebc),
    notes: [malt, ...hops, yeast, ...(extra ? [extra] : [])].map((i) => i.note),
    agingDays: AGING[recipe.yeast],
  }
}

const AGING: Record<YeastId, [number, number]> = {
  lager: [28, 35],
  ale: [18, 21],
  weizen: [14, 18],
  belgian: [30, 40],
}

const EXTRA_PREFIX: Record<ExtraId, string> = {
  cherry: 'ВИШНЁВЫЙ',
  honey: 'МЕДОВЫЙ',
  coffee: 'КОФЕЙНЫЙ',
  orange: 'ЦИТРУСОВЫЙ',
  chili: 'ОГНЕННЫЙ',
}

function styleName(
  recipe: Pick<BeerRecipe, 'malt' | 'yeast' | 'extra'>,
  { abv, ibu, ebc }: { abv: number; ibu: number; ebc: number },
): string {
  let base: string
  if (recipe.yeast === 'weizen' && recipe.malt === 'wheat') base = 'ВАЙЦЕН'
  else if (recipe.yeast === 'belgian') base = abv >= 7 ? 'ТРИПЕЛЬ' : 'БЕЛЬГИЙСКИЙ ЭЛЬ'
  else if (ebc >= 50) base = recipe.yeast === 'lager' ? 'ТЁМНЫЙ ЛАГЕР' : 'СТАУТ'
  else if (recipe.yeast === 'lager') {
    base = ebc < 8 ? 'ПИЛЬЗНЕР' : ebc < 20 ? 'ВЕНСКИЙ ЛАГЕР' : 'ЯНТАРНЫЙ ЛАГЕР'
  } else if (ibu >= 50) base = 'IPA'
  else base = ebc >= 20 ? 'ЯНТАРНЫЙ ЭЛЬ' : 'ПЭЙЛ-ЭЛЬ'

  const prefixes = [
    recipe.malt === 'smoked' ? 'КОПЧЁНЫЙ' : null,
    recipe.extra ? EXTRA_PREFIX[recipe.extra] : null,
  ].filter(Boolean)

  return [...prefixes, base].join(' ')
}

/**
 * EBC → цвет. Опорные точки — стандартная шкала SRM (SRM ≈ EBC × 0,508),
 * между ними линейная интерполяция. Точность «на глаз» здесь и нужна.
 */
const SRM_STOPS: [number, [number, number, number]][] = [
  [1, [255, 230, 153]],
  [3, [255, 202, 90]],
  [5, [251, 177, 35]],
  [8, [234, 143, 0]],
  [12, [207, 105, 0]],
  [17, [181, 76, 0]],
  [24, [147, 52, 0]],
  [30, [110, 36, 8]],
  [40, [54, 31, 27]],
]

export function ebcToHex(ebc: number): string {
  const srm = Math.max(1, Math.min(40, ebc * 0.508))
  let i = SRM_STOPS.findIndex(([s]) => s >= srm)
  if (i <= 0) i = 1
  const [s0, c0] = SRM_STOPS[i - 1]
  const [s1, c1] = SRM_STOPS[i]
  const t = (srm - s0) / (s1 - s0)
  return rgbHex(c0.map((v, k) => v + (c1[k] - v) * t) as [number, number, number])
}

function rgbHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return rgbHex(
    rgb.map((v) => (amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))) as [number, number, number],
  )
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

/** «6,0%», «5,3%» — десятичная запятая, как принято в русском тексте */
export function formatAbv(abv: number): string {
  return `${abv.toFixed(1).replace('.', ',')}%`
}

/** «18–21 день», «28–35 дней»: существительное согласуется с последним числом */
export function formatDays([from, to]: [number, number]): string {
  const n = to % 100
  const last = to % 10
  const word =
    n >= 11 && n <= 14 ? 'дней' : last === 1 ? 'день' : last >= 2 && last <= 4 ? 'дня' : 'дней'
  return `${from}–${to} ${word}`
}

/** Этикетка по умолчанию — контрастная к пиву, чтобы не сливались */
export function contrastLabel(beerColor: string): 'bone' | 'steel' {
  return isLight(beerColor) ? 'steel' : 'bone'
}

/** Цена бутылки 0,5 л. Считается одинаково на клиенте и на сервере. */
export function beerPriceMinor(recipe: Pick<BeerRecipe, 'malt' | 'hops' | 'yeast' | 'extra'>): number {
  const parts = [recipe.malt, ...recipe.hops, recipe.yeast, ...(recipe.extra ? [recipe.extra] : [])]
  return BOTTLING_MINOR + parts.reduce((sum, id) => sum + ingredient(id).priceMinor, 0)
}

/** Короткий стабильный хэш — имя пива в ключе строки корзины не нужно целиком */
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/**
 * Ключ строки корзины. Одинаковый рецепт с тем же именем и этикеткой
 * складывается в одну строку, любой отличающийся — отдельная.
 */
export function beerLineId(recipe: BeerRecipe): string {
  const hops = [...recipe.hops].sort().join('+')
  return `beer:${recipe.malt}.${hops}.${recipe.yeast}.${recipe.extra ?? '-'}.${recipe.label}.${hash(recipe.name)}`
}

export function beerTitle(recipe: BeerRecipe): string {
  return `ПИВО «${recipe.name}»`
}

/** Снимок для заказа: менеджеру нужен состав, а не только название */
export function beerOrderTitle(recipe: BeerRecipe): string {
  const stats = beerStats(recipe)
  const parts = [
    ingredient(recipe.malt).title,
    recipe.hops.map((h) => ingredient(h).title).join(' + '),
    ingredient(recipe.yeast).title,
    recipe.extra ? ingredient(recipe.extra).title : null,
  ].filter(Boolean)
  return `${beerTitle(recipe)} · ${stats.style}, ${formatAbv(stats.abv)} · ${parts.join(', ')} · 0,5 л`
}

/* ------------------------------------------------------------------
   Бутылка: пиксельная карта 24×24 → SVG. Квадрат выбран намеренно:
   слоты корзины квадратные, а 24 делит 48, 96 и 192 нацело — масштаб
   всегда целый, пиксели не плывут.
   ------------------------------------------------------------------ */

const BOTTLE = [
  '........................',
  '..........CCCC..........',
  '..........cccc..........',
  '..........GFFG..........',
  '..........GFFG..........',
  '..........GLlG..........',
  '..........GLlG..........',
  '.........GLLllG.........',
  '........GHLLLllG........',
  '.......GHLLLLLllG.......',
  '.......GHLLLLLllG.......',
  '.......GBBBBBBBBG.......',
  '.......GBTTTTTTBG.......',
  '.......GBBBBBBBBG.......',
  '.......GBTTTTBBBG.......',
  '.......GBBBBBBBBG.......',
  '.......GHLLLLLllG.......',
  '.......GHLLLLLllG.......',
  '.......GHLLLLLllG.......',
  '.......GLLLLLLllG.......',
  '.......GLLLLLLllG.......',
  '.......GGGGGGGGGG.......',
  '........ssssssss........',
  '........................',
]

export function bottleSvg(beerColor: string, labelHex: string): string {
  const palette: Record<string, string> = {
    C: '#c9a227',
    c: '#8a6d12',
    G: '#1a1410',
    F: '#fff4dc',
    L: beerColor,
    l: shade(beerColor, -0.3),
    H: shade(beerColor, 0.45),
    B: labelHex,
    T: isLight(labelHex) ? '#17130f' : '#fff4dc',
    s: '#00000055',
  }

  // Одна полоса на серию одинаковых пикселей в строке — SVG в разы короче
  const rects: string[] = []
  BOTTLE.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let end = x
      while (end < row.length && row[end] === ch) end++
      if (ch !== '.') {
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${palette[ch]}"/>`)
      }
      x = end
    }
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export function bottleDataUrl(recipe: BeerRecipe): string {
  const label = LABELS.find((l) => l.id === recipe.label) ?? LABELS[0]
  return `data:image/svg+xml;utf8,${encodeURIComponent(bottleSvg(beerStats(recipe).color, label.hex))}`
}
