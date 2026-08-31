import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/current-user'
import { ProductForm } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Новый товар', robots: { index: false } }

export default async function NewProductPage() {
  await requireSession()

  return (
    <div>
      <h1 className="text-2xl font-semibold">Новый товар</h1>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  )
}
