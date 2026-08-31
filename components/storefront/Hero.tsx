import type { CSSProperties } from 'react'
import { PixelLink } from '@/components/ui/PixelButton'
import { asset, DEMO_NOTICE, IS_STATIC_DEMO } from '@/lib/demo'
import type { SiteSettings } from '@/lib/settings'

export function Hero({ settings, demo }: { settings: SiteSettings; demo: boolean }) {
  // CSS не знает про basePath, поэтому пути к кадрам приходят отсюда
  const spriteVars = {
    '--hero-still': `url(${asset('/sprites/hero-still.png')})`,
    '--hero-sheet': `url(${asset('/sprites/hero-sheet.png')})`,
  } as CSSProperties

  const notice = IS_STATIC_DEMO ? DEMO_NOTICE : settings.demoNotice

  return (
    <section className="flex min-h-[calc(100svh-104px)] flex-col items-center justify-center gap-3 px-2 py-6 text-center md:min-h-[calc(100svh-112px)]">
      <div
        className="hero-sprite"
        style={spriteVars}
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

      {(demo || IS_STATIC_DEMO) && (
        <p className="mt-3 max-w-xl border-2 border-rust px-2 py-1 text-[11px] uppercase leading-5 tracking-widest text-rust">
          {notice}
        </p>
      )}
    </section>
  )
}
