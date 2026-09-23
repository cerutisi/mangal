import type { Config } from 'drizzle-kit'

const url = process.env.DATABASE_URL ?? 'file:mangal.db'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  // Диалект тот же SQLite; 'turso' отличается только транспортом
  dialect: url.startsWith('file:') ? 'sqlite' : 'turso',
  dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN },
} satisfies Config
