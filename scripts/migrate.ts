import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

const file = process.env.DATABASE_URL?.replace(/^file:/, '') ?? 'mangal.db'
const sqlite = new Database(file)
sqlite.pragma('journal_mode = WAL')
migrate(drizzle(sqlite), { migrationsFolder: './drizzle' })
console.log(`Миграции применены: ${file}`)
