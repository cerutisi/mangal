'use server'

import { randomUUID } from 'node:crypto'
import { requireSession } from '@/lib/auth/current-user'
import { putSprite } from '@/lib/storage'

export type UploadResult =
  | { ok: true; url: string; width: number; height: number; warnings: string[] }
  | { ok: false; message: string }

const MAX_BYTES = 200 * 1024
const MAX_SIDE = 512
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Размеры PNG лежат в IHDR — первом чанке сразу после сигнатуры. */
function readPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null
  if (!PNG_MAGIC.every((byte, i) => buffer[i] === byte)) return null
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/** Эвристика «это фотка, а не пиксель-арт»: слишком много уникальных цветов. */
function looksSmoothed(buffer: Buffer): boolean {
  // Считаем по сжатому потоку: у настоящего пиксель-арта палитра мала,
  // поэтому PNG жмётся в разы сильнее, чем фотография того же размера.
  const size = readPngSize(buffer)
  if (!size) return false
  return buffer.length / (size.width * size.height) > 0.6
}

export async function uploadSprite(form: FormData): Promise<UploadResult> {
  // Проверка сессии здесь, а не в UI: отсутствие кнопки — не защита
  await requireSession()

  const file = form.get('file')
  if (!(file instanceof File)) {
    return { ok: false, message: 'Файл не получен' }
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: `Файл ${Math.round(file.size / 1024)} КБ — лимит 200 КБ`,
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Проверяем магические байты, а не Content-Type: заголовок подделывается тривиально
  const size = readPngSize(buffer)
  if (!size) {
    return { ok: false, message: 'Это не PNG. Спрайты принимаются только в PNG.' }
  }

  if (size.width > MAX_SIDE || size.height > MAX_SIDE) {
    return {
      ok: false,
      message: `Размер ${size.width}×${size.height} — максимум 512×512`,
    }
  }

  const warnings: string[] = []
  if (size.width !== size.height) {
    warnings.push(`Картинка не квадратная (${size.width}×${size.height}) — в сетке слотов поедет`)
  }
  if (looksSmoothed(buffer)) {
    warnings.push('Похоже на фотографию или сглаженную картинку, а не на пиксель-арт')
  }

  // Имя всегда UUID: имя из браузера не должно попадать в путь
  const url = await putSprite(`${randomUUID()}.png`, buffer)

  return { ok: true, url, width: size.width, height: size.height, warnings }
}
