// Минимальный PNG-энкодер и рисовалка пиксель-арта.
// Без зависимостей: zlib из ядра Node, ручной CRC32.
import zlib from 'node:zlib'

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

export function encodePng(canvas) {
  const { w, h, data } = canvas
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none — пиксель-арт и так жмётся отлично
    data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export function canvas(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4, 0) }
}

function rgba(hex) {
  const s = hex.replace('#', '')
  const n = parseInt(s.length === 6 ? s + 'ff' : s, 16)
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
}

export function px(c, x, y, hex) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const [r, g, b, a] = rgba(hex)
  if (a === 0) return
  const i = (y * c.w + x) * 4
  if (a === 255) {
    c.data[i] = r
    c.data[i + 1] = g
    c.data[i + 2] = b
    c.data[i + 3] = 255
    return
  }
  const sa = a / 255
  const da = c.data[i + 3] / 255
  const oa = sa + da * (1 - sa)
  c.data[i] = Math.round((r * sa + c.data[i] * da * (1 - sa)) / oa)
  c.data[i + 1] = Math.round((g * sa + c.data[i + 1] * da * (1 - sa)) / oa)
  c.data[i + 2] = Math.round((b * sa + c.data[i + 2] * da * (1 - sa)) / oa)
  c.data[i + 3] = Math.round(oa * 255)
}

export function rect(c, x, y, w, h, hex) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(c, x + i, y + j, hex)
}

export function hline(c, x, y, len, hex) {
  rect(c, x, y, len, 1, hex)
}

export function vline(c, x, y, len, hex) {
  rect(c, x, y, 1, len, hex)
}

/** Трапеция: верх шире низа (или наоборот), заливка построчно. */
export function trapezoid(c, yTop, yBottom, xTopL, xTopR, xBotL, xBotR, hex) {
  const h = yBottom - yTop
  for (let j = 0; j <= h; j++) {
    const t = h === 0 ? 0 : j / h
    const l = Math.round(xTopL + (xBotL - xTopL) * t)
    const r = Math.round(xTopR + (xBotR - xTopR) * t)
    hline(c, l, yTop + j, r - l + 1, hex)
  }
}

/** Целочисленное увеличение — единственный допустимый способ масштабировать спрайт. */
export function scale(c, factor) {
  const out = canvas(c.w * factor, c.h * factor)
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const i = (y * c.w + x) * 4
      if (c.data[i + 3] === 0) continue
      for (let j = 0; j < factor; j++) {
        for (let k = 0; k < factor; k++) {
          const o = ((y * factor + j) * out.w + x * factor + k) * 4
          c.data.copy(out.data, o, i, i + 4)
        }
      }
    }
  }
  return out
}

/** Детерминированный псевдослучайный генератор — сборка должна быть воспроизводимой. */
export function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export const PAL = {
  void: '#0b0908',
  steel900: '#17130f',
  steel700: '#2a221c',
  steel500: '#463a30',
  steel300: '#6b5a4a',
  rust: '#7a3410',
  blood: '#a81616',
  ember: '#f2701d',
  coal: '#ffb347',
  bone: '#ddd0bb',
  moss: '#7ba428',
  ash: '#3a332c',
  white: '#fff4dc',
}
