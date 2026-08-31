import { CartHud } from '@/components/hud/CartHud'
import { SiteFooter } from '@/components/storefront/SiteFooter'
import { getSettings } from '@/lib/settings.server'

export default async function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const settings = await getSettings()

  return (
    <>
      {/* Отступ снизу зарезервирован с первого кадра: HUD не должен сдвигать контент */}
      <div className="min-h-screen pb-[104px] md:pb-[112px]">
        <a
          href="#arsenal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bevel focus:bg-ember focus:px-2 focus:py-1 focus:text-on-accent"
        >
          Перейти к каталогу
        </a>
        {children}
        <SiteFooter settings={settings} />
      </div>
      {modal}
      <CartHud />
    </>
  )
}
