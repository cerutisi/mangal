import Image from 'next/image'

/**
 * Спрайт без оптимизации и сглаживания: оптимизатор Next убивает чёткость,
 * а дробное масштабирование замыливает пиксели.
 * Размеры задаются только целыми кратными исходных 96px.
 */
export function Sprite({
  src,
  alt,
  size,
  className = '',
  priority = false,
}: {
  src: string
  alt: string
  size: number
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      priority={priority}
      className={`pixelated ${className}`}
    />
  )
}
