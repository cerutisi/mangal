import { PixelLink } from '@/components/ui/PixelButton'
import type { SiteSettings } from '@/lib/settings'

export function Hero({ settings, demo }: { settings: SiteSettings; demo: boolean }) {
  return (
    <section className="flex min-h-[calc(100svh-104px)] flex-col items-center justify-center gap-3 px-2 py-6 text-center md:min-h-[calc(100svh-112px)]">
      <div
        className="hero-sprite"
        role="img"
        aria-label="Пиксельный мангал: над жаровней горят угли, вверх поднимаются искры и дым"
      />

      <h1 className="text-hud-lg text-bone uppercase md:text-[48px] md:leading-[56px]">
        {settings.hero.title}
      </h1>

      <p className="prose-column text-balance text-steel-500 md:text-lg">
        {settings.hero.subtitle}
      </p>

      <PixelLink href="#arsenal" className="mt-2 px-3 text-hud-lg">
        {settings.hero.cta}
      </PixelLink>

      {demo && (
        <p className="mt-3 max-w-xl border-2 border-rust px-2 py-1 text-[11px] uppercase leading-5 tracking-widest text-rust">
          {settings.demoNotice}
        </p>
      )}
    </section>
  )
}
