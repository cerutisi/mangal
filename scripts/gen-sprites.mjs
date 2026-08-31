// Генерация всей пиксель-графики проекта. Собственная графика, никаких чужих ассетов.
// Запуск: npm run sprites
import fs from 'node:fs'
import path from 'node:path'
import { canvas, encodePng, px, rect, hline, vline, trapezoid, scale, rng, PAL } from './pixel.mjs'

const OUT = path.join(process.cwd(), 'public', 'sprites')
fs.mkdirSync(OUT, { recursive: true })

function save(name, c, factor = 1) {
  const out = factor > 1 ? scale(c, factor) : c
  const file = path.join(OUT, `${name}.png`)
  fs.writeFileSync(file, encodePng(out))
  return { name, bytes: fs.statSync(file).size, w: out.w, h: out.h }
}

/** Двухцветная объёмная рамка: свет сверху/слева, тень снизу/справа. */
function bevel(c, x, y, w, h, fill, light, dark) {
  rect(c, x, y, w, h, fill)
  hline(c, x, y, w, light)
  vline(c, x, y, h, light)
  hline(c, x, y + h - 1, w, dark)
  vline(c, x + w - 1, y, h, dark)
}

const HEAT = [
  { core: PAL.ash, glow: PAL.steel700, spark: null },
  { core: PAL.rust, glow: PAL.ash, spark: PAL.ember },
  { core: PAL.ember, glow: PAL.rust, spark: PAL.coal },
  { core: PAL.coal, glow: PAL.ember, spark: PAL.white },
]

/** Угли в жаровне: строка из тлеющих блоков, яркость зависит от heat. */
function coals(c, x, y, w, heat, seed, phase = 0) {
  const r = rng(seed)
  const h = HEAT[heat]
  for (let i = 0; i < w; i++) {
    const v = r()
    px(c, x + i, y, v > 0.55 ? h.core : h.glow)
    if (h.spark && (i + phase) % 4 === 1 && v > 0.4) px(c, x + i, y - 1, h.spark)
  }
}

/**
 * Мангал 32×32, вид три четверти. Параметры дают восемь узнаваемо разных корпусов.
 * top: 'skewers' | 'grate' | 'lid'
 * legs: 'straight' | 'x' | 'stand'
 */
function drawMangal(c, o = {}) {
  const {
    ox = 0,
    oy = 0,
    width = 26,
    bodyH = 9,
    thick = 1,
    top = 'skewers',
    legs = 'straight',
    heat = 2,
    sideTable = false,
    seed = 7,
    phase = 0,
  } = o

  const cx = ox + 16
  const xl = cx - Math.floor(width / 2)
  const xr = xl + width - 1
  const yRim = oy + 13
  const yBot = yRim + bodyH

  // Корпус: трапеция, низ уже верха
  trapezoid(c, yRim, yBot, xl, xr, xl + 3, xr - 3, PAL.steel700)
  // Тень справа и внутри
  for (let j = 0; j <= yBot - yRim; j++) {
    const t = j / (yBot - yRim)
    const r = Math.round(xr + (xr - 3 - xr) * t)
    vline(c, r, yRim + j, 1, PAL.steel900)
    if (thick > 1) vline(c, r - 1, yRim + j, 1, PAL.steel900)
  }
  // Кромка — светлая, это верх объёма
  hline(c, xl, yRim, width, PAL.steel300)
  hline(c, xl, yRim + 1, width, PAL.steel500)
  if (thick > 1) hline(c, xl, yRim + 2, width, PAL.steel500)
  // Дно
  hline(c, xl + 3, yBot, width - 6, PAL.steel900)

  // Угли внутри
  coals(c, xl + 2, yRim + 2 + (thick > 1 ? 1 : 0), width - 4, heat, seed, phase)

  // Вентиляционные отверстия по борту
  for (let i = xl + 3; i < xr - 2; i += 4) px(c, i, yRim + 5, PAL.steel900)

  // Ручки по бокам
  const yH = yRim + 3
  rect(c, xl - 3, yH, 3, 1, PAL.steel500)
  px(c, xl - 3, yH + 1, PAL.steel300)
  rect(c, xr + 1, yH, 3, 1, PAL.steel500)
  px(c, xr + 3, yH + 1, PAL.steel900)

  // Верх: шампуры, решётка или крышка
  if (top === 'skewers') {
    const count = width > 24 ? 5 : 3
    const step = Math.floor((width - 6) / (count - 1))
    for (let i = 0; i < count; i++) {
      const x = xl + 3 + i * step
      vline(c, x, yRim - 3, 3, PAL.steel300)
      px(c, x, yRim - 4, PAL.bone)
      // кусок мяса на шампуре
      rect(c, x - 1, yRim - 2, 3, 1, i % 2 ? PAL.rust : PAL.blood)
    }
  } else if (top === 'grate') {
    hline(c, xl + 1, yRim - 2, width - 2, PAL.steel300)
    for (let i = xl + 2; i < xr; i += 3) vline(c, i, yRim - 3, 2, PAL.steel500)
    hline(c, xl + 1, yRim - 4, width - 2, PAL.steel500)
  } else if (top === 'lid') {
    trapezoid(c, yRim - 6, yRim - 1, xl + 4, xr - 4, xl, xr, PAL.steel500)
    hline(c, xl + 4, yRim - 6, width - 8, PAL.steel300)
    // труба
    rect(c, cx - 1, yRim - 10, 3, 4, PAL.steel700)
    hline(c, cx - 1, yRim - 10, 3, PAL.steel300)
  }

  // Ноги
  const yLegTop = yBot + 1
  const legH = 30 - yLegTop
  if (legs === 'straight') {
    for (const x of [xl + 4, xr - 5]) {
      vline(c, x, yLegTop, legH, PAL.steel500)
      vline(c, x + 1, yLegTop, legH, PAL.steel900)
      hline(c, x - 1, 30, 4, PAL.steel700)
    }
  } else if (legs === 'x') {
    for (let i = 0; i < legH; i++) {
      px(c, xl + 4 + i, yLegTop + i, PAL.steel500)
      px(c, xr - 4 - i, yLegTop + i, PAL.steel500)
    }
    hline(c, xl + 3, 30, 4, PAL.steel700)
    hline(c, xr - 6, 30, 4, PAL.steel700)
  } else {
    rect(c, cx - 2, yLegTop, 4, legH, PAL.steel700)
    vline(c, cx - 2, yLegTop, legH, PAL.steel500)
    vline(c, cx + 1, yLegTop, legH, PAL.steel900)
    rect(c, cx - 6, 29, 12, 2, PAL.steel700)
    hline(c, cx - 6, 29, 12, PAL.steel500)
  }

  if (sideTable) {
    rect(c, xr + 2, yRim + 4, 5, 1, PAL.steel500)
    vline(c, xr + 4, yRim + 5, 4, PAL.steel700)
  }

  // Тень на земле
  for (let i = xl; i <= xr; i += 2) px(c, i, 31, PAL.steel900)
}

