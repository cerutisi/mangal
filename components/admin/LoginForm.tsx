'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/auth'
import { adminInput, adminLabel, adminPrimaryButton } from './ui'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    const data = new FormData(event.currentTarget)
    const result = await login(
      { login: String(data.get('login') ?? ''), password: String(data.get('password') ?? '') },
      next,
    )

    if (!result.ok) {
      setError(result.message)
      setPending(false)
      return
    }

    router.push(result.next)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="login" className={adminLabel}>
          Логин
        </label>
        <input id="login" name="login" autoComplete="username" required className={adminInput} />
      </div>

      <div>
        <label htmlFor="password" className={adminLabel}>
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={adminInput}
        />
      </div>

      {error && (
        <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className={adminPrimaryButton}>
        {pending ? 'Проверяем…' : 'Войти'}
      </button>
    </form>
  )
}
