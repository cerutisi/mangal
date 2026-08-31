'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { adminUsers } from '@/lib/db/schema'
import { loginSchema } from '@/lib/validation'
import { verifyPassword } from '@/lib/auth/password'
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'
import { clientIp, countEvents, recordEvent } from '@/lib/ratelimit'

export type LoginResult = { ok: false; message: string } | { ok: true; next: string }

const ATTEMPT_LIMIT = 5
const ATTEMPT_WINDOW_SEC = 15 * 60
const BLOCK_SEC = 60 * 60

export async function login(input: unknown, next: string): Promise<LoginResult> {
  const ip = clientIp(await headers())

  // Превышение лимита ставит IP в блок на час — проверяем блок первым делом
  if ((await countEvents(`loginblock:${ip}`, BLOCK_SEC)) > 0) {
    return { ok: false, message: 'Слишком много попыток. Вход с этого адреса закрыт на час.' }
  }

  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Проверьте логин и пароль' }
  }

  const attempts = await countEvents(`login:${ip}`, ATTEMPT_WINDOW_SEC)
  if (attempts >= ATTEMPT_LIMIT) {
    await recordEvent(`loginblock:${ip}`)
    return { ok: false, message: 'Слишком много попыток. Вход с этого адреса закрыт на час.' }
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.login, parsed.data.login))
    .limit(1)

  // Проверяем пароль даже без пользователя, чтобы время ответа не выдавало логины
  const hash = user?.passwordHash ?? '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const valid = await verifyPassword(parsed.data.password, hash)

  if (!user || !valid) {
    await recordEvent(`login:${ip}`)
    return { ok: false, message: 'Неверный логин или пароль' }
  }

  const token = await signSession({ sub: user.id, login: user.login, role: user.role })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions())

  return { ok: true, next: next.startsWith('/admin') ? next : '/admin/products' }
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/admin/login')
}
