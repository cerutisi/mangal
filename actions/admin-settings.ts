'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { revalidateSettings } from '@/lib/settings.server'
import { revalidateTag } from 'next/cache'
import { PRODUCTS_TAG } from '@/lib/catalog'

const settingsSchema = z.object({
  hero: z.object({
    title: z.string().trim().min(2, 'Заголовок обязателен').max(120),
    subtitle: z.string().trim().max(240),
    cta: z.string().trim().min(2, 'Подпись кнопки обязательна').max(40),
  }),
  contacts: z.object({
    phone: z.string().trim().max(40),
    telegram: z.string().trim().max(60),
    whatsapp: z.string().trim().max(40),
    city: z.string().trim().max(160),
    hours: z.string().trim().max(80),
  }),
  production: z
    .array(
      z.object({
        icon: z.string().trim().min(1).max(40),
        title: z.string().trim().min(1, 'Заголовок блока обязателен').max(40),
        text: z.string().trim().min(1, 'Текст блока обязателен').max(400),
      }),
    )
    .max(6, 'Не больше шести блоков'),
  footer: z.object({
    about: z.string().trim().max(200),
    legal: z.string().trim().max(400),
  }),
  emails: z.object({
    clientSubject: z.string().trim().min(2).max(120),
    managerSubject: z.string().trim().min(2).max(120),
    replyTime: z.string().trim().min(2).max(80),
  }),
  theme: z.enum(['iron', 'blocks']),
  demoNotice: z.string().trim().max(240),
})

export type SettingsResult = { ok: true } | { ok: false; message: string }

export async function saveSettings(input: unknown): Promise<SettingsResult> {
  await requireSession()

  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Проверьте поля' }
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }

  revalidateSettings()
  // Тема и тексты живут в тех же страницах, что и каталог
  revalidateTag(PRODUCTS_TAG)
  return { ok: true }
}
