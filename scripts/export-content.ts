/**
 * Снимок контента из локальной базы в content/demo.json.
 *
 * Зачем: демо на GitHub Pages собирается в CI, где базы нет — она создаётся
 * сидом с нуля. Чтобы на демо попали правки, сделанные в локальной админке,
 * их надо сохранить в репозиторий этим скриптом и закоммитить.
 */
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { asc } from 'drizzle-orm'
import { products, settings } from '../lib/db/schema'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

const sqlite = new Database(process.env.DATABASE_URL?.replace(/^file:/, '') ?? 'mangal.db')
const db = drizzle(sqlite)

const rows = db.select().from(products).orderBy(asc(products.slotIndex)).all()
const settingRows = db.select().from(settings).all()

// id и метки времени в снимок не идут: при сиде они выдаются заново
const snapshot = {
  products: rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    priceMinor: row.priceMinor,
    currency: row.currency,
    stats: row.stats,
    spriteUrl: row.spriteUrl,
    spriteAlt: row.spriteAlt,
    slotIndex: row.slotIndex,
    isActive: row.isActive,
    inStock: row.inStock,
  })),
  settings: Object.fromEntries(settingRows.map((r) => [r.key, r.value])),
}

const file = path.join('content', 'demo.json')
fs.mkdirSync('content', { recursive: true })
fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n')

const uploaded = rows.filter((r) => r.spriteUrl.startsWith('/sprites/uploads/'))
console.log(`Сохранено в ${file}: товаров ${rows.length}, настроек ${settingRows.length}`)
if (uploaded.length > 0) {
  console.log(
    `Не забудьте закоммитить загруженные спрайты (${uploaded.length} шт.) из public/sprites/uploads/`,
  )
}
