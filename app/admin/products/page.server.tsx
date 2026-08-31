import type { Metadata } from 'next'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { ProductsTable } from '@/components/admin/ProductsTable'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Товары', robots: { index: false } }

export default async function AdminProductsPage() {
  await requireSession()
  const rows = await db.select().from(products).orderBy(asc(products.slotIndex))

  return (
    <div>
      <h1 className="text-2xl font-semibold">Товары</h1>
      <div className="mt-4">
        <ProductsTable initial={rows} />
      </div>
    </div>
  )
}
