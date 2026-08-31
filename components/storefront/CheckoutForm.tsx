'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { createOrder } from '@/actions/order'
import { useCart } from '@/lib/cart/store'
import { cartTotals } from '@/lib/cart/totals'
import type { CatalogEntry } from '@/lib/cart/types'
import { checkoutFieldsSchema, type CheckoutFields } from '@/lib/validation'
import { DELIVERY_LABELS } from '@/lib/orders'
import { formatMoney } from '@/lib/money'
import { Field, inputClass } from '@/components/ui/Field'
import { PixelButton, PixelLink } from '@/components/ui/PixelButton'

type Values = CheckoutFields
type Parsed = z.output<typeof checkoutFieldsSchema>

export function CheckoutForm({ catalog, demo }: { catalog: CatalogEntry[]; demo: boolean }) {
  const router = useRouter()
  const lines = useCart((s) => s.lines)
  const hydrated = useCart((s) => s.hydrated)
  const clear = useCart((s) => s.clear)

  const [serverError, setServerError] = useState('')
  const startedAt = useRef(Date.now())
  // Ключ живёт весь сеанс формы: повторный сабмит не создаст второй заказ
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(checkoutFieldsSchema),
    defaultValues: { deliveryType: 'pickup', address: '', comment: '' },
  })

  const deliveryType = watch('deliveryType')
  const needsAddress = deliveryType !== 'pickup'

  const { lines: resolved, totalMinor, currency, count } = useMemo(
    () => cartTotals(lines, catalog),
    [lines, catalog],
  )

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function onSubmit(values: Parsed) {
    setServerError('')

    const result = await createOrder({
      fields: values,
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      website: (document.getElementById('website') as HTMLInputElement | null)?.value ?? '',
      startedAt: startedAt.current,
      idempotencyKey,
    })

    if (!result.ok) {
      setServerError(result.message)
      for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(path as keyof Values, { message })
      }
      return
    }

    // Корзина очищается только после подтверждённого ответа сервера
    clear()
    router.push(`/order/${result.number}`)
  }

  if (hydrated && count === 0) {
    return (
      <div className="bevel bg-surface p-3">
        <p className="text-hud text-steel-500 uppercase">Арсенал пуст. Выберите оружие.</p>
        <PixelLink href="/#arsenal" className="mt-2">
          В арсенал
        </PixelLink>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        {/* Honeypot: человек его не видит и не таббится в него */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Не заполняйте это поле</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Field id="customerName" label="Имя" required error={errors.customerName?.message}>
          <input
            id="customerName"
            className={inputClass}
            autoComplete="name"
            aria-invalid={!!errors.customerName}
            {...register('customerName')}
          />
        </Field>

        <Field
          id="phone"
          label="Телефон"
          required
          hint="Формат +48 601 234 567"
          error={errors.phone?.message}
        >
          <input
            id="phone"
            className={inputClass}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+48 601 234 567"
            aria-invalid={!!errors.phone}
            {...register('phone')}
          />
        </Field>

        <Field id="email" label="Почта" required error={errors.email?.message}>
          <input
            id="email"
            className={inputClass}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field id="deliveryType" label="Доставка" required error={errors.deliveryType?.message}>
          <select id="deliveryType" className={inputClass} {...register('deliveryType')}>
            {Object.entries(DELIVERY_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-void">
                {label}
              </option>
            ))}
          </select>
        </Field>

        {needsAddress && (
          <Field
            id="address"
            label="Адрес"
            required
            hint="Город, улица, дом, квартира"
            error={errors.address?.message}
          >
            <input
              id="address"
              className={inputClass}
              autoComplete="street-address"
              aria-invalid={!!errors.address}
              {...register('address')}
            />
          </Field>
        )}

        <Field id="comment" label="Комментарий" error={errors.comment?.message}>
          <textarea id="comment" rows={3} className={inputClass} {...register('comment')} />
        </Field>

        {serverError && (
          <p role="alert" className="bevel border-blood bg-surface p-2 text-blood">
            {serverError}
          </p>
        )}

        <PixelButton type="submit" disabled={isSubmitting} className="self-start px-3">
          {isSubmitting ? 'Отправляем…' : 'Отправить заявку'}
        </PixelButton>

        <p className="text-sm text-steel-500">
          Отправляя форму, вы соглашаетесь на обработку указанных данных для связи по заявке.
        </p>
      </form>

      <aside className="bevel bg-surface p-2 lg:sticky lg:top-2 lg:self-start">
        <h2 className="text-hud text-ember uppercase">Заявка</h2>

        <ul className="mt-2 divide-y-2 divide-steel-700">
          {resolved.map((line) => (
            <li key={line.productId} className="flex justify-between gap-2 py-1">
              <span className="text-bone">
                {line.product.title}
                <span className="text-steel-500"> × {line.qty}</span>
              </span>
              <span className="shrink-0 text-coal tabular-nums">
                {formatMoney(line.sumMinor, line.product.currency)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 flex justify-between border-t-2 border-steel-500 pt-2 text-hud">
          <span className="text-steel-500">Итого</span>
          <span className="text-coal tabular-nums">{formatMoney(totalMinor, currency)}</span>
        </p>

        <p className="mt-1 text-sm text-steel-500">
          Сумму пересчитает сервер по актуальным ценам — здесь она только для ориентира.
        </p>

        {demo && (
          <p className="mt-2 border-2 border-rust p-1 text-[11px] uppercase leading-5 tracking-widest text-rust">
            Оплата на сайте не производится. Менеджер свяжется и подтвердит заказ.
          </p>
        )}
      </aside>
    </div>
  )
}
