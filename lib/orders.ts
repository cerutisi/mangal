import type { DeliveryType, OrderStatus } from '@/lib/db/schema'

export const DELIVERY_LABELS: Record<DeliveryType, string> = {
  pickup: 'Самовывоз из мастерской',
  courier: 'Курьер по городу',
  post: 'Транспортная компания',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  in_progress: 'В работе',
  shipped: 'Отгружена',
  done: 'Завершена',
  cancelled: 'Отменена',
}

export const STATUS_TONE: Record<OrderStatus, string> = {
  new: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  in_progress: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-violet-100 text-violet-900',
  done: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
}

/** 'ORD-0666' — человекочитаемый и произносимый по телефону. */
export function formatOrderNumber(sequence: number): string {
  return `ORD-${String(sequence).padStart(4, '0')}`
}
