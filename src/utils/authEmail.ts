import type { UserRole } from '../types/auth'

const domain = (import.meta.env.VITE_AUTH_EMAIL_DOMAIN as string | undefined) || 'dabliu.app'

/** E-mail usado no Supabase Auth (login técnico → e-mail). */
export function loginToAuthEmail(login: string, role: UserRole): string {
  const slug = login.trim().toLowerCase()
  if (role === 'admin') return `admin@${domain}`
  return `${slug}@${domain}`
}

/** Converte "admin" ou e-mail completo para o e-mail Auth. */
export function resolveAuthEmail(loginOrEmail: string, role: UserRole): string {
  const q = loginOrEmail.trim()
  if (q.includes('@')) return q.toLowerCase()
  return loginToAuthEmail(q, role)
}

export function getAuthEmailDomain(): string {
  return domain
}