const MODELS = [
  { name: 'stalker-6mm', width: 26, bodyH: 9, thick: 2, top: 'skewers', legs: 'straight', heat: 2, seed: 11 },
  { name: 'ochag-3mm', width: 22, bodyH: 8, thick: 1, top: 'skewers', legs: 'x', heat: 1, seed: 23 },
  { name: 'kuznets-8mm', width: 28, bodyH: 10, thick: 2, top: 'skewers', legs: 'straight', heat: 3, seed: 37, sideTable: true },
  { name: 'kolodec-grill', width: 24, bodyH: 9, thick: 1, top: 'grate', legs: 'stand', heat: 2, seed: 41 },
  { name: 'kazan-hybrid', width: 26, bodyH: 10, thick: 2, top: 'lid', legs: 'straight', heat: 3, seed: 53 },
  { name: 'pohod-4mm', width: 18, bodyH: 7, thick: 1, top: 'skewers', legs: 'x', heat: 1, seed: 67 },
  { name: 'bastion-10mm', width: 30, bodyH: 11, thick: 2, top: 'grate', legs: 'straight', heat: 3, seed: 71, sideTable: true },
  { name: 'dym-koptilnya', width: 24, bodyH: 10, thick: 2, top: 'lid', legs: 'stand', heat: 2, seed: 83 },
]

const report = []

for (const m of MODELS) {
  const c = canvas(32, 32)
  drawMangal(c, m)
  report.push(save(m.name, c, 3)) // 96×96
}

/** Морда HUD-корзины: сам мангал с угольками вместо глаз. */
function drawFace(c, state) {
  // state: 0 потух, 1 тлеет, 2 полыхает, 3 реакция на добавление
  const heat = state === 3 ? 3 : state
  const h = HEAT[Math.min(heat, 3)]
  // корпус-морда
  bevel(c, 2, 4, 20, 16, PAL.steel700, PAL.steel500, PAL.steel900)
  // кромка-«каска»
  rect(c, 1, 3, 22, 2, PAL.steel500)
  hline(c, 1, 3, 22, PAL.steel300)
  // ручки-«уши»
  rect(c, 0, 10, 2, 3, PAL.steel500)
  rect(c, 22, 10, 2, 3, PAL.steel500)
  // глаза-угли
  for (const ex of [6, 14]) {
    rect(c, ex, 8, 4, 3, h.core)
    hline(c, ex, 8, 4, h.glow)
    if (state >= 2) {
      px(c, ex + 1, 7, h.spark ?? h.core)
      px(c, ex + 2, 7, PAL.coal)
    }
    if (state === 0) rect(c, ex, 8, 4, 3, PAL.ash)
  }
  // рот-жаровня
  const mouthY = state === 3 ? 14 : 15
  rect(c, 6, mouthY, 12, 3, PAL.steel900)
  coals(c, 6, mouthY + 1, 12, Math.min(heat, 3), 5 + state)
  if (state === 3) {
    // краткая вспышка при добавлении — вертикальные язычки, без стробоскопа
    for (let i = 0; i < 12; i += 3) px(c, 6 + i, mouthY - 1, PAL.white)
  }
  if (state === 0) {
    rect(c, 6, mouthY, 12, 2, PAL.ash)
    hline(c, 6, mouthY, 12, PAL.steel700)
  }
  // ноги
  vline(c, 6, 20, 3, PAL.steel500)
  vline(c, 17, 20, 3, PAL.steel500)
  hline(c, 5, 23, 3, PAL.steel700)
  hline(c, 16, 23, 3, PAL.steel700)
}

