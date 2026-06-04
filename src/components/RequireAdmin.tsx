import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Bloqueia rotas exclusivas do administrador */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/layouts" replace />
  }

  return <>{children}</>
}
