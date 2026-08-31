import { argon2id, argon2Verify } from 'hash-wasm'

// Параметры по рекомендации OWASP для argon2id: 19 МиБ, 2 прохода, p=1.
const PARAMS = { parallelism: 1, iterations: 2, memorySize: 19456, hashLength: 32 } as const

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return argon2id({ password, salt, ...PARAMS, outputType: 'encoded' })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash })
  } catch {
    return false
  }
}
