import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/current-user'
import { getSettings } from '@/lib/settings.server'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Настройки', robots: { index: false } }

export default async function AdminSettingsPage() {
  await requireSession()
  const settings = await getSettings()

  return (
    <div>
      <h1 className="text-2xl font-semibold">Настройки сайта</h1>
      <p className="mt-1 text-sm text-slate-600">
        Тексты витрины, контакты, тема и темы писем. Изменения видны на сайте сразу.
      </p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </div>
  )
}
