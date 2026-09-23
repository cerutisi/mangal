import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Куда падают спрайты, загруженные из админки.
 *
 * Локально — в public/sprites/uploads/, это же читает демо-сборка под Pages.
 * На Vercel файловой системы для записи нет, поэтому при заданном
 * BLOB_READ_WRITE_TOKEN файл уходит в Vercel Blob и возвращается абсолютный URL.
 * Вызывающий код про разницу не знает: на выходе всегда URL для <img>.
 */
export const usesBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export async function putSprite(fileName: string, body: Buffer): Promise<string> {
  if (usesBlobStorage) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`sprites/${fileName}`, body, {
      access: 'public',
      contentType: 'image/png',
      // Имя уже UUID, второй случайный суффикс только мешает
      addRandomSuffix: false,
    })
    return blob.url
  }

  const dir = path.join(process.cwd(), 'public', 'sprites', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, fileName), body)
  return `/sprites/uploads/${fileName}`
}
