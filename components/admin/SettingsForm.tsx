'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/lib/settings'
import { saveSettings } from '@/actions/admin-settings'
import { adminCard, adminInput, adminLabel, adminButton, adminPrimaryButton } from './ui'

const ICONS = ['icon-steel', 'icon-weld', 'icon-paint', 'icon-shield']

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [draft, setDraft] = useState<SiteSettings>(initial)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setError('')

    const result = await saveSettings(draft)
    setPending(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Сохранено. Витрина обновлена.')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <section className={adminCard}>
        <h2 className="font-semibold">Первый экран</h2>

        <label className="mt-3 block">
          <span className={adminLabel}>Заголовок</span>
          <input
            className={adminInput}
            value={draft.hero.title}
            onChange={(e) => patch('hero', { ...draft.hero, title: e.target.value })}
          />
        </label>

        <label className="mt-3 block">
          <span className={adminLabel}>Подзаголовок</span>
          <input
            className={adminInput}
            value={draft.hero.subtitle}
            onChange={(e) => patch('hero', { ...draft.hero, subtitle: e.target.value })}
          />
        </label>

        <label className="mt-3 block">
          <span className={adminLabel}>Подпись кнопки</span>
          <input
            className={adminInput}
            value={draft.hero.cta}
            onChange={(e) => patch('hero', { ...draft.hero, cta: e.target.value })}
          />
        </label>
      </section>

      <section className={adminCard}>
        <h2 className="font-semibold">Контакты</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['phone', 'Телефон'],
              ['telegram', 'Telegram'],
              ['whatsapp', 'WhatsApp'],
              ['city', 'Адрес мастерской'],
              ['hours', 'Часы работы'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <span className={adminLabel}>{label}</span>
              <input
                className={adminInput}
                value={draft.contacts[key]}
                onChange={(e) => patch('contacts', { ...draft.contacts, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={adminCard}>
        <h2 className="font-semibold">Блоки «Производство»</h2>

        <div className="mt-3 flex flex-col gap-3">
          {draft.production.map((block, index) => (
            <div key={index} className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                <label className="text-xs text-slate-600">
                  Иконка
                  <select
                    className={adminInput}
                    value={block.icon}
                    onChange={(e) =>
                      patch(
                        'production',
                        draft.production.map((b, i) =>
                          i === index ? { ...b, icon: e.target.value } : b,
                        ),
                      )
                    }
                  >
                    {ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Заголовок
                  <input
                    className={adminInput}
                    value={block.title}
                    onChange={(e) =>
                      patch(
                        'production',
                        draft.production.map((b, i) =>
                          i === index ? { ...b, title: e.target.value } : b,
                        ),
                      )
                    }
                  />
                </label>
              </div>

              <label className="text-xs text-slate-600">
                Текст
                <textarea
                  className={adminInput}
                  rows={2}
                  value={block.text}
                  onChange={(e) =>
                    patch(
                      'production',
                      draft.production.map((b, i) =>
                        i === index ? { ...b, text: e.target.value } : b,
                      ),
                    )
                  }
                />
              </label>

              <button
                type="button"
                className={`${adminButton} justify-self-start`}
                onClick={() =>
                  patch(
                    'production',
                    draft.production.filter((_, i) => i !== index),
                  )
                }
              >
                Удалить блок
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${adminButton} mt-3`}
          disabled={draft.production.length >= 6}
          onClick={() =>
            patch('production', [
              ...draft.production,
              { icon: ICONS[0], title: '', text: '' },
            ])
          }
        >
          Добавить блок
        </button>
      </section>

      <section className={adminCard}>
        <h2 className="font-semibold">Тема оформления</h2>
        <p className="mt-1 text-sm text-slate-600">
          Компоненты не меняются — переключается только палитра витрины.
        </p>

        <div className="mt-3 flex gap-4">
          {(
            [
              ['iron', 'Сталь — тёмная, основная'],
              ['blocks', 'Блоки — дневная, светлая'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                checked={draft.theme === value}
                onChange={() => patch('theme', value)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className={adminCard}>
        <h2 className="font-semibold">Письма и футер</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className={adminLabel}>Тема письма клиенту</span>
            <input
              className={adminInput}
              value={draft.emails.clientSubject}
              onChange={(e) => patch('emails', { ...draft.emails, clientSubject: e.target.value })}
            />
          </label>

          <label>
            <span className={adminLabel}>Тема письма менеджеру</span>
            <input
              className={adminInput}
              value={draft.emails.managerSubject}
              onChange={(e) => patch('emails', { ...draft.emails, managerSubject: e.target.value })}
            />
          </label>

          <label className="sm:col-span-2">
            <span className={adminLabel}>Срок ответа (подставляется в письмо и на страницу заявки)</span>
            <input
              className={adminInput}
              value={draft.emails.replyTime}
              onChange={(e) => patch('emails', { ...draft.emails, replyTime: e.target.value })}
            />
          </label>

          <label className="sm:col-span-2">
            <span className={adminLabel}>Текст о мастерской в футере</span>
            <input
              className={adminInput}
              value={draft.footer.about}
              onChange={(e) => patch('footer', { ...draft.footer, about: e.target.value })}
            />
          </label>

          <label className="sm:col-span-2">
            <span className={adminLabel}>Правовая строка в футере</span>
            <input
              className={adminInput}
              value={draft.footer.legal}
              onChange={(e) => patch('footer', { ...draft.footer, legal: e.target.value })}
            />
          </label>

          <label className="sm:col-span-2">
            <span className={adminLabel}>Плашка «витрина-демо»</span>
            <input
              className={adminInput}
              value={draft.demoNotice}
              onChange={(e) => patch('demoNotice', e.target.value)}
            />
          </label>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={adminPrimaryButton}>
          {pending ? 'Сохраняем…' : 'Сохранить настройки'}
        </button>
        {message && (
          <p role="status" className="text-sm text-emerald-700">
            {message}
          </p>
        )}
      </div>
    </form>
  )
}
