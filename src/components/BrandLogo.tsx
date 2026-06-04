import { useState } from 'react'
import { APP_NAME, BRAND_LOGO_URL } from '../config/brand'

type BrandLogoProps = {
  size?: 'card' | 'hero'
  className?: string
  centered?: boolean
}

const SIZE: Record<NonNullable<BrandLogoProps['size']>, string> = {
  card: 'h-24 w-[min(100%,15rem)]',
  hero: 'h-32 sm:h-36 w-[min(100%,18rem)]',
}

/** Logo na tela de login (não usar no menu interno). */
export function BrandLogo({ size = 'hero', className = '', centered = false }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <p className={`text-white font-bold text-xl tracking-wide ${centered ? 'text-center mx-auto' : ''} ${className}`}>
        {APP_NAME}
      </p>
    )
  }

  return (
    <img
      src={`${BRAND_LOGO_URL}?v=2`}
      alt={APP_NAME}
      className={`${SIZE[size]} object-contain shrink-0 brand-logo-login ${centered ? 'mx-auto' : ''} ${className}`}
      onError={() => setFailed(true)}
      decoding="async"
      draggable={false}
    />
  )
}
