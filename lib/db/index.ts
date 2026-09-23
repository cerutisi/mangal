import 'server-only'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { resolveDbConfig, describeDb } from './config'
import * as schema from './schema'

/**
 * Один драйвер на оба окружения.
 *
 * Локально база — это файл mangal.db, и libSQL работает с ним встроенным
 * SQLite. На Vercel файловой системы нет, поэтому туда приходит
 * libsql://…turso.io с токеном: тот же SQLite, только по сети. Схема Drizzle
 * и запросы при этом не меняются.
 */
const config = resolveDbConfig()

// В dev Next перезапускает модули на каждый HMR — держим одно соединение на процесс
const globalForDb = globalThis as unknown as { __mangalClient?: Client }

function connect(): Client {
  if (config.isRemote && process.env.NODE_ENV === 'development') {
    // Иначе легко неделю править «локальные» данные и не понять, что это прод
    console.warn(`[db] dev-сервер работает с сетевой базой ${describeDb(config)}`)
  }
  return createClient({ url: config.url, authToken: config.authToken })
}

const client = globalForDb.__mangalClient ?? connect()
if (process.env.NODE_ENV !== 'production') globalForDb.__mangalClient = client

export const db = drizzle(client, { schema })
export { schema, client }
