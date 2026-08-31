import { Sprite } from '@/components/ui/Sprite'
import { Markdown } from '@/lib/markdown/Markdown'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/lib/db/schema'
import { StatBar } from './StatBar'
import { AddToCart } from './AddToCart'

export function ProductDetail({ product, inModal = false }: { product: Product; inModal?: boolean }) {
  return (
    <article className="grid gap-3 md:grid-cols-[auto_1fr] md:gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className={`bevel-in bg-void p-2 ${product.inStock ? '' : 'opacity-60 grayscale'}`}>
          {/* Целочисленный масштаб: ×1 на узком экране, ×2 начиная с md */}
          <Sprite
            src={product.spriteUrl}
            alt={product.spriteAlt}
            size={192}
            priority
            className="h-[96px] w-[96px] md:h-[192px] md:w-[192px]"
          />
        </div>
        <p className="text-hud text-rust">СЛОТ {product.slotIndex}</p>
      </div>

      <div className="min-w-0">
        <h1 className="text-hud-lg text-bone uppercase">{product.title}</h1>
        <p className="mt-1 text-steel-500">{product.tagline}</p>

        <p className="mt-2 text-hud-lg text-coal tabular-nums">
          {formatMoney(product.priceMinor, product.currency)}
        </p>

        {product.stats.length > 0 && (
          <dl className="mt-3">
            {product.stats.map((stat) => (
              <StatBar key={stat.key} stat={stat} />
            ))}
          </dl>
        )}

        <div className="mt-3">
          <AddToCart
            productId={product.id}
            title={product.title}
            inStock={product.inStock}
            enterAdds={inModal}
          />
        </div>

        {product.description && (
          <div className="mt-3 border-t-2 border-steel-700 pt-2 text-bone">
            <Markdown source={product.description} />
          </div>
        )}
      </div>
    </article>
  )
}
