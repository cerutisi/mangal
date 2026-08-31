import 'server-only'
import { unstable_cache, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { DEFAULT_SETTINGS, SETTINGS_TAG, type SiteSettings } from '@/lib/settings'

async function readSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings)
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  // Мержим поверх дефолтов: недостающий ключ не должен ронять витрину.
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    hero: { ...DEFAULT_SETTINGS.hero, ...(stored.hero as object) },
    contacts: { ...DEFAULT_SETTINGS.contacts, ...(stored.contacts as object) },
    footer: { ...DEFAULT_SETTINGS.footer, ...(stored.footer as object) },
    emails: { ...DEFAULT_SETTINGS.emails, ...(stored.emails as object) },
  } as SiteSettings
}

export const getSettings = unstable_cache(readSettings, ['site-settings'], {
  tags: [SETTINGS_TAG],
  revalidate: 60,
})

export function revalidateSettings() {
  revalidateTag(SETTINGS_TAG)
}
