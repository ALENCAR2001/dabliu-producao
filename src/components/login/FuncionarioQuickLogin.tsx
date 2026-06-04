import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, LogIn, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listFuncionariosAsync } from '../../services/userService'
import { cacheFuncionariosRoster, getLastFuncionarioId, loadCachedFuncionariosRoster } from '../../utils/usersStorage'
import type { SystemUser } from '../../data/users'
import { BrandLogo } from '../BrandLogo'

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type FuncionarioQuickLoginProps = {
  onBack: () => void
}

export function FuncionarioQuickLogin({ onBack }: FuncionarioQuickLoginProps) {
  const { loginAsUser } = useAuth()
  const [funcionarios, setFuncionarios] = useState<SystemUser[]>(() => loadCachedFuncionariosRoster())
  const lastId = useMemo(() => getLastFuncionarioId(), [])

  useEffect(() => {
    let cancelled = false
    void listFuncionariosAsync().then(list => {
      if (cancelled) return
      if (list.length > 0) {
        setFuncionarios(list)
        cacheFuncionariosRoster(list)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [selected, setSelected] = useState<SystemUser | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lastUser = lastId ? funcionarios.find(f => f.id === lastId) : undefined

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setError(null)
    setLoading(true)
    const result = await loginAsUser(selected.id, pin)
    setLoading(false)
    if (!result.ok) setError(result.message)
  }

  if (selected) {
    return (
      <div className="min-h-dvh relative overflow-y-auto flex items-start justify-center p-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900">
        <div className="login-blob absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-40 bg-emerald-500" />
        <div className="login-card-enter relative w-full max-w-md z-10">
          <button
            type="button"
            onClick={() => {
              setSelected(null)
              setPin('')
              setError(null)
            }}
            className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-sm min-h-[44px]"
          >
            <ArrowLeft size={18} />
            Trocar pessoa
          </button>

          <div className="rounded-2xl border border-emerald-500/30 bg-gray-900/80 backdrop-blur shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-600/30 to-teal-600/20 text-center">
              <BrandLogo size="card" centered className="mb-4" />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/25 text-emerald-200 text-xl font-bold flex items-center justify-center mx-auto mb-3">
                {initials(selected.nome)}
              </div>
              <h1 className="text-xl font-bold text-emerald-100">{selected.nome}</h1>
              <p className="text-gray-400 text-xs mt-1">Digite seu PIN de 4 dígitos</p>
            </div>

            <form onSubmit={submitPin} className="p-6 space-y-4">
              <div>
                <label className="text-gray-300 text-sm block mb-2 text-center">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="••••"
                  className="w-full bg-gray-950 text-white text-center text-3xl tracking-[0.5em] rounded-xl p-4 border border-emerald-700/50 focus:border-emerald-400 outline-none font-mono"
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm text-center bg-red-900/40 border border-red-700/50 rounded-xl p-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
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

  return (
    <div className="min-h-dvh relative overflow-y-auto flex flex-col bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 p-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="login-blob absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 bg-emerald-500" />

      <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-sm shrink-0 min-h-[44px]"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <BrandLogo size="hero" centered className="mb-6" />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Quem é você?</h1>
          <p className="text-gray-400 text-sm mt-1">Clique no seu nome — depois só o PIN</p>
        </div>

        {lastUser && (
          <button
            type="button"
            onClick={() => setSelected(lastUser)}
            className="mb-4 w-full flex items-center gap-3 bg-emerald-600/30 border border-emerald-500/50 rounded-xl p-4 text-left hover:bg-emerald-600/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 text-emerald-200 font-bold flex items-center justify-center">
              {initials(lastUser.nome)}
            </div>
            <div>
              <p className="text-emerald-200 text-xs font-medium uppercase">Entrada rápida</p>
              <p className="text-white font-semibold">{lastUser.nome}</p>
            </div>
          </button>
        )}

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 flex-1 content-start">
          {funcionarios.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(f)}
              className="flex items-center gap-3 bg-gray-900/70 border border-gray-700 hover:border-emerald-500/60 hover:bg-emerald-950/40 rounded-xl p-4 min-h-[56px] text-left transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                {initials(f.nome)}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{f.nome}</p>
                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <User size={12} /> Funcionário
                </p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-gray-600 text-[10px] text-center mt-6 pb-2">
          PIN com 4 números · Se esqueceu, peça ao administrador
        </p>
      </div>
    </div>
  )
}
