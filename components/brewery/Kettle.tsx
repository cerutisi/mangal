import type { CSSProperties } from 'react'
import { asset } from '@/lib/demo'

/** Котёл на мангале. Путь к листу кадров — через asset(): CSS не знает про basePath. */
export function Kettle({
  small = false,
  brewing = false,
  className = '',
}: {
  small?: boolean
  brewing?: boolean
  className?: string
}) {
  const style = { '--kettle-sheet': `url(${asset('/sprites/kettle-sheet.png')})` } as CSSProperties

  return (
    <div
      className={`kettle-sprite ${small ? 'kettle-sprite--sm' : ''} ${className}`}
      data-brewing={brewing}
      style={style}
      role="img"
      aria-label={
        brewing ? 'Медный котёл бурлит на мангале' : 'Медный котёл с суслом стоит на мангале'
      }
    />
  )
}
