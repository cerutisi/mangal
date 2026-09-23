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

/** Короткая подпись базы для логов — без токена и без query-параметров. */
export function describeDb(config: DbConfig): string {
  return config.isRemote ? config.url.split('?')[0] : config.url
}
