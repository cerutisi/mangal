import type { ReactNode } from 'react'

/** Поле формы: подпись, ошибка и подсказка связаны с input через id. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
  required = false,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] uppercase tracking-widest text-steel-500">
        {label}
        {required && (
          <span className="text-blood" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-steel-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="text-sm text-blood" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass =
  'min-h-[44px] w-full bevel-in bg-void px-1 py-1 text-bone placeholder:text-steel-500'
