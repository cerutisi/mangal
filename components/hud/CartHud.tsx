import { getCatalogEntries } from '@/lib/catalog'
import { CartHudClient } from './CartHudClient'

/** Серверная обёртка: тянет срез каталога и отдаёт его клиентскому HUD. */
export async function CartHud() {
  const catalog = await getCatalogEntries()
  return <CartHudClient catalog={catalog} />
}
