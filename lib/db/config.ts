/**
 * Разбор настроек базы. Без 'server-only': этим же пользуются скрипты
 * миграций и сидов, которые запускаются обычным node, а не внутри Next.
 */

export type DbConfig = {
  url: string
  authToken?: string
  /** true — база по сети (Turso), false — локальный файл SQLite */
  isRemote: boolean
}

/**
 * Имена переменных различаются по происхождению:
 * TURSO_* кладёт интеграция Vercel + Turso сама, DATABASE_URL задаётся руками.
 *
 * Приоритет у DATABASE_URL, и это осознанно. `vercel env pull` дописывает
 * TURSO_* в тот же .env.local, где уже лежит DATABASE_URL=file:mangal.db —
 * если бы побеждала интеграция, локальная разработка и сборка демо молча
 * начали бы работать с боевой базой. Чтобы поработать с Turso локально,
 * достаточно убрать DATABASE_URL из .env.local.
 */
export function resolveDbConfig(): DbConfig {
  // DB_TARGET=remote — осознанная работа с боевой базой с локальной машины
  // (скрипты db:*:remote). Файловый DATABASE_URL из .env.local тогда игнорируется.
  if (process.env.DB_TARGET === 'remote') return resolveRemote()

  const explicit = process.env.DATABASE_URL
  const integration = process.env.TURSO_DATABASE_URL

  const url = explicit || integration || 'file:mangal.db'
  const authToken = explicit
    ? process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
    : process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN

  const isRemote = !url.startsWith('file:')

  if (isRemote && !authToken) {
    throw new Error(
      `База ${url} сетевая, но токен не задан. ` +
        'Укажите TURSO_AUTH_TOKEN (или DATABASE_AUTH_TOKEN) — см. .env.example',
    )
  }

  return { url, authToken, isRemote }
}

function resolveRemote(): DbConfig {
  const fromDatabaseUrl = process.env.DATABASE_URL?.startsWith('libsql:')
    ? process.env.DATABASE_URL
    : undefined
  const url = process.env.TURSO_DATABASE_URL || fromDatabaseUrl
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    throw new Error(
      'DB_TARGET=remote, но адрес сетевой базы не найден: задайте TURSO_DATABASE_URL в .env.local',
    )
  }
  if (!authToken) {
    throw new Error('DB_TARGET=remote, но токен не задан: нужен TURSO_AUTH_TOKEN')
  }
  return { url, authToken, isRemote: true }
}

/** Короткая подпись базы для логов — без токена и без query-параметров. */
export function describeDb(config: DbConfig): string {
  return config.isRemote ? config.url.split('?')[0] : config.url
}
