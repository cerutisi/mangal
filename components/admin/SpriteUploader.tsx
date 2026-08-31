'use client'

import { useRef, useState } from 'react'
import { adminButton, adminLabel } from './ui'

const SCALES = [1, 2, 4] as const

export function SpriteUploader({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (url: string) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [scale, setScale] = useState<(typeof SCALES)[number]>(2)
  const [grid, setGrid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [uploadError, setUploadError] = useState('')

  async function upload(file: File) {
    setBusy(true)
    setUploadError('')
    setWarnings([])

    const body = new FormData()
    body.append('file', file)

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await response.json()
      if (!data.ok) {
        setUploadError(data.message)
        return
      }
      onChange(data.url)
      setWarnings(data.warnings ?? [])
    } catch {
      setUploadError('Не удалось загрузить файл. Проверьте связь и попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const size = 96 * scale

  return (
    <div>
      <span className={adminLabel}>Спрайт</span>

      <div className="mt-2 flex flex-wrap items-start gap-4">
        <div
          className="shrink-0 border border-slate-300 bg-slate-900 p-2"
          style={{ lineHeight: 0 }}
        >
          {value ? (
            <div className="relative" style={{ width: size, height: size }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Превью спрайта"
                width={size}
                height={size}
                style={{ imageRendering: 'pixelated', width: size, height: size }}
              />
              {grid && scale >= 2 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,.18) 1px, transparent 1px),' +
                      'linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px)',
                    backgroundSize: `${scale}px ${scale}px`,
                  }}
                />
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center text-xs text-slate-400"
              style={{ width: size, height: size }}
            >
              нет файла
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminButton}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Загружаем…' : 'Загрузить PNG'}
            </button>

            {value && (
              <button type="button" className={adminButton} onClick={() => onChange('')}>
                Убрать
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Масштаб:</span>
            {SCALES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                aria-pressed={scale === s}
                className={`rounded border px-2 py-1 ${
                  scale === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
                }`}
              >
                ×{s}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
            Сетка пикселей
          </label>

          <p className="max-w-xs text-xs text-slate-500">
            PNG до 512×512 и 200 КБ, палитра до 32 цветов. Квадратный — иначе поедет сетка слотов.
          </p>
        </div>
      </div>

      {warnings.map((warning) => (
        <p
          key={warning}
          className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900"
        >
          {warning}
        </p>
      ))}

      {(uploadError || error) && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {uploadError || error}
        </p>
      )}
    </div>
  )
}
