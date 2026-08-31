import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ember text-on-accent hover:bg-coal',
  ghost: 'bg-steel-700 text-bone hover:bg-steel-500',
  danger: 'bg-blood text-bone hover:bg-ember hover:text-on-accent',
}

/** Тач-таргет ≥ 44px, объёмная рамка, жёсткая тень, нулевой радиус. */
const BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-1 bevel hard-shadow px-2 py-1 text-hud uppercase ' +
  'transition-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ' +
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-steel-500 disabled:shadow-none'

export function PixelButton({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />
}

export function PixelLink({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />
}
