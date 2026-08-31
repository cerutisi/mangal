import { SectionTitle } from '@/components/ui/Panel'
import { SlotCard } from './SlotCard'
import { Hotkeys } from './Hotkeys'
import type { Product } from '@/lib/db/schema'

export function Arsenal({ products }: { products: Product[] }) {
  const slots = Object.fromEntries(
    products.filter((p) => p.slotIndex >= 1 && p.slotIndex <= 9).map((p) => [String(p.slotIndex), p.slug]),
  )

  return (
    <section id="arsenal" className="mx-auto max-w-5xl scroll-mt-2 px-2 py-6">
      <SectionTitle>Арсенал</SectionTitle>

      <p className="mt-1 text-steel-500">
        {products.length} позиций. Клавиши{' '}
        <kbd className="bevel-in bg-void px-[4px] text-coal">1</kbd>–
        <kbd className="bevel-in bg-void px-[4px] text-coal">9</kbd> открывают карточку.
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <SlotCard key={product.id} product={product} />
        ))}
      </ul>

      <Hotkeys slots={slots} />
    </section>
  )
}
