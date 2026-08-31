import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/current-user'
import { ProductForm } from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Правка товара', robots: { index: false } }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession()
  const { id } = await params

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-semibold">{product.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Изменения появятся на витрине сразу после сохранения.
      </p>
      <div className="mt-6">
        <ProductForm product={product} />
      </div>
    </div>
  )
}
