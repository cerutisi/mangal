import { LABELS } from './ingredients'
import { beerStats, shade, type BeerRecipe } from './recipe'

/** Сколько бутылок видно в ящике на сцене двора */
export const CRATE_SLOTS = 6
export const CRATE_W = 26
export const CRATE_H = 17

export type CrateBottle = { beer: string; label: string }

/**
 * Какие бутылки поставить в ящик. Сорта чередуются по кругу, чтобы при
 * нескольких сортах в корзине в ящике был виден каждый, а не шесть первых.
 */
export function crateBottles(lines: { recipe: BeerRecipe; qty: number }[]): CrateBottle[] {
  const left = lines.map((l) => l.qty)
  const bottles: CrateBottle[] = []
  while (bottles.length < CRATE_SLOTS && left.some((n) => n > 0)) {
    lines.forEach((line, i) => {
      if (left[i] <= 0 || bottles.length >= CRATE_SLOTS) return
      left[i]--
      const label = LABELS.find((l) => l.id === line.recipe.label) ?? LABELS[0]
      bottles.push({ beer: beerStats(line.recipe).color, label: label.hex })
    })
  }
  return bottles
}

const WOOD = '#a87a48'
const WOOD_LIGHT = '#c89a60'
const WOOD_DARK = '#7a5630'
const INSIDE = '#1a1410'

/**
 * Ящик, вид сбоку, 26×17: над бортом торчат горлышки, между рейками видно
 * пиво и этикетки. Пустые места остаются пустыми — ящик честно показывает,
 * сколько бутылок выбрано.
 */
export function crateSvg(bottles: CrateBottle[]): string {
  const rects: string[] = []
  const r = (x: number, y: number, w: number, h: number, fill: string) =>
    rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`)

  r(1, 16, 24, 1, '#00000055') // тень
  r(1, 4, 24, 12, INSIDE)

  bottles.slice(0, CRATE_SLOTS).forEach((bottle, i) => {
    const x = 1 + i * 4
    r(x + 1, 0, 2, 1, '#c9a227') // крышка
    r(x + 1, 1, 2, 2, shade(bottle.beer, -0.25)) // горлышко
    r(x + 1, 1, 1, 2, shade(bottle.beer, 0.3))
    r(x, 3, 3, 4, bottle.beer) // плечи и тело в верхнем просвете
    r(x, 3, 1, 4, shade(bottle.beer, 0.4))
    r(x, 10, 3, 2, bottle.label) // этикетка в нижнем просвете
  })

  r(0, 4, 26, 1, WOOD_LIGHT) // верхний борт
  for (const y of [7, 12]) {
    r(0, y, 26, 3, WOOD)
    r(0, y, 26, 1, WOOD_LIGHT)
    r(0, y + 2, 26, 1, WOOD_DARK)
  }
  r(11, 8, 4, 1, INSIDE) // прорезь-ручка
  r(0, 15, 26, 1, '#5a3e22')
  for (const x of [0, 25]) {
    r(x, 4, 1, 12, WOOD_DARK) // стойки
    r(x, 8, 1, 1, '#2a1a0e') // гвозди
    r(x, 13, 1, 1, '#2a1a0e')
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CRATE_W} ${CRATE_H}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export function crateDataUrl(bottles: CrateBottle[]): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(crateSvg(bottles))}`
}
