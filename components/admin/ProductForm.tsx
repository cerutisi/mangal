'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, ProductStat } from '@/lib/db/schema'
import { productSchema } from '@/lib/validation'
import { formatMoney, parseMoneyToMinor } from '@/lib/money'
import { createProduct, updateProduct } from '@/actions/admin-products'
import { StatBar } from '@/components/storefront/StatBar'
import { adminCard, adminInput, adminLabel, adminPrimaryButton, adminButton } from './ui'
import { SpriteUploader } from './SpriteUploader'
import { StatsEditor } from './StatsEditor'

type Draft = {
  slug: string
  title: string
  tagline: string
  description: string
  price: string
  currency: 'PLN' | 'BYN' | 'RUB'
  stats: ProductStat[]
  spriteUrl: string
  spriteAlt: string
  slotIndex: number
  isActive: boolean
  inStock: boolean
}

function toDraft(product?: Product): Draft {
  if (!product) {
    return {
      slug: '',
      title: '',
      tagline: '',
      description: '',
      price: '',
      currency: 'PLN',
      stats: [],
      spriteUrl: '',
      spriteAlt: '',
      slotIndex: 1,
      isActive: true,
      inStock: true,
    }
  }
  return {
    slug: product.slug,
    title: product.title,
    tagline: product.tagline,
    description: product.description,
    price: (product.priceMinor / 100).toFixed(2).replace(/\.00$/, ''),
    currency: product.currency as Draft['currency'],
    stats: product.stats,
    spriteUrl: product.spriteUrl,
    spriteAlt: product.spriteAlt,
    slotIndex: product.slotIndex,
    isActive: product.isActive,
    inStock: product.inStock,
  }
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(() => toDraft(product))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setErrors({})

    const priceMinor = parseMoneyToMinor(draft.price)
    if (priceMinor === null) {
      setErrors({ priceMinor: 'Цена — число, например 4350 или 4350,50' })
      setPending(false)
      return
    }

    const payload = {
      slug: draft.slug,
      title: draft.title,
      tagline: draft.tagline,
      description: draft.description,
      priceMinor,
      currency: draft.currency,
      stats: draft.stats,
      spriteUrl: draft.spriteUrl,
      spriteAlt: draft.spriteAlt,
      slotIndex: Number(draft.slotIndex),
      isActive: draft.isActive,
      inStock: draft.inStock,
    }

    // Та же схема, что и на сервере: ошибки видны до сетевого запроса
    const local = productSchema.safeParse(payload)
    if (!local.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of local.error.issues) {
        const path = issue.path.join('.')
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      setMessage('Проверьте выделенные поля')
      setPending(false)
      return
    }

    const result = product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload)

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setMessage(result.message)
      setPending(false)
      return
    }

    router.push('/admin/products')
    router.refresh()
  }

  const previewPrice = parseMoneyToMinor(draft.price)

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <div className={adminCard}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={adminLabel}>Название</span>
              <input
                className={adminInput}
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
              />
              {errors.title && <p className="mt-1 text-sm text-rose-700">{errors.title}</p>}
            </label>

            <label>
              <span className={adminLabel}>Слаг (адрес страницы)</span>
              <input
                className={adminInput}
                value={draft.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="stalker-6mm"
              />
              {errors.slug && <p className="mt-1 text-sm text-rose-700">{errors.slug}</p>}
            </label>

            <label className="sm:col-span-2">
              <span className={adminLabel}>Короткое описание</span>
              <input
                className={adminInput}
                value={draft.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Базовый ствол арсенала"
              />
              {errors.tagline && <p className="mt-1 text-sm text-rose-700">{errors.tagline}</p>}
            </label>

            <label>
              <span className={adminLabel}>Цена</span>
              <input
                className={adminInput}
                value={draft.price}
                onChange={(e) => set('price', e.target.value)}
                inputMode="decimal"
                placeholder="4350"
              />
              {errors.priceMinor && (
                <p className="mt-1 text-sm text-rose-700">{errors.priceMinor}</p>
              )}
            </label>

            <label>
              <span className={adminLabel}>Валюта</span>
              <select
                className={adminInput}
                value={draft.currency}
                onChange={(e) => set('currency', e.target.value as Draft['currency'])}
              >
                <option value="PLN">PLN — złoty</option>
                <option value="BYN">BYN — рубль</option>
                <option value="RUB">RUB — рубль</option>
              </select>
            </label>

            <label>
              <span className={adminLabel}>Слот на витрине (1–9)</span>
              <input
                className={adminInput}
                type="number"
                min={1}
                max={9}
                value={draft.slotIndex}
                onChange={(e) => set('slotIndex', Number(e.target.value))}
              />
              {errors.slotIndex && (
                <p className="mt-1 text-sm text-rose-700">{errors.slotIndex}</p>
              )}
            </label>

            <div className="flex flex-col justify-end gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                Опубликован на витрине
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.inStock}
                  onChange={(e) => set('inStock', e.target.checked)}
                />
                Есть на складе
              </label>
            </div>
          </div>
        </div>

        <div className={adminCard}>
          <SpriteUploader
            value={draft.spriteUrl}
            onChange={(url) => set('spriteUrl', url)}
            error={errors.spriteUrl}
          />

          <label className="mt-4 block">
            <span className={adminLabel}>Описание спрайта для скринридера</span>
            <input
              className={adminInput}
              value={draft.spriteAlt}
              onChange={(e) => set('spriteAlt', e.target.value)}
              placeholder="Пиксельный мангал с восемью шампурами и тлеющими углями"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Обязательное поле: без него товар не увидят пользователи скринридеров.
            </span>
            {errors.spriteAlt && <p className="mt-1 text-sm text-rose-700">{errors.spriteAlt}</p>}
          </label>
        </div>

        <div className={adminCard}>
          <StatsEditor stats={draft.stats} onChange={(stats) => set('stats', stats)} />
          {Object.keys(errors)
            .filter((key) => key.startsWith('stats.'))
            .map((key) => (
              <p key={key} className="mt-2 text-sm text-rose-700">
                {errors[key]}
              </p>
            ))}
        </div>

        <div className={adminCard}>
          <label>
            <span className={adminLabel}>Описание (markdown)</span>
            <textarea
              className={`${adminInput} min-h-40 font-mono`}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Поддерживаются абзацы, списки через «- », **жирный**, *курсив*. HTML вырезается.
            </span>
          </label>
        </div>

        {message && (
          <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={pending} className={adminPrimaryButton}>
            {pending ? 'Сохраняем…' : product ? 'Сохранить' : 'Создать товар'}
          </button>
          <button type="button" className={adminButton} onClick={() => router.back()}>
            Отмена
          </button>
        </div>
      </div>

      {/* Превью ровно тем же компонентом, что и на витрине */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <p className={adminLabel}>Как это выглядит на витрине</p>
        <div
          data-theme="iron"
          className="mt-2 border border-slate-300 bg-[var(--void)] p-3 text-[var(--bone)]"
        >
          <div className="flex flex-col items-center gap-2">
            {draft.spriteUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.spriteUrl}
                alt={draft.spriteAlt || 'Превью спрайта'}
                width={96}
                height={96}
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center text-xs text-slate-500">
                нет спрайта
              </div>
            )}
            <p className="text-hud uppercase">{draft.title || 'НАЗВАНИЕ'}</p>
            <p className="text-hud text-[var(--coal)]">
              {previewPrice === null ? '—' : formatMoney(previewPrice, draft.currency)}
            </p>
          </div>

          {draft.stats.length > 0 && (
            <dl className="mt-3">
              {draft.stats.map((stat, i) => (
                <StatBar key={i} stat={stat} />
              ))}
            </dl>
          )}
        </div>
      </aside>
    </form>
  )
}
