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

/* ------------------------------------------------------------------
   Пивоварня: сырьё и котёл
   ------------------------------------------------------------------ */

const BURLAP = '#b89a6a'
const BURLAP_DARK = '#7d6440'
const BURLAP_LIGHT = '#d8c090'

/** Мешок солода: мешковина, завязка, полоса и зёрна цвета солода. */
function drawSack(c, grain) {
  rect(c, 6, 1, 4, 2, BURLAP_DARK) // завязка
  hline(c, 5, 1, 1, BURLAP_DARK)
  hline(c, 10, 1, 1, BURLAP_DARK)
  rect(c, 5, 3, 6, 2, BURLAP) // горловина
  trapezoid(c, 5, 14, 4, 11, 2, 13, BURLAP)
  for (let y = 5; y <= 14; y++) px(c, 13 - Math.max(0, 14 - y > 8 ? 1 : 0), y, BURLAP_DARK)
  vline(c, 4, 6, 7, BURLAP_LIGHT)
  hline(c, 3, 9, 10, grain) // полоса-маркировка цветом солода
  hline(c, 3, 10, 10, grain)
  hline(c, 2, 14, 12, BURLAP_DARK)
  // рассыпанные зёрна
  px(c, 1, 15, grain)
  px(c, 3, 15, grain)
  px(c, 13, 15, grain)
}

/** Шишка хмеля: чешуйки «ёлочкой», черенок и лист. */
function drawHop(c, green, dark) {
  vline(c, 8, 0, 3, '#4a6b1f')
  rect(c, 9, 1, 3, 1, '#5f8a2a')
  px(c, 11, 2, '#5f8a2a')
  const widths = [1, 2, 3, 4, 5, 5, 5, 4, 4, 3, 2, 1]
  widths.forEach((w, i) => {
    const y = 3 + i
    hline(c, 8 - w, y, w * 2, i % 2 ? dark : green)
    // чешуйки: светлый край слева, тень справа
    px(c, 8 - w, y, i % 2 ? green : '#d8ec8a')
    px(c, 7 + w, y, '#2f4a14')
  })
}

/** Банка дрожжей: крышка, стекло, содержимое, пузырьки. */
function drawJar(c, fill, lid = '#6b5a4a') {
  rect(c, 4, 1, 8, 2, lid)
  hline(c, 4, 1, 8, '#8f7a64')
  rect(c, 3, 3, 10, 12, '#2a221c')
  rect(c, 4, 4, 8, 10, '#3a332c')
  rect(c, 4, 7, 8, 7, fill)
  vline(c, 5, 5, 8, '#fff4dc55')
  px(c, 7, 9, '#fff4dc')
  px(c, 9, 11, '#fff4dc')
  px(c, 10, 8, '#fff4dc')
  hline(c, 3, 15, 10, '#17130f')
}

const MALT_GRAIN = {
  'malt-pils': '#f0d48a',
  'malt-wheat': '#f4e2a8',
  'malt-vienna': '#d9a653',
  'malt-smoked': '#a8642c',
  'malt-caramel': '#b8621c',
  'malt-chocolate': '#4a2410',
}

for (const [name, grain] of Object.entries(MALT_GRAIN)) {
  const c = canvas(16, 16)
  drawSack(c, grain)
  if (name === 'malt-smoked') {
    // дымок над мешком — отсылка к мангалу
    px(c, 12, 0, '#6b5a4a')
    px(c, 13, 1, '#463a30')
    px(c, 12, 2, '#6b5a4a')
  }
  report.push(save(name, c, 3))
}

const HOP_TINTS = {
  'hop-saaz': ['#a8c85a', '#7a9a38'],
  'hop-cascade': ['#8cbc3c', '#5f8a2a'],
  'hop-citra': ['#c8dc50', '#94ac2c'],
  'hop-magnum': ['#6a9a30', '#3f6a1c'],
}

for (const [name, [green, dark]] of Object.entries(HOP_TINTS)) {
  const c = canvas(16, 16)
  drawHop(c, green, dark)
  report.push(save(name, c, 3))
}

const YEAST_FILL = {
  'yeast-lager': '#e8dcb0',
  'yeast-ale': '#d9b77a',
  'yeast-weizen': '#f0e2a0',
  'yeast-belgian': '#c98f4a',
}

for (const [name, fill] of Object.entries(YEAST_FILL)) {
  const c = canvas(16, 16)
  drawJar(c, fill)
  report.push(save(name, c, 3))
}

