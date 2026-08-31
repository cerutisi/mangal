import { Sprite } from '@/components/ui/Sprite'

/** Морда — сам мангал: угли вместо глаз, жаровня вместо рта. */
export function CartFace({ count, pulsing }: { count: number; pulsing: boolean }) {
  const state = pulsing ? 3 : count === 0 ? 0 : count < 3 ? 1 : 2
  const mood =
    state === 3 ? 'вспыхнул' : state === 0 ? 'потух' : state === 1 ? 'тлеет' : 'полыхает'

  return (
    <Sprite
      src={`/sprites/face-${state}.png`}
      alt={`Мангал ${mood}`}
      size={48}
      className={state >= 2 ? 'animate-ember' : ''}
    />
  )
}
