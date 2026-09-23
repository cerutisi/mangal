'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sprite } from '@/components/ui/Sprite'
import { Stepper } from '@/components/ui/Stepper'
import { PixelButton } from '@/components/ui/PixelButton'
import { StatBar } from '@/components/storefront/StatBar'
import { useCart } from '@/lib/cart/store'
import { formatMoney } from '@/lib/money'
import { BEER_NAME_MAX, beerNameError } from '@/lib/brewery/name'
import {
  BEER_CURRENCY,
  BOTTLING_MINOR,
  EXTRAS,
  HOPS,
  INVENTORY,
  LABELS,
  MALTS,
  MAX_HOPS,
  YEASTS,
  ingredient,
  type ExtraId,
  type HopId,
  type Ingredient,
  type LabelId,
  type MaltId,
  type YeastId,
} from '@/lib/brewery/ingredients'
import {
  beerLineId,
  beerPriceMinor,
  beerStats,
  beerTitle,
  bottleDataUrl,
  contrastLabel,
  formatAbv,
  formatDays,
  type BeerRecipe,
} from '@/lib/brewery/recipe'
import { Kettle } from './Kettle'

type Draft = {
  malt: MaltId | null
  hops: HopId[]
  yeast: YeastId | null
  extra: ExtraId | null
}

type Phase = 'compose' | 'brewing' | 'done'

const EMPTY: Draft = { malt: null, hops: [], yeast: null, extra: null }

/** Стадии варки: меняется подпись и шкала, яркость не мигает */
const STAGES = ['ЗАТИРАНИЕ', 'ВАРКА С ХМЕЛЕМ', 'БРОЖЕНИЕ', 'РОЗЛИВ']
const STAGE_MS = 450

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

/** Имя по умолчанию — стиль. Если длинное, срезаем префиксы, пока не влезет на этикетку */
function defaultName(style: string): string {
  const words = style.split(' ')
  while (words.length > 1 && words.join(' ').length > BEER_NAME_MAX) words.shift()
  return words.join(' ').slice(0, BEER_NAME_MAX)
}

function isComplete(draft: Draft): draft is Draft & { malt: MaltId; yeast: YeastId } {
  return draft.malt !== null && draft.yeast !== null && draft.hops.length > 0
}

function missingParts(draft: Draft): string[] {
  return [
    draft.malt ? null : 'солод',
    draft.hops.length ? null : 'хмель',
    draft.yeast ? null : 'дрожжи',
  ].filter((x): x is string => x !== null)
}