const EXTRA_ICONS = {
  'extra-cherry': (c) => {
    // две вишни на общем черенке
    for (const [x, y] of [[4, 9], [10, 10]]) {
      rect(c, x - 2, y - 1, 5, 4, PAL.blood)
      rect(c, x - 1, y - 2, 3, 6, PAL.blood)
      px(c, x - 1, y - 1, '#ff6a6a')
      px(c, x + 2, y + 2, '#5a0808')
    }
    for (let i = 0; i < 5; i++) px(c, 5 + i, 6 - Math.floor(i / 2), '#4a6b1f')
    for (let i = 0; i < 4; i++) px(c, 9 + Math.floor(i / 2), 4 + i, '#4a6b1f')
    rect(c, 10, 2, 3, 2, '#7ba428')
  },
  'extra-honey': (c) => {
    drawJar(c, '#e0a020', '#8a6d12')
    rect(c, 5, 5, 6, 2, '#f0c040')
    // ложка-мешалка
    vline(c, 12, 0, 6, '#b89a6a')
    rect(c, 11, 5, 3, 2, '#b89a6a')
  },
  'extra-coffee': (c) => {
    for (const [x, y] of [[2, 3], [8, 5], [4, 10]]) {
      rect(c, x, y + 1, 6, 3, '#5a3418')
      rect(c, x + 1, y, 4, 5, '#5a3418')
      hline(c, x + 1, y + 1, 1, '#8a5a30')
      for (let i = 0; i < 4; i++) px(c, x + 1 + i, y + 2 + (i % 2 ? 0 : 1), '#2a1408')
    }
  },
  'extra-orange': (c) => {
    // долька апельсина
    for (let y = 0; y < 8; y++) {
      const w = [4, 6, 7, 8, 8, 8, 7, 6][y]
      hline(c, 8 - w, 8 + y - 4, w * 2, '#f08a1a')
    }
    for (let y = 1; y < 7; y++) {
      const w = [0, 4, 5, 6, 6, 5, 4][y]
      hline(c, 8 - w, 8 + y - 4, w * 2, '#ffc060')
    }
    for (let i = 0; i < 5; i++) px(c, 8, 5 + i, '#fff4dc')
    for (let i = 0; i < 4; i++) {
      px(c, 7 - i, 6 + i, '#fff4dc')
      px(c, 9 + i, 6 + i, '#fff4dc')
    }
  },
  'extra-chili': (c) => {
    // изогнутый перец
    const body = [[3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10], [9, 11], [10, 11], [11, 12], [12, 12]]
    for (const [x, y] of body) {
      rect(c, x, y - 1, 2, 3, PAL.blood)
      px(c, x, y - 1, '#ff6a6a')
    }
    px(c, 13, 13, PAL.blood)
    rect(c, 2, 3, 3, 3, '#4a6b1f')
    px(c, 1, 2, '#7ba428')
  },
}

for (const [name, draw] of Object.entries(EXTRA_ICONS)) {
  const c = canvas(16, 16)
  draw(c)
  report.push(save(name, c, 3))
}

/**
 * Котёл на мангале: медный чан с бурлящим суслом, пар, угли снизу.
 * 6 кадров 48×40, лист 288×40, ×4 → 1152×160.
 */
const KETTLE_FRAMES = 6
const COPPER = '#b8662c'
const COPPER_DARK = '#7a3a14'
const COPPER_LIGHT = '#e8a060'
const WORT = '#c47a1a'
const WORT_FOAM = '#f0d48a'