for (let s = 0; s <= 3; s++) {
  const c = canvas(24, 24)
  drawFace(c, s)
  report.push(save(`face-${s}`, c, 2)) // 48×48
}

/** Иконки блока производства. */
const ICONS = {
  'icon-steel': (c) => {
    trapezoid(c, 5, 11, 3, 12, 1, 14, PAL.steel500)
    hline(c, 3, 5, 10, PAL.steel300)
    trapezoid(c, 6, 12, 4, 13, 2, 15, PAL.steel700)
    rect(c, 2, 12, 12, 1, PAL.steel900)
  },
  'icon-weld': (c) => {
    rect(c, 3, 3, 3, 6, PAL.steel500)
    hline(c, 3, 3, 3, PAL.steel300)
    for (let i = 0; i < 5; i++) px(c, 6 + i, 9 + i, PAL.steel700)
    rect(c, 9, 9, 3, 3, PAL.coal)
    px(c, 8, 8, PAL.ember)
    px(c, 12, 12, PAL.ember)
    px(c, 13, 8, PAL.white)
    px(c, 7, 13, PAL.white)
  },
  'icon-paint': (c) => {
    rect(c, 4, 2, 8, 4, PAL.steel700)
    hline(c, 4, 2, 8, PAL.steel500)
    rect(c, 6, 6, 4, 8, PAL.steel900)
    rect(c, 6, 7, 4, 6, PAL.rust)
    for (let i = 0; i < 3; i++) px(c, 12 + i, 3 + i * 2, PAL.ember)
  },
  'icon-shield': (c) => {
    trapezoid(c, 2, 9, 3, 12, 3, 12, PAL.steel700)
    trapezoid(c, 9, 14, 3, 12, 7, 8, PAL.steel700)
    hline(c, 3, 2, 10, PAL.steel300)
    vline(c, 3, 2, 8, PAL.steel300)
    vline(c, 12, 2, 8, PAL.steel900)
    rect(c, 6, 5, 4, 2, PAL.moss)
    rect(c, 7, 7, 2, 3, PAL.moss)
  },
}

for (const [name, draw] of Object.entries(ICONS)) {
  const c = canvas(16, 16)
  draw(c)
  report.push(save(name, c, 3)) // 48×48
}

/** Hero: 6 кадров, намеренно низкий фреймрейт ~8 fps. */
const HERO_FRAMES = 6
const heroFrames = []
for (let f = 0; f < HERO_FRAMES; f++) {
  const c = canvas(64, 56)
  const r = rng(101 + f)
  // угли и дым над мангалом
  drawMangal(c, {
    ox: 16,
    oy: 22,
    width: 28,
    bodyH: 10,
    thick: 2,
    top: 'skewers',
    legs: 'straight',
    heat: 3,
    seed: 11,
    phase: f,
  })
  // Искры: поднимаются на f, гаснут к верху
  for (let i = 0; i < 14; i++) {
    const x = 20 + Math.floor(r() * 24)
    const base = 32 - Math.floor(r() * 6)
    const y = base - ((f * 2 + Math.floor(r() * 10)) % 22)
    const life = (base - y) / 22
    px(c, x, y, life > 0.7 ? PAL.rust : life > 0.4 ? PAL.ember : PAL.coal)
  }
  // Дым: редкие блоки, смещаются вбок с кадром
  for (let i = 0; i < 10; i++) {
    const y = 4 + i
    const drift = Math.round(Math.sin((i + f) / 2.2) * 3)
    const x = 30 + drift + Math.floor(r() * 4)
    px(c, x, y, PAL.steel700)
    if (r() > 0.6) px(c, x + 1, y, PAL.steel900)
  }
  heroFrames.push(c)
}

// Один спрайт-лист вместо шести файлов: анимация делается CSS-шагами,
// а значит «спокойный режим» гасит её без единой строчки JS.
const sheet = canvas(64 * HERO_FRAMES, 56)
heroFrames.forEach((frame, i) => {
  for (let y = 0; y < frame.h; y++) {
    for (let x = 0; x < frame.w; x++) {
      const si = (y * frame.w + x) * 4
      if (frame.data[si + 3] === 0) continue
      const di = (y * sheet.w + i * 64 + x) * 4
      frame.data.copy(sheet.data, di, si, si + 4)
    }
  }
})
report.push(save('hero-sheet', sheet, 4)) // 1536×224
report.push(save('hero-still', heroFrames[2], 4)) // кадр для спокойного режима

const total = report.reduce((s, r) => s + r.bytes, 0)
console.log(report.map((r) => `${r.name.padEnd(16)} ${r.w}×${r.h}  ${r.bytes} B`).join('\n'))
console.log(`\nВсего ${report.length} файлов, ${(total / 1024).toFixed(1)} КБ`)
