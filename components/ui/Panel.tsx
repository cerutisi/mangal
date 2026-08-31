import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  return <Tag className={`bevel bg-surface ${className}`}>{children}</Tag>
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-hud-lg text-ember uppercase">
      <span aria-hidden="true" className="text-rust">
        {'// '}
      </span>
      {children}
    </h2>
  )
}
