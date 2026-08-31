import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/storefront/ProductDetail'
import { getProductBySlug } from '@/lib/catalog'
import { Modal } from '@/components/ui/Modal'

/**
 * Перехватывающий маршрут: при переходе с витрины карточка открывается
 * модалкой поверх арсенала, при прямом заходе по ссылке — обычной страницей.
 */
export default async function ProductModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.isActive) notFound()

  return (
    <Modal title={product.title}>
      <ProductDetail product={product} inModal />
    </Modal>
  )
}
