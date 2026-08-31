import { SignJWT, jwtVerify } from 'jose'
import type { AdminRole } from '@/lib/db/schema'

export const SESSION_COOKIE = 'mangal_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 дней

export type SessionPayload = { sub: string; login: string; role: AdminRole }

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET не задан или короче 32 символов — см. .env.example')
  }
  return new TextEncoder().encode(value)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ login: payload.login, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

/** Работает и в Node, и в Edge — используется в middleware. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub || typeof payload.login !== 'string') return null
    return { sub: payload.sub, login: payload.login, role: payload.role as AdminRole }
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
