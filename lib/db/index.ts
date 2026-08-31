import 'server-only'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const DB_FILE = process.env.DATABASE_URL?.replace(/^file:/, '') ?? 'mangal.db'

// В dev Next перезапускает модули на каждый HMR — держим одно соединение на процесс.
const globalForDb = globalThis as unknown as { __mangalDb?: Database.Database }

function connect() {
  const sqlite = new Database(DB_FILE)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

const sqlite = globalForDb.__mangalDb ?? connect()
if (process.env.NODE_ENV !== 'production') globalForDb.__mangalDb = sqlite

export const db = drizzle(sqlite, { schema })
export { schema }
