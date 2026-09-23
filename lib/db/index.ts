import 'server-only'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

/**
 * Один драйвер на оба окружения.
 *
 * Локально DATABASE_URL — это file:mangal.db, и libSQL работает с файлом
 * встроенным SQLite. На Vercel файловой системы нет, поэтому туда ставится
 * libsql://…turso.io с токеном: тот же SQLite, только по сети. Схема Drizzle
 * и запросы при этом не меняются.
 */
const url = process.env.DATABASE_URL ?? 'file:mangal.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

// В dev Next перезапускает модули на каждый HMR — держим одно соединение на процесс
const globalForDb = globalThis as unknown as { __mangalClient?: Client }

function connect(): Client {
  if (!url.startsWith('file:') && !authToken) {
    throw new Error(
      'Для удалённой базы нужен DATABASE_AUTH_TOKEN — см. .env.example',
    )
  }
  return createClient({ url, authToken })
}

const client = globalForDb.__mangalClient ?? connect()
if (process.env.NODE_ENV !== 'production') globalForDb.__mangalClient = client

export const db = drizzle(client, { schema })
export { schema, client }
