import fs from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

const url = process.env.DATABASE_URL ?? 'file:mangal.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url.startsWith('file:') && !authToken) {
  throw new Error('Для удалённой базы нужен DATABASE_AUTH_TOKEN — см. .env.example')
}

const client = createClient({ url, authToken })
await migrate(drizzle(client), { migrationsFolder: './drizzle' })
client.close()

console.log(`Миграции применены: ${url}`)
