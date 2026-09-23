import fs from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { resolveDbConfig, describeDb } from '../lib/db/config'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

const config = resolveDbConfig()
const client = createClient({ url: config.url, authToken: config.authToken })

await migrate(drizzle(client), { migrationsFolder: './drizzle' })
client.close()

console.log(`Миграции применены: ${describeDb(config)}`)
