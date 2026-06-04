export type UserRole = 'funcionario' | 'admin'

export type AuthSession = {
  /** legacy_id (func-1…) — compatível com ponto */
  userId: string
  authUserId?: string
  nome: string
  login: string
  role: UserRole
  loggedAt: string
}
