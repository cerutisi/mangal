import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = { title: 'Вход в админку', robots: { index: false } }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-xl font-semibold">Вход в админку</h1>
      <p className="mt-1 text-sm text-slate-600">
        Доступ только для сотрудников мастерской.
      </p>
      <LoginForm next={next ?? '/admin/products'} />
    </div>
  )
}