const kettleSheet = canvas(48 * KETTLE_FRAMES, 40)
for (let f = 0; f < KETTLE_FRAMES; f++) {
  const c = canvas(48, 40)
  const r = rng(301 + f)

  // мангал-подставка
  rect(c, 8, 30, 32, 5, PAL.steel700)
  hline(c, 8, 30, 32, PAL.steel300)
  hline(c, 8, 34, 32, PAL.steel900)
  coals(c, 10, 31, 28, 3, 17, f)
  for (const x of [11, 36]) {
    vline(c, x, 35, 4, PAL.steel500)
    hline(c, x - 1, 39, 3, PAL.steel700)
  }

  // языки пламени между мангалом и котлом
  for (let i = 0; i < 7; i++) {
    const x = 12 + i * 4 + (f % 2)
    const h = 1 + ((i + f) % 3)
    vline(c, x, 30 - h, h, h > 2 ? PAL.coal : PAL.ember)
  }

  // котёл
  trapezoid(c, 12, 27, 7, 40, 10, 37, COPPER)
  for (let y = 12; y <= 27; y++) {
    const t = (y - 12) / 15
    px(c, Math.round(40 + (37 - 40) * t), y, COPPER_DARK)
    px(c, Math.round(40 + (37 - 40) * t) - 1, y, COPPER_DARK)
    px(c, Math.round(7 + (10 - 7) * t) + 1, y, COPPER_LIGHT)
  }
  hline(c, 6, 11, 36, COPPER_LIGHT) // кромка
  hline(c, 6, 12, 36, COPPER_DARK)
  hline(c, 10, 27, 28, COPPER_DARK)
  // заклёпки
  for (let x = 12; x < 38; x += 5) px(c, x, 19, COPPER_DARK)
  // ручки
  rect(c, 3, 14, 3, 2, PAL.steel500)
  rect(c, 42, 14, 3, 2, PAL.steel500)

  // сусло с пузырями
  hline(c, 8, 13, 32, WORT)
  hline(c, 9, 14, 30, WORT)
  for (let i = 0; i < 6; i++) {
    const x = 10 + Math.floor(r() * 28)
    px(c, x, 13, WORT_FOAM)
    if (r() > 0.5) px(c, x + 1, 12, WORT_FOAM)
  }

  // пар: колонны пикселей, дрейфуют с кадром
  for (let col = 0; col < 3; col++) {
    for (let i = 0; i < 8; i++) {
      const y = 10 - i
      const x = 16 + col * 8 + Math.round(Math.sin((i + f + col * 2) / 1.8) * 2)
      if (y >= 0 && (i + f + col) % 3 !== 0) px(c, x, y, i < 3 ? PAL.ash : PAL.steel700)
    }
  }

  // лопнувший пузырь над поверхностью — в разных кадрах в разных местах
  const bx = 12 + ((f * 7) % 24)
  px(c, bx, 11, WORT_FOAM)
  px(c, bx + 1, 10, WORT_FOAM)

  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const si = (y * c.w + x) * 4
      if (c.data[si + 3] === 0) continue
      c.data.copy(kettleSheet.data, (y * kettleSheet.w + f * 48 + x) * 4, si, si + 4)
    }
  }
}
report.push(save('kettle-sheet', kettleSheet, 4)) // 1152×160

/* ------------------------------------------------------------------
   Двор: ночная сцена с избой и отдельный лист огня для мангала.
   Оба листа сохраняются ×1 — масштаб задаёт CSS (целое число на пиксель),
   поэтому одна картинка годится и для телефона, и для широкого экрана.
   Все движения зациклены ровно на 8 кадров: шва при повторе нет.
   ------------------------------------------------------------------ */

const TAU = Math.PI * 2
const YARD_W = 160
const YARD_H = 90
const YARD_FRAMES = 8

/** Склеивает кадры в горизонтальный лист. */
function composeSheet(frames) {
  const w = frames[0].w
  const sheet = canvas(w * frames.length, frames[0].h)
  frames.forEach((frame, i) => {
    for (let y = 0; y < frame.h; y++) {
      for (let x = 0; x < w; x++) {
        const si = (y * w + x) * 4
        if (frame.data[si + 3] === 0) continue
        frame.data.copy(sheet.data, (y * sheet.w + i * w + x) * 4, si, si + 4)
      }
    }
  })
  return sheet
}

const LOG = ['#7a4e28', '#63401f', '#452b14'] // блик, тело, тень бревна
const roofY = (x) => 17 + Math.round((Math.abs(x - 43) * 23) / 34)
const logRow = (y) => LOG[(((y - 40) % 3) + 3) % 3]

function pine(c, cx, baseY, height, dark, light) {
  const tiers = 4
  const tierH = Math.floor(height / tiers)
  for (let t = 0; t < tiers; t++) {
    const top = baseY - height + t * tierH
    for (let j = 0; j < tierH + 2; j++) {
      const half = Math.round(((j + 1) * (4 + t * 2)) / (tierH + 2))
      hline(c, cx - half, top + j, half * 2 + 1, dark)
      px(c, cx - half, top + j, light)
    }
  }
  rect(c, cx - 1, baseY - 2, 2, 4, '#2a1c10')
}

