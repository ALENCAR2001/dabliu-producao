import { createContext } from 'react'
import type { AuthSession, UserRole } from '../types/auth'

type LoginResult = Promise<{ ok: true } | { ok: false; message: string }>

export type AuthContextValue = {
  session: AuthSession | null
  authReady: boolean
  isCloudAuth: boolean
  isAuthenticated: boolean
  role: UserRole | null
  isAdmin: boolean
  isFuncionario: boolean
  login: (login: string, password: string) => LoginResult
  loginAsUser: (userId: string, password: string) => LoginResult
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
