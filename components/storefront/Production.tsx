import { Sprite } from '@/components/ui/Sprite'
import { SectionTitle } from '@/components/ui/Panel'
import type { SiteSettings } from '@/lib/settings'

export function Production({ blocks }: { blocks: SiteSettings['production'] }) {
  return (
    <section id="production" className="mx-auto max-w-5xl px-2 py-6">
      <SectionTitle>Производство</SectionTitle>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {blocks.map((block) => (
          <li key={block.title} className="flex gap-2 bevel bg-surface p-2">
            <Sprite src={`/sprites/${block.icon}.png`} alt="" size={48} />
            <div>
              <h3 className="text-hud text-ember uppercase">{block.title}</h3>
              <p className="mt-1 text-bone">{block.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
