import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession, UserRole } from '../types/auth'
import {
  fetchSessionFromAuth,
  signInFuncionarioByLegacyId,
  signInWithCredentials,
  signOutCloud,
  isCloudAuthEnabled,
} from '../services/authService'
import { findUserByLogin, verifyUser } from '../services/userService'
import { setLastFuncionarioId } from '../utils/usersStorage'
import { getSupabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './authContextStore'

const SESSION_KEY = 'dabliu-auth-session-v1'

function loadLocalSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function saveLocalSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function sessionFromUser(user: {
  id: string
  authId?: string
  nome: string
  login: string
  role: UserRole
}): AuthSession {
  return {
    userId: user.id,
    authUserId: user.authId,
    nome: user.nome,
    login: user.login,
    role: user.role,
    loggedAt: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isCloudAuth = isCloudAuthEnabled()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const applySession = useCallback((next: AuthSession | null) => {
    if (!isCloudAuth) saveLocalSession(next)
    setSession(next)
    if (next?.role === 'funcionario') setLastFuncionarioId(next.userId)
  }, [isCloudAuth])

  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined

    async function init() {
      if (isCloudAuth) {
        const client = getSupabase()
        const cloudSession = await fetchSessionFromAuth()
        if (!cancelled) {
          setSession(cloudSession)
          setAuthReady(true)
        }
        if (client && !cancelled) {
          const {
            data: { subscription },
          } = client.auth.onAuthStateChange(async () => {
            if (cancelled) return
            const next = await fetchSessionFromAuth()
            setSession(next)
          })
          unsub = () => subscription.unsubscribe()
        }
        return
      }

      if (!cancelled) {
        setSession(loadLocalSession())
        setAuthReady(true)
      }
    }

    void init()

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [isCloudAuth])

  const loginAsUser = useCallback(
    async (userId: string, password: string) => {
      if (isCloudAuth) {
        const result = await signInFuncionarioByLegacyId(userId, password)
        if (!result.ok) return result
        applySession(result.session)
        return { ok: true as const }
      }

      const user = verifyUser(userId, password)
      if (!user) {
        return {
          ok: false as const,
          message: 'PIN incorreto. Tente de novo ou fale com o administrador.',
        }
      }
      applySession(sessionFromUser(user))
      return { ok: true as const }
    },
    [applySession, isCloudAuth]
  )

  const login = useCallback(
    async (loginId: string, password: string) => {
      if (isCloudAuth) {
        const roleGuess: UserRole =
          loginId.trim().toLowerCase() === 'admin' ? 'admin' : 'funcionario'
        const result = await signInWithCredentials(loginId, password, roleGuess)
        if (!result.ok) return result
        if (result.session.role !== 'admin') {
          return { ok: false as const, message: 'Esta conta não é de administrador.' }
        }
        applySession(result.session)
        return { ok: true as const }
      }

      const user = findUserByLogin(loginId)
      if (!user || user.password !== password.trim()) {
        return { ok: false as const, message: 'Usuário ou senha incorretos.' }
      }
      if (user.role !== 'admin') {
        return { ok: false as const, message: 'Esta conta não é de administrador.' }
      }
      applySession(sessionFromUser(user))
      return { ok: true as const }
    },
    [applySession, isCloudAuth]
  )

  const logout = useCallback(async () => {
    if (isCloudAuth) await signOutCloud()
    applySession(null)
  }, [applySession, isCloudAuth])

  const value = useMemo<AuthContextValue>(() => {
    const role = session?.role ?? null
    return {
      session,
      authReady,
      isCloudAuth,
      isAuthenticated: Boolean(session),
      role,
      isAdmin: role === 'admin',
      isFuncionario: role === 'funcionario',
      login,
      loginAsUser,
      logout,
    }
  }, [session, authReady, isCloudAuth, login, loginAsUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
