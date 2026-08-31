import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/current-user'

export const runtime = 'nodejs'

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
  const bytesPerPixel = buffer.length / (size.width * size.height)
  return bytesPerPixel > 0.6
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Требуется вход' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'Файл не получен' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: `Файл ${Math.round(file.size / 1024)} КБ — лимит 200 КБ` },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Проверяем магические байты, а не Content-Type: заголовок подделывается тривиально
  const size = readPngSize(buffer)
  if (!size) {
    return NextResponse.json(
      { ok: false, message: 'Это не PNG. Спрайты принимаются только в PNG.' },
      { status: 400 },
    )
  }

  if (size.width > MAX_SIDE || size.height > MAX_SIDE) {
    return NextResponse.json(
      { ok: false, message: `Размер ${size.width}×${size.height} — максимум 512×512` },
      { status: 400 },
    )
  }

  const warnings: string[] = []
  if (size.width !== size.height) {
    warnings.push(`Картинка не квадратная (${size.width}×${size.height}) — в сетке слотов поедет`)
  }
  if (looksSmoothed(buffer)) {
    warnings.push('Похоже на фотографию или сглаженную картинку, а не на пиксель-арт')
  }

  // Имя всегда UUID: имя из браузера не должно попадать в путь
  const name = `${randomUUID()}.png`
  const dir = path.join(process.cwd(), 'public', 'sprites', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), buffer)

  return NextResponse.json({
    ok: true,
    url: `/sprites/uploads/${name}`,
    width: size.width,
    height: size.height,
    warnings,
  })
}