function drawYard(c, f) {
  /* --- небо: полосы, стыки смягчены шахматным дизерингом --- */
  const SKY = ['#090b18', '#0d1022', '#12172e', '#171e3a', '#1d2647']
  for (let y = 0; y < 64; y++) {
    const band = Math.min(SKY.length - 1, Math.floor(y / 12))
    hline(c, 0, y, YARD_W, SKY[band])
    if (y % 12 >= 10 && band < SKY.length - 1) {
      for (let x = y % 2; x < YARD_W; x += 2) px(c, x, y, SKY[band + 1])
    }
  }

  /* --- звёзды: часть мерцает, у каждой своя фаза --- */
  const sr = rng(4242)
  for (let i = 0; i < 54; i++) {
    const x = Math.floor(sr() * YARD_W)
    const y = Math.floor(sr() * 46)
    const twinkles = sr() < 0.3
    const off = Math.floor(sr() * 8)
    const bright = sr() < 0.4
    if (Math.hypot(x - 134, y - 14) < 9) continue // не лезем на луну
    if (twinkles) px(c, x, y, (f + off) % 8 < 2 ? '#39446e' : '#e8ecff')
    else px(c, x, y, bright ? '#c4ccee' : '#6f7aa8')
  }

  /* --- луна --- */
  for (let y = -5; y <= 5; y++) {
    for (let x = -5; x <= 5; x++) {
      if (x * x + y * y <= 27) px(c, 134 + x, 14 + y, '#e8e4c8')
    }
  }
  for (const [x, y] of [[132, 12], [133, 12], [136, 15], [135, 17], [131, 16], [137, 11]]) {
    px(c, x, y, '#c4be9c')
  }

  /* --- лес на горизонте: два слоя силуэтов --- */
  for (const [seed, color, minH, maxH] of [[77, '#111a2e', 9, 16], [91, '#0a111c', 5, 10]]) {
    const fr = rng(seed)
    let x = -2
    while (x < YARD_W + 4) {
      const h = minH + Math.floor(fr() * (maxH - minH))
      const half = 2 + Math.floor(fr() * 2)
      for (let j = 0; j < h; j++) {
        const w = Math.round(((j + 1) * half) / h)
        hline(c, x - w, 63 - h + j, w * 2 + 1, color)
      }
      x += 3 + Math.floor(fr() * 4)
    }
  }

  /* --- земля --- */
  rect(c, 0, 62, YARD_W, YARD_H - 62, '#16260f')
  hline(c, 0, 62, YARD_W, '#1e3415')
  const gr = rng(1313)
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(gr() * YARD_W)
    const y = 63 + Math.floor(gr() * 27)
    px(c, x, y, gr() < 0.5 ? '#122009' : '#24401a')
  }

  /* --- тропинка от крыльца к зрителю --- */
  for (let y = 68; y < YARD_H; y++) {
    const t = (y - 68) / 22
    const l = Math.round(37 - t * 9)
    const r = Math.round(48 + t * 22)
    hline(c, l, y, r - l, '#3a2c1c')
    px(c, l + ((y * 7) % Math.max(1, r - l)), y, '#4c3b27')
  }

  /* --- ели по краям, позади дома --- */
  pine(c, 2, 66, 46, '#0e1c12', '#16301c')
  pine(c, 151, 67, 40, '#0e1c12', '#16301c')
  pine(c, 96, 64, 30, '#0c1810', '#132a18')

  /* --- труба: рисуется до крыши, скат закроет её основание --- */
  rect(c, 56, 13, 6, 16, '#6a3a2a')
  for (let y = 15; y < 29; y += 3) hline(c, 56, y, 6, '#4a2a20')
  for (let y = 13; y < 29; y += 6) px(c, 58, y + 1, '#4a2a20')
  rect(c, 55, 12, 8, 2, '#3a3036')
  hline(c, 55, 12, 8, '#52464c')

  /* --- фронтон и стены из брёвен --- */
  for (let x = 13; x <= 73; x++) {
    for (let y = roofY(x) + 3; y < 40; y++) px(c, x, y, logRow(y))
  }
  for (let y = 40; y <= 65; y++) hline(c, 14, y, 59, logRow(y))
  const kr = rng(555)
  for (let i = 0; i < 14; i++) px(c, 15 + Math.floor(kr() * 56), 41 + Math.floor(kr() * 8) * 3, '#3a2410')

  // торцы брёвен по углам: выступают за стену, спил светлее
  for (let y = 40; y <= 65; y += 3) {
    for (const x of [12, 73]) {
      rect(c, x, y, 2, 3, '#3a2410')
      rect(c, x, y, 2, 2, '#9a7046')
      px(c, x, y, '#b88a5a')
    }
  }
  vline(c, 14, 40, 26, '#3a2410')
  vline(c, 72, 40, 26, '#3a2410')

  /* --- крыша: доски вдоль скатов, со свесом --- */
  for (let x = 8; x <= 78; x++) {
    vline(c, x, roofY(x), 3, '#2a190e')
    px(c, x, roofY(x), '#4a2e1a')
  }
  rect(c, 42, 15, 3, 3, '#2a190e') // конёк
  hline(c, 42, 15, 3, '#4a2e1a')

  /* --- окна: тёплый свет чуть дрожит, не чаще трёх смен в секунду --- */
  const GLOW = ['#ffb347', '#f2a03a', '#ffc96a']
  const glow = GLOW[[0, 0, 1, 1, 0, 0, 2, 2][f]]

  rect(c, 40, 27, 6, 6, '#2a190e') // слуховое окно
  rect(c, 41, 28, 4, 4, glow)
  vline(c, 43, 28, 4, '#2a190e')

  for (const wx of [20, 56]) {
    rect(c, wx - 3, 46, 3, 12, '#3e2a1a') // ставни
    rect(c, wx + 12, 46, 3, 12, '#3e2a1a')
    for (let y = 48; y < 58; y += 3) {
      hline(c, wx - 3, y, 3, '#2a1a0e')
      hline(c, wx + 12, y, 3, '#2a1a0e')
    }
    rect(c, wx, 46, 12, 12, '#9a7a50') // рама
    rect(c, wx + 1, 47, 10, 10, glow)
    // занавески: тёмные уголки сверху
    for (let j = 0; j < 4; j++) {
      hline(c, wx + 1, 47 + j, 4 - j, '#c8662a')
      hline(c, wx + 7 + j, 47 + j, 4 - j, '#c8662a')
    }
    vline(c, wx + 6, 47, 10, '#9a7a50') // переплёт
    hline(c, wx + 1, 52, 10, '#9a7a50')
    hline(c, wx - 1, 58, 14, '#b89464') // подоконник
    // свет из окна на траве: шахматка, чтобы не было сплошного пятна
    for (let y = 67; y < 73; y++) {
      const spread = y - 67
      for (let x = wx - spread; x < wx + 12 + spread; x++) {
        if ((x + y) % 2 === 0) px(c, x, y, f % 4 < 2 ? '#f2a03a40' : '#f2a03a33')
      }
    }
  }

  /* --- дверь, фонарь над ней, крыльцо --- */
  rect(c, 37, 48, 12, 18, '#2a1a0e')
  rect(c, 38, 49, 10, 17, '#5a3a1e')
  for (let x = 40; x < 48; x += 3) vline(c, x, 49, 17, '#3e2814')
  hline(c, 38, 54, 10, '#3e2814')
  hline(c, 38, 61, 10, '#3e2814')
  px(c, 46, 58, '#d8b040')
  rect(c, 42, 44, 2, 2, '#ffd070')
  for (const [x, y] of [[41, 44], [44, 45], [42, 43], [43, 46], [41, 46], [44, 43]]) {
    px(c, x, y, f % 2 ? '#f2701d88' : '#f2701d55')
  }
  hline(c, 13, 66, 61, '#33333a') // фундамент
  for (let x = 16; x < 73; x += 5) px(c, x, 66, '#22222a')
  rect(c, 34, 66, 18, 2, '#5a4630')
  hline(c, 34, 66, 18, '#7a6040')

  /* --- поленница у стены --- */
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4 - (row === 2 ? 1 : 0); col++) {
      const x = 2 + col * 3 + (row % 2)
      const y = 64 - row * 3
      rect(c, x, y, 3, 3, '#3a2410')
      rect(c, x, y, 2, 2, '#a87a48')
      px(c, x, y, '#c89a60')
    }
  }

  /* --- дым из трубы: клубы поднимаются и сносятся ветром вправо --- */
  for (let k = 0; k < 5; k++) {
    const age = (f + k * 1.6) % 8
    const x = 58 + Math.round(Math.sin(age * 0.9 + k) * 1.5 + age * 0.7)
    const y = Math.round(10 - age * 1.5)
    const color = age < 3 ? '#5a5f78' : age < 6 ? '#3d4462' : '#2a3050'
    if (age < 3) rect(c, x, y, 2, 2, color)
    else if (age < 6) rect(c, x, y, 3, 2, color)
    else rect(c, x, y, 2, 1, color)
  }

  /* --- отсвет мангала на траве: радиус чуть дышит --- */
  const rx = 21 + [0, 1, 2, 1, 0, -1, 0, 1][f]
  for (let y = 73; y <= 83; y++) {
    for (let x = 106 - rx; x <= 106 + rx; x++) {
      const d = ((x - 106) / rx) ** 2 + ((y - 78) / 5) ** 2
      if (d <= 1 && (x + y) % 2 === 0) px(c, x, y, d < 0.4 ? '#f2701d55' : '#f2701d2e')
    }
  }
  // тень под ящиком
  for (let x = 125; x < 153; x += 1) if (x % 2) px(c, x, 81, '#0c1608')

  /* --- светлячки: кружат по маленьким эллипсам и подмигивают --- */
  for (const [cx, cy, r, off] of [[86, 57, 3, 0], [122, 50, 2, 3], [22, 76, 3, 5], [140, 60, 2, 6]]) {
    const a = (TAU * (f + off)) / 8
    if ((f + off) % 8 === 3) continue
    px(c, cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r * 0.6), '#d8ff70')
  }

  /* --- трава на переднем плане --- */
  const br = rng(2024)
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(br() * YARD_W)
    const h = 1 + Math.floor(br() * 3)
    vline(c, x, YARD_H - h, h, br() < 0.5 ? '#24401a' : '#2e5222')
  }
}

