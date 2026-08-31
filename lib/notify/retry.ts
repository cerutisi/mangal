import 'server-only'

/**
 * Три попытки с нарастающей паузой. Ошибка логируется и наружу не пробрасывается:
 * потеря заявки из-за упавшего SMTP недопустима, заказ уже сохранён.
 */
export async function withRetries<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const last = attempt === attempts
      console.error(`[notify:${label}] попытка ${attempt}/${attempts} не удалась`, error)
      if (last) return null
      await new Promise((r) => setTimeout(r, attempt * 400))
    }
  }
  return null
}
