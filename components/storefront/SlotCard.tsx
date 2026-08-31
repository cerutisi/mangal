import Link from 'next/link'
import { Sprite } from '@/components/ui/Sprite'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/lib/db/schema'

export function SlotCard({ product }: { product: Product }) {
  return (
    <li>
      <Link
        href={`/product/${product.slug}`}
        className={`group flex h-full flex-col items-center gap-1 bevel bg-surface p-2 text-center
          hover:border-t-ember hover:border-l-ember hover:bg-steel-700
          ${product.inStock ? '' : 'opacity-60 grayscale'}`}
      >
        <span className="self-start text-hud text-rust tabular-nums group-hover:text-ember">
          {product.slotIndex}
        </span>

        <Sprite
          src={product.spriteUrl}
          alt={product.spriteAlt}
          size={96}
          className="group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
        />

        <h3 className="text-hud text-bone uppercase group-hover:text-coal">{product.title}</h3>

        <p className="mt-auto text-hud text-coal tabular-nums">
          {formatMoney(product.priceMinor, product.currency)}
        </p>

        {!product.inStock && (
          <p className="text-[11px] uppercase tracking-widest text-blood">Нет на складе</p>
        )}
      </Link>
    </li>
  )
}
