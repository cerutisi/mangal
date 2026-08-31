import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

/** Строка характеристики товара, показывается в карточке как HUD-полоса. */
export type ProductStat = {
  key: string
  label: string
  value: string
  /** 0..100 — заполнение полоски-индикатора */
  bar?: number
}

export const DELIVERY_TYPES = ['pickup', 'courier', 'post'] as const
export type DeliveryType = (typeof DELIVERY_TYPES)[number]

export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'in_progress',
  'shipped',
  'done',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ADMIN_ROLES = ['admin', 'manager'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

const now = sql`(unixepoch())`

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull().default(''),
    description: text('description').notNull().default(''),
    /** Цена в минорных единицах (грошах). Никогда не float. */
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull().default('PLN'),
    stats: text('stats', { mode: 'json' }).$type<ProductStat[]>().notNull().default([]),
    spriteUrl: text('sprite_url').notNull(),
    spriteAlt: text('sprite_alt').notNull(),
    slotIndex: integer('slot_index').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [index('products_slot_idx').on(t.slotIndex)],
)

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    number: text('number').notNull().unique(),
    /** Ключ идемпотентности: повторный сабмит той же формы не создаёт второй заказ */
    idempotencyKey: text('idempotency_key').unique(),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    comment: text('comment'),
    deliveryType: text('delivery_type', { enum: DELIVERY_TYPES }).notNull(),
    address: text('address'),
    status: text('status', { enum: ORDER_STATUSES }).notNull().default('new'),
    /** Итог пересчитан на сервере по актуальным ценам. */
    totalMinor: integer('total_minor').notNull(),
    currency: text('currency').notNull(),
    managerNote: text('manager_note'),
    meta: text('meta', { mode: 'json' })
      .$type<Record<string, string | null>>()
      .notNull()
      .default({}),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [index('orders_status_idx').on(t.status), index('orders_created_idx').on(t.createdAt)],
)

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  /** Снимок на момент заказа — цена не должна «уехать» задним числом. */
  titleSnapshot: text('title_snapshot').notNull(),
  priceMinorSnapshot: integer('price_minor_snapshot').notNull(),
  qty: integer('qty').notNull(),
})

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  login: text('login').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ADMIN_ROLES }).notNull().default('manager'),
  createdAt: integer('created_at').notNull().default(now),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
})

/** Попытки, которые надо ограничивать по частоте: заказы и логины. */
export const rateEvents = sqliteTable(
  'rate_events',
  {
    id: text('id').primaryKey(),
    bucket: text('bucket').notNull(),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('rate_events_bucket_idx').on(t.bucket, t.createdAt)],
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect
