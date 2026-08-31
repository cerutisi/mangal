import type { ProductStat } from '@/lib/db/schema'

const SEGMENTS = 10

/** Строка характеристики в виде HUD-полосы: подпись, значение, шкала. */
export function StatBar({ stat }: { stat: ProductStat }) {
  const filled = stat.bar === undefined ? null : Math.round((stat.bar / 100) * SEGMENTS)

  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 border-b-2 border-steel-700 py-1">
      <dt className="text-[11px] uppercase tracking-widest text-steel-500">{stat.label}</dt>
      <dd className="text-hud text-coal tabular-nums">{stat.value}</dd>

      {filled !== null && (
        <div
          className="col-span-2 flex gap-[2px]"
          role="meter"
          aria-valuenow={stat.bar}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${stat.label}: ${stat.value}`}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={`h-[8px] flex-1 ${i < filled ? 'bg-ember' : 'bg-steel-700'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