const yardFrames = []
for (let f = 0; f < YARD_FRAMES; f++) {
  const c = canvas(YARD_W, YARD_H)
  drawYard(c, f)
  yardFrames.push(c)
}
report.push(save('yard-sheet', composeSheet(yardFrames))) // 1280×90

/**
 * Огонь для мангала во дворе: 32×40, низ листа совпадает с серединой спрайта
 * мангала. Слой кладётся ПОЗАДИ спрайта — языки видны над кромкой, а у моделей
 * с крышкой сами прячутся за неё, и подгонять огонь под каждый корпус не нужно.
 */
function drawFire(c, f) {
  const t = f / YARD_FRAMES
  for (let x = 5; x <= 26; x++) {
    const d = Math.abs(x - 15.5) / 11
    const profile = Math.max(0, 1 - d * d)
    const wave =
      0.62 + 0.24 * Math.sin(TAU * t + x * 0.8) + 0.14 * Math.sin(TAU * 2 * t - x * 1.7)
    const h = Math.round(17 * profile * wave)
    for (let j = 0; j < h; j++) {
      const rel = j / h
      const color = rel < 0.25 ? PAL.white : rel < 0.5 ? PAL.coal : rel < 0.8 ? PAL.ember : PAL.blood
      px(c, x, 39 - j, color)
    }
  }
  // искры
  const sr = rng(909)
  for (let i = 0; i < 8; i++) {
    const x0 = 8 + Math.floor(sr() * 16)
    const off = Math.floor(sr() * 8)
    const age = (f + off) % 8
    const x = x0 + Math.round(Math.sin(age + i) * 1.5)
    const y = 24 - age * 3
    px(c, x, y, age < 3 ? PAL.coal : age < 6 ? PAL.ember : PAL.rust)
  }
  // дымок над огнём
  for (let k = 0; k < 3; k++) {
    const age = (f + k * 2.7) % 8
    const x = 13 + k * 3 + Math.round(Math.sin(age * 0.8 + k) * 2)
    const y = Math.round(14 - age * 1.8)
    rect(c, x, y, 2, 1, age < 4 ? '#5a4e4488' : '#3a332c66')
  }
}

const fireFrames = []
for (let f = 0; f < YARD_FRAMES; f++) {
  const c = canvas(32, 40)
  drawFire(c, f)
  fireFrames.push(c)
}
report.push(save('fire-sheet', composeSheet(fireFrames))) // 256×40

const total = report.reduce((s, r) => s + r.bytes, 0)
console.log(report.map((r) => `${r.name.padEnd(16)} ${r.w}×${r.h}  ${r.bytes} B`).join('\n'))
console.log(`\nВсего ${report.length} файлов, ${(total / 1024).toFixed(1)} КБ`)
