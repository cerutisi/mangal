import { z } from 'zod'
import { DELIVERY_TYPES, ORDER_STATUSES } from '@/lib/db/schema'

/** Страна продаж — Польша. Отсюда маска телефона и правила адреса. */
export const PHONE_COUNTRY_CODE = '+48'
export const PHONE_NATIONAL_DIGITS = 9

/** '+48 601 234 567' | '601234567' | '0048601234567' -> '+48601234567' */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').replace(/^00/, '')
  const national = digits.startsWith('48') ? digits.slice(2) : digits
  if (national.length !== PHONE_NATIONAL_DIGITS) return null
  if (!/^[4-9]/.test(national)) return null
  return `+48${national}`
}

/** '+48601234567' -> '+48 601 234 567' */
export function formatPhone(phone: string): string {
  const national = phone.replace(/\D/g, '').replace(/^48/, '')
  if (national.length !== PHONE_NATIONAL_DIGITS) return phone
  return `+48 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

const requiredText = (field: string, min: number, max: number) =>
  z
    .string({ required_error: `Заполните поле «${field}»` })
    .trim()
    .min(min, `«${field}» — минимум ${min} символа`)
    .max(max, `«${field}» — не длиннее ${max} символов`)

export const phoneField = z
  .string({ required_error: 'Укажите телефон, по нему свяжется менеджер' })
  .trim()
  .refine((v) => normalizePhone(v) !== null, {
    message: 'Телефон должен начинаться с +48 и содержать 9 цифр',
  })
  .transform((v) => normalizePhone(v)!)

export const emailField = z
  .string({ required_error: 'Укажите почту — туда придёт подтверждение' })
  .trim()
  .toLowerCase()
  .email('Почта должна выглядеть как name@example.com')
  .max(160, 'Слишком длинный адрес почты')

/** Поля, которые заполняет человек. Одна схема на клиент и сервер. */
export const checkoutFieldsSchema = z
  .object({
    customerName: requiredText('Имя', 2, 80),
    phone: phoneField,
    email: emailField,
    deliveryType: z.enum(DELIVERY_TYPES, {
      errorMap: () => ({ message: 'Выберите способ доставки' }),
    }),
    address: z.string().trim().max(200, 'Адрес не длиннее 200 символов').optional().default(''),
    comment: z.string().trim().max(1000, 'Комментарий не длиннее 1000 символов').optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType !== 'pickup' && data.address.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'Для доставки нужен адрес: город, улица, дом',
      })
    }
  })

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1, 'Минимум 1 штука').max(99, 'Максимум 99 штук за раз'),
})

/** То, что реально приходит в Server Action: поля + позиции + антиспам. */
export const createOrderSchema = z.object({
  fields: checkoutFieldsSchema,
  items: z.array(cartItemSchema).min(1, 'Арсенал пуст — сначала выберите мангал').max(20),
  /** honeypot: боты заполняют, люди не видят */
  website: z.string().max(0, 'Заявка не отправлена, обновите страницу').optional().default(''),
  /** время открытия формы, мс */
  startedAt: z.number().int().nonnegative(),
})

export type CheckoutFields = z.input<typeof checkoutFieldsSchema>
export type CreateOrderInput = z.input<typeof createOrderSchema>

export const productStatSchema = z.object({
  key: z.string().trim().min(1, 'Ключ характеристики обязателен').max(40),
  label: z.string().trim().min(1, 'Название характеристики обязательно').max(60),
  value: z.string().trim().min(1, 'Значение характеристики обязательно').max(60),
  bar: z.number().int().min(0).max(100).optional(),
})

export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Слаг слишком короткий')
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Слаг — только латиница в нижнем регистре и дефисы'),
  title: requiredText('Название', 2, 80),
  tagline: z.string().trim().max(120, 'Подзаголовок не длиннее 120 символов').default(''),
  description: z.string().trim().max(8000).default(''),
  priceMinor: z.number().int().min(0, 'Цена не может быть отрицательной').max(100_000_000),
  currency: z.enum(['PLN', 'BYN', 'RUB']),
  stats: z.array(productStatSchema).max(8, 'Не больше 8 характеристик'),
  spriteUrl: z.string().trim().min(1, 'Загрузите спрайт'),
  spriteAlt: requiredText('Описание спрайта', 3, 160),
  slotIndex: z.number().int().min(1, 'Слот от 1 до 9').max(9, 'Слот от 1 до 9'),
  isActive: z.boolean(),
  inStock: z.boolean(),
})

export const loginSchema = z.object({
  login: z.string().trim().min(2, 'Введите логин').max(40),
  password: z.string().min(8, 'Пароль минимум 8 символов').max(200),
})

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  managerNote: z.string().trim().max(2000).optional().default(''),
})
