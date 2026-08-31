import Link from 'next/link'
import { getSession } from '@/lib/auth/current-user'
import { logout } from '@/actions/auth'

/**
 * Админка намеренно без пиксельной стилистики: обычный читаемый интерфейс.
 * Заставлять менеджера заполнять поля шрифтом 8×8 — вредительство.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  const nav = [
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/orders', label: 'Заявки' },
    { href: '/admin/settings', label: 'Настройки' },
  ]

  return (
    <div className="admin-scope min-h-screen bg-slate-100 font-sans text-slate-900 antialiased [--spacing:0.25rem]">
      {session && (
        <header className="border-b border-slate-300 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
            <span className="font-semibold">Мангалы · админка</span>

            <nav className="flex gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-3 py-2 text-sm hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
              <Link href="/" className="underline hover:text-slate-900">
                Витрина
              </Link>
              <span>
                {session.login} · {session.role === 'admin' ? 'админ' : 'менеджер'}
              </span>
              <form action={logout}>
                <button className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
