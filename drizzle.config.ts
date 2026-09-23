import type { Config } from 'drizzle-kit'
import { resolveDbConfig } from './lib/db/config'

const { url, authToken, isRemote } = resolveDbConfig()

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  // Диалект тот же SQLite; 'turso' отличается только транспортом
  dialect: isRemote ? 'turso' : 'sqlite',
  dbCredentials: { url, authToken },
} satisfies Config
