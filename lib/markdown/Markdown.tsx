import type { ReactNode } from 'react'

/**
 * Осознанно узкий подмножественный markdown: абзацы, списки, подзаголовки,
 * **жирный**, *курсив*, `код`. Ни ссылок, ни картинок, ни raw HTML.
 * Результат — React-узлы, а не строка: dangerouslySetInnerHTML нигде не нужен,
 * значит и XSS-поверхности нет.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="text-coal">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="bg-steel-900 px-[4px] text-coal">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{part}</span>
  })
}

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, '\n').split(/\n{2,}/).filter((b) => b.trim())

  return (
    <div className={`prose-column space-y-2 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')

        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={bi} className="space-y-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-1">
                  <span aria-hidden="true" className="text-ember">
                    ▸
                  </span>
                  <span>{inline(l.replace(/^\s*[-*]\s+/, ''), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          )
        }

        const heading = block.match(/^(#{2,4})\s+(.*)$/)
        if (heading) {
          return (
            <h3 key={bi} className="text-hud text-ember uppercase">
              {inline(heading[2], `${bi}-h`)}
            </h3>
          )
        }

        return <p key={bi}>{inline(block.replace(/\n/g, ' '), String(bi))}</p>
      })}
    </div>
  )
}
