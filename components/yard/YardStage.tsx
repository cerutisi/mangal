import type { CSSProperties } from 'react'
import { Sprite } from '@/components/ui/Sprite'
import { asset } from '@/lib/demo'

/**
 * Сцена двора: изба с дымом из трубы, мангал с огнём, ящик пива.
 * Без состояния и хуков — годится и для серверного тизера на главной,
 * и для живой страницы, куда мангал и ящик приходят из корзины.
 */
export function YardStage({
  mangalSrc,
  crateSrc,
  label,
  full = false,
  stoked = false,
  className = '',
}: {
  mangalSrc: string
  /** null — ящика во дворе пока нет */
  crateSrc: string | null
  /** Описание сцены целиком: внутри всё декоративное */
  label: string
  full?: boolean
  stoked?: boolean
  className?: string
}) {
  // Пути к листам кадров — через переменные: CSS не знает про basePath на Pages
  const sheets = {
    '--yard-sheet': `url(${asset('/sprites/yard-sheet.png')})`,
    '--fire-sheet': `url(${asset('/sprites/fire-sheet.png')})`,
  } as CSSProperties

  return (
    <div
      className={`yard ${full ? 'yard--full' : ''} ${className}`}
      style={sheets}
      data-stoked={stoked}
      role="img"
      aria-label={label}
    >
      <div className="yard-fire" aria-hidden="true" />
      <Sprite src={mangalSrc} alt="" size={96} className="yard-mangal" />
      {crateSrc && <Sprite src={crateSrc} alt="" size={96} className="yard-crate" />}
    </div>
  )
}
