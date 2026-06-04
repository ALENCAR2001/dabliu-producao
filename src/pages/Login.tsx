import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, Layers, Package, Shield, User, LogIn } from 'lucide-react'
import { FuncionarioQuickLogin } from '../components/login/FuncionarioQuickLogin'
import { APP_NAME } from '../config/brand'
import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth'

type LoginScreen = 'escolha' | 'funcionario' | 'admin'

type RoleLoginProps = {
  role: UserRole
  title: string
  subtitle: string
  onBack: () => void
}

function AdminLoginScreen({ title, subtitle, onBack }: RoleLoginProps) {
  const { login } = useAuth()
  const [loginId, setLoginId] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(loginId, password)
    setLoading(false)
    if (!result.ok) setError(result.message)
  }

  return (
    <div className="min-h-dvh relative overflow-hidden flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      <div className="login-blob absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-40 bg-indigo-500" />
      <div className="login-card-enter relative w-full max-w-md z-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div className="rounded-2xl border bg-gray-900/80 border-indigo-500/30 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b bg-gradient-to-r from-indigo-600/30 to-blue-600/20 border-indigo-500/20">
            <BrandLogo size="card" centered className="mb-4" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-300">
                <Shield size={26} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-indigo-100">{title}</h1>
                <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-1">Usuário</label>
              <input
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full bg-gray-950/80 text-white rounded-xl p-3.5 border border-indigo-700/50 focus:border-indigo-400 outline-none"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-gray-950/80 text-white rounded-xl p-3.5 border border-indigo-700/50 focus:border-indigo-400 outline-none"
                required
              />
            </div>

            {error && (
              <p className="text-red-300 text-sm bg-red-900/40 border border-red-700/50 rounded-xl p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3.5 rounded-xl text-white flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
            >
              <LogIn size={20} />
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Login() {
  const { isAuthenticated, isAdmin, authReady } = useAuth()
  const [screen, setScreen] = useState<LoginScreen>('escolha')

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
        Carregando…
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/' : '/layouts'} replace />
  }

  if (screen === 'funcionario') {
    return <FuncionarioQuickLogin onBack={() => setScreen('escolha')} />
  }

  if (screen === 'admin') {
    return (
      <AdminLoginScreen
        role="admin"
        title="Administrador"
        subtitle={`Gerência completa do ${APP_NAME}`}
        onBack={() => setScreen('escolha')}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] relative overflow-hidden">
      <div className="login-blob absolute top-20 left-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl" />
      <div
        className="login-blob absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl"
        style={{ animationDelay: '2s' }}
      />

      <div className="login-card-enter relative w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <BrandLogo size="hero" centered className="mb-5" />
          <p className="text-gray-400 text-sm">Escolha como entrar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setScreen('funcionario')}
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gray-900/70 backdrop-blur p-6 text-left transition-all hover:scale-[1.02] hover:border-emerald-400/60 active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-4">
              <User size={28} />
            </div>
            <h2 className="text-white text-lg font-bold">Funcionário</h2>
            <p className="text-gray-400 text-sm mt-2">Clique no seu nome + PIN</p>
            <p className="text-emerald-400/80 text-xs mt-2">Rápido — sem digitar usuário</p>
            <div className="flex gap-2 mt-3 text-emerald-400/80">
              <Layers size={18} />
              <Package size={18} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScreen('admin')}
            className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gray-900/70 backdrop-blur p-6 text-left transition-all hover:scale-[1.02] hover:border-indigo-400/60 active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 mb-4">
              <Shield size={28} />
            </div>
            <h2 className="text-white text-lg font-bold">Administrador</h2>
            <p className="text-gray-400 text-sm mt-2">Usuário e senha</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