export function BrewLab() {
  const add = useCart((s) => s.add)
  const setExpanded = useCart((s) => s.setExpanded)

  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [phase, setPhase] = useState<Phase>('compose')
  const [stage, setStage] = useState(0)
  const [name, setName] = useState('')
  const [label, setLabel] = useState<LabelId>('ember')
  const [qty, setQty] = useState(6)
  const [announce, setAnnounce] = useState('')
  const [added, setAdded] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const complete = isComplete(draft)
  const stats = useMemo(() => (complete ? beerStats(draft) : null), [complete, draft])

  // Цена считается и по неполному рецепту — видно, во что обходится каждый выбор
  const partialPrice =
    BOTTLING_MINOR +
    [draft.malt, ...draft.hops, draft.yeast, draft.extra]
      .filter((id) => id !== null)
      .reduce((sum, id) => sum + ingredient(id as string).priceMinor, 0)

  const recipe: BeerRecipe | null =
    complete && phase === 'done'
      ? { malt: draft.malt, hops: draft.hops, yeast: draft.yeast, extra: draft.extra, name, label }
      : null

  const nameProblem = beerNameError(name)
  const nameError = phase === 'done' && nameProblem ? nameProblem : ''

  /* --- выбор сырья --------------------------------------------------- */

  function isSelected(item: Ingredient): boolean {
    if (item.kind === 'malt') return draft.malt === item.id
    if (item.kind === 'hop') return draft.hops.includes(item.id as HopId)
    if (item.kind === 'yeast') return draft.yeast === item.id
    return draft.extra === item.id
  }

  function toggle(item: Ingredient) {
    if (phase !== 'compose') return
    const on = isSelected(item)
    const kindTitle = { malt: 'Солод', hop: 'Хмель', yeast: 'Дрожжи', extra: 'Добавка' }[item.kind]

    setDraft((d) => {
      switch (item.kind) {
        case 'malt':
          return { ...d, malt: on ? null : (item.id as MaltId) }
        case 'yeast':
          return { ...d, yeast: on ? null : (item.id as YeastId) }
        case 'extra':
          return { ...d, extra: on ? null : (item.id as ExtraId) }
        case 'hop': {
          const id = item.id as HopId
          if (on) return { ...d, hops: d.hops.filter((h) => h !== id) }
          // Третий хмель вытесняет второй: слотов два, ругаться незачем
          const hops = d.hops.length < MAX_HOPS ? [...d.hops, id] : [d.hops[0], id]
          return { ...d, hops }
        }
      }
    })

    setAnnounce(`${kindTitle} ${item.title} ${on ? 'убран из рецепта' : 'в котле'}`)
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const id = event.dataTransfer.getData('text/plain')
    try {
      const item = ingredient(id)
      if (!isSelected(item)) toggle(item)
    } catch {
      // Бросили что-то постороннее — игнорируем
    }
  }

  function randomize() {
    const hopA = pick(HOPS).id
    const hopB = pick(HOPS.filter((h) => h.id !== hopA)).id
    setDraft({
      malt: pick(MALTS).id,
      hops: Math.random() > 0.5 ? [hopA, hopB] : [hopA],
      yeast: pick(YEASTS).id,
      extra: Math.random() > 0.5 ? pick(EXTRAS).id : null,
    })
    setAnnounce('Собран случайный рецепт')
  }

  /* --- варка ----------------------------------------------------------- */

  function brew() {
    if (!complete || !stats) return
    setPhase('brewing')
    setStage(0)
    setAdded('')
  }

  useEffect(() => {
    if (phase !== 'brewing') return
    if (stage >= STAGES.length) {
      setName(defaultName(stats?.style ?? 'МОЁ ПИВО'))
      if (stats) setLabel(contrastLabel(stats.color))
      setPhase('done')
      return
    }
    const timer = setTimeout(() => setStage((s) => s + 1), STAGE_MS)
    return () => clearTimeout(timer)
  }, [phase, stage, stats])

  // Результат — новое место на экране: переносим туда фокус и прокрутку
  useEffect(() => {
    if (phase === 'done') resultRef.current?.focus()
  }, [phase])

  function takeToCart() {
    if (!recipe || nameProblem) return
    const clean = { ...recipe, name: name.trim() }
    add(beerLineId(clean), qty, clean)
    setExpanded(false)
    setAdded(`Добавлено в корзину: ${beerTitle(clean)} × ${qty}`)
  }

  function rework() {
    setPhase('compose')
    setAdded('')
  }

  /* --- разметка ---------------------------------------------------------- */

  const slots: { label: string; id: string | null; optional?: boolean }[] = [
    { label: 'Солод', id: draft.malt },
    { label: 'Хмель', id: draft.hops[0] ?? null },
    { label: 'Хмель 2', id: draft.hops[1] ?? null, optional: true },
    { label: 'Дрожжи', id: draft.yeast },
    { label: 'Добавка', id: draft.extra, optional: true },
  ]

  const missing = missingParts(draft)

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* Живой регион: что положили и что достали — для скринридера */}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* ---------- Склад сырья ---------- */}
      <section aria-labelledby="inventory-title" className="bevel bg-surface p-2">
        <h2 id="inventory-title" className="text-hud text-ember uppercase">
          Склад сырья
        </h2>
        <p className="mt-[4px] text-sm text-steel-500">
          Нажмите на сырьё или перетащите его в котёл. Нажмите ещё раз — уберёте.
        </p>

        <div className="mt-2 space-y-3">
          {INVENTORY.map((group) => (
            <fieldset key={group.kind}>
              <legend className="text-[11px] uppercase tracking-widest text-steel-500">
                {group.title}
                {group.kind === 'hop' && ` · до ${MAX_HOPS}`}
                {group.kind === 'extra' && ' · по желанию'}
              </legend>

              <ul className="mt-1 grid grid-cols-2 gap-1 2xl:grid-cols-3">
                {group.items.map((item) => {
                  const selected = isSelected(item)
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        draggable={phase === 'compose'}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                        onClick={() => toggle(item)}
                        disabled={phase !== 'compose'}
                        aria-pressed={selected}
                        className={`flex h-full min-h-[44px] w-full items-start gap-1 p-[4px] text-left
                          ${selected ? 'bevel-in bg-rust/40' : 'bevel bg-steel-700 hover:bg-steel-500'}
                          disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <Sprite
                          src={`/sprites/${item.icon}.png`}
                          alt=""
                          size={48}
                          className="h-[32px] w-[32px] shrink-0 sm:h-[48px] sm:w-[48px]"
                        />
                        <span className="min-w-0">
                          <span className={`block break-words text-hud uppercase ${selected ? 'text-coal' : 'text-bone'}`}>
                            {item.title}
                          </span>
                          <span className="hidden text-[12px] leading-4 text-steel-500 sm:block">{item.note}</span>
                          <span className="block text-[12px] leading-4 text-coal tabular-nums">
                            +{formatMoney(item.priceMinor, BEER_CURRENCY)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          ))}
        </div>
      </section>

      {/* ---------- Котёл, рецепт и результат ---------- */}
      <section aria-labelledby="kettle-title" className="flex flex-col gap-2">
        <div className="bevel bg-surface p-2">
          <h2 id="kettle-title" className="text-hud text-ember uppercase">
            {phase === 'done' ? 'Готово' : 'Котёл'}
          </h2>

          {phase === 'done' && recipe ? (
            <div
              ref={resultRef}
              tabIndex={-1}
              className="mt-2 flex flex-col items-center gap-2 outline-none"
            >
              <div className="bottle-pop">
                <Sprite src={bottleDataUrl(recipe)} alt={`Бутылка пива «${name}»`} size={192} />
              </div>
              <p className="text-hud-lg text-coal uppercase">{name || '…'}</p>
              <p className="text-steel-500 uppercase">
                {/* Имя по умолчанию и есть стиль — второй раз его не повторяем */}
                {stats && name !== stats.style && `${stats.style} · `}
                {stats && formatAbv(stats.abv)} · 0,5 л
              </p>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                if (phase !== 'compose') return
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-2 flex flex-col items-center ${dragOver ? 'drop-active' : ''}`}
            >
              <Kettle brewing={phase === 'brewing'} />
            </div>
          )}

          {phase === 'brewing' && (
            <div className="mt-2" role="status">
              <p className="text-center text-hud text-coal uppercase">
                {STAGES[Math.min(stage, STAGES.length - 1)]}…
              </p>
              <div className="mt-1 flex gap-[4px]" aria-hidden="true">
                {STAGES.map((s, i) => (
                  <span key={s} className={`h-[8px] flex-1 ${i <= stage ? 'bg-ember' : 'bg-steel-700'}`} />
                ))}
              </div>
            </div>
          )}

          {phase === 'compose' && (
            <ul className="mt-2 grid grid-cols-5 justify-items-center gap-[4px]" aria-label="Рецепт">
              {slots.map((slot) => {
                const item = slot.id ? ingredient(slot.id) : null
                return (
                  <li key={slot.label} className="flex flex-col items-center gap-[4px]">
                    {item ? (
                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        aria-label={`${slot.label}: ${item.title}. Убрать из рецепта`}
                        className="flex h-[56px] w-[56px] items-center justify-center bevel-in bg-void hover:bg-steel-700"
                      >
                        <Sprite src={`/sprites/${item.icon}.png`} alt="" size={48} />
                      </button>
                    ) : (
                      <span
                        className="slot-empty flex h-[56px] w-[56px] items-center justify-center text-steel-500"
                        aria-label={`${slot.label}: пусто${slot.optional ? ', по желанию' : ''}`}
                      >
                        {slot.optional ? '·' : '?'}
                      </span>
                    )}
                    <span className="text-center text-[10px] uppercase leading-3 tracking-wider text-steel-500">
                      {slot.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {phase === 'done' && recipe && (
          <div className="bevel bg-surface p-2">
            <label htmlFor="beer-name" className="text-[11px] uppercase tracking-widest text-steel-500">
              Имя на этикетке
            </label>
            <input
              id="beer-name"
              value={name}
              maxLength={BEER_NAME_MAX}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'beer-name-error' : undefined}
              className="mt-[4px] min-h-[44px] w-full bevel-in bg-void px-1 text-hud text-bone uppercase"
            />
            {nameError && (
              <p id="beer-name-error" role="alert" className="mt-[4px] text-sm text-blood">
                {nameError}
              </p>
            )}

            <fieldset className="mt-2">
              <legend className="text-[11px] uppercase tracking-widest text-steel-500">Этикетка</legend>
              <div className="mt-[4px] flex flex-wrap gap-1">
                {LABELS.map((l) => (
                  <label key={l.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="label"
                      value={l.id}
                      checked={label === l.id}
                      onChange={() => setLabel(l.id)}
                      className="peer sr-only"
                    />
                    <span
                      className="flex h-[44px] w-[44px] items-center justify-center bevel peer-checked:outline peer-checked:outline-[3px] peer-checked:outline-coal peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-coal"
                      style={{ background: l.hex }}
                      title={l.title}
                    >
                      <span className="sr-only">{l.title}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Stepper value={qty} onChange={setQty} label={`Пиво «${name}»`} />
              <PixelButton onClick={takeToCart} disabled={!!nameProblem} className="px-3">
                Взять
              </PixelButton>
              <span className="text-hud text-coal tabular-nums">
                = {formatMoney(beerPriceMinor(recipe) * qty, BEER_CURRENCY)}
              </span>
            </div>

            <p role="status" className="mt-1 text-sm text-moss">
              {added}
            </p>

            <PixelButton variant="ghost" onClick={rework} className="mt-2">
              Изменить рецепт
            </PixelButton>
          </div>
        )}

        {/* ---------- Параметры ---------- */}
        <div className="bevel bg-surface p-2">
          <h2 className="text-hud text-ember uppercase">Паспорт пива</h2>

          {stats ? (
            <dl className="mt-1">
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 border-b-2 border-steel-700 py-1">
                <dt className="text-[11px] uppercase tracking-widest text-steel-500">Стиль</dt>
                <dd className="text-hud text-coal">{stats.style}</dd>
              </div>
              <StatBar stat={{ key: 'abv', label: 'Крепость', value: formatAbv(stats.abv), bar: Math.round((stats.abv / 10) * 100) }} />
              <StatBar stat={{ key: 'ibu', label: 'Горечь', value: `${stats.ibu} IBU`, bar: stats.ibu }} />
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 border-b-2 border-steel-700 py-1">
                <dt className="text-[11px] uppercase tracking-widest text-steel-500">Цвет</dt>
                <dd className="flex items-center gap-1 text-hud text-coal tabular-nums">
                  <span className="inline-block h-[16px] w-[32px] bevel-in" style={{ background: stats.color }} aria-hidden="true" />
                  {stats.ebc} EBC
                </dd>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 border-b-2 border-steel-700 py-1">
                <dt className="text-[11px] uppercase tracking-widest text-steel-500">Выдержка</dt>
                <dd className="text-hud text-coal tabular-nums">{formatDays(stats.agingDays)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1 text-steel-500">
              Не хватает: <span className="text-bone">{missing.join(', ')}</span>
            </p>
          )}

          {stats && (
            <p className="mt-1 text-sm text-steel-500">Во вкусе: {stats.notes.join('; ')}.</p>
          )}

          <p className="mt-2 flex items-baseline justify-between border-t-2 border-steel-500 pt-1">
            <span className="text-[11px] uppercase tracking-widest text-steel-500">Бутылка 0,5 л</span>
            <span className="text-hud-lg text-coal tabular-nums">
              {formatMoney(complete ? beerPriceMinor(draft) : partialPrice, BEER_CURRENCY)}
            </span>
          </p>
        </div>

        {/* ---------- Действия ---------- */}
        {phase === 'compose' && (
          <div className="flex flex-wrap gap-2">
            <PixelButton onClick={brew} disabled={!complete} className="px-3">
              Варить
            </PixelButton>
            <PixelButton variant="ghost" onClick={randomize}>
              Случайный рецепт
            </PixelButton>
            {(draft.malt || draft.hops.length || draft.yeast || draft.extra) && (
              <PixelButton variant="ghost" onClick={() => setDraft(EMPTY)}>
                Очистить
              </PixelButton>
            )}
          </div>
        )}

      </section>
    </div>
  )
}
