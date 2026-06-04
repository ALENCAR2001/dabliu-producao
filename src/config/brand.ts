/** Nome oficial do sistema / empresa na interface */
export const APP_NAME = 'DABLIU JEANS'

/** Logo na tela de login — `public/brand/logo-login.png` */
export const BRAND_LOGO_URL = '/brand/logo-login.png'

/** Marca principal da empresa na lista de layouts */
export const COMPANY_MARCA = 'DABLIU JEANS'

/** Normaliza marcas antigas salvas no navegador (W, DABLIU → nome oficial) */
export function normalizeMarca(marca: string): string {
  const t = marca.trim()
  if (t === 'W' || t === 'DABLIU') return COMPANY_MARCA
  return t
}
