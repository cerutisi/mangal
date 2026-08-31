import Link from 'next/link'
import { MotionToggle } from '@/components/ui/MotionToggle'
import type { SiteSettings } from '@/lib/settings'

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-6 border-t-2 border-steel-700 bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-2 py-4 md:flex-row md:justify-between">
        <div className="max-w-md">
          <p className="text-hud text-bone uppercase">{settings.footer.about}</p>
          <p className="mt-1 text-sm text-steel-500">{settings.footer.legal}</p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          {/* Подсказка о хоткеях живёт здесь, а не во всплывашке */}
          <p className="text-[11px] uppercase leading-5 tracking-widest text-steel-500">
            <kbd className="bevel-in bg-void px-[4px] text-coal">1</kbd>–
            <kbd className="bevel-in bg-void px-[4px] text-coal">9</kbd> — выбрать мангал ·{' '}
            <kbd className="bevel-in bg-void px-[4px] text-coal">Enter</kbd> — взять ·{' '}
            <kbd className="bevel-in bg-void px-[4px] text-coal">Esc</kbd> — закрыть
          </p>

          <MotionToggle />

          <Link
            href="/admin/products"
            className="text-[11px] uppercase tracking-widest text-steel-500 hover:text-coal"
          >
            Служебный вход
          </Link>
        </div>
      </div>
    </footer>
  )
}
