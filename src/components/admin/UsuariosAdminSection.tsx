import { useCallback, useEffect, useState } from 'react'
import { Cloud, KeyRound, Printer, RefreshCw, Users } from 'lucide-react'
import {
  generatePin,
  getDefaultPin,
  isCloudUserMode,
  listAllUsersAsync,
  resetFuncionarioToDefaultPin,
  updateUserPassword,
} from '../../services/userService'
import { getAuthEmailDomain } from '../../utils/authEmail'
import { APP_NAME } from '../../config/brand'
import type { SystemUser } from '../../data/users'

function printPinsSheet(funcionarios: SystemUser[], revealed: Record<string, string>) {
  const lines = [
    `${APP_NAME} — PINs dos funcionários`,
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    '',
    ...funcionarios.map(f => {
      const pin =
        revealed[f.id] ?? f.password ?? getDefaultPin(f.id) ?? '(rode npm run seed:auth no PC)'
      return `${f.nome}: PIN ${pin}`
    }),
    '',
    'Guarde em local seguro. Troque se alguém sair da equipe.',
  ]
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para imprimir a lista.')
    return
  }
  w.document.write(`<pre style="font-family:sans-serif;font-size:14px;padding:24px">${lines.join('\n')}</pre>`)
  w.document.close()
  w.print()
}

export function UsuariosAdminSection() {
  const cloud = isCloudUserMode()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await listAllUsersAsync()
    setUsers(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      await refresh()
    })
    return () => {
      cancelled = true
    }
  }, [refresh])

  const funcionarios = users.filter(u => u.role === 'funcionario')
  const admin = users.find(u => u.role === 'admin')

  const pinDisplay = (f: SystemUser) => {
    if (revealedPins[f.id]) return revealedPins[f.id]
    if (!cloud && f.password) return f.password
    const def = getDefaultPin(f.id)
    if (cloud && def) return def
    return '—'
  }

  const pinCaption = (f: SystemUser) => {
    if (revealedPins[f.id]) return 'definido agora'
    if (!cloud && f.password) return ''
    if (cloud) return 'padrão (após seed)'
    return ''
  }

  const salvarPin = async (userId: string) => {
    if (!/^\d{4,6}$/.test(newPin)) {
      alert('Use um PIN com 4 a 6 números.')
      return
    }
    setActionError(null)
    const result = await updateUserPassword(userId, newPin)
    if ('ok' in result && result.ok === false) {
      setActionError(result.message)
      return
    }
    setRevealedPins(prev => ({ ...prev, [userId]: newPin }))
    setEditingId(null)
    setNewPin('')
    await refresh()
  }

  const gerarNovoPin = async (userId: string) => {
    const pin = generatePin()
    setActionError(null)
    const result = await updateUserPassword(userId, pin)
    if ('ok' in result && result.ok === false) {
      setActionError(result.message)
      return
    }
    setRevealedPins(prev => ({ ...prev, [userId]: pin }))
    await refresh()
  }

  const restaurarPadrao = async (userId: string) => {
    setActionError(null)
    const result = await resetFuncionarioToDefaultPin(userId)
    if ('ok' in result && result.ok === false) {
      setActionError(result.message)
      return
    }
    const def = getDefaultPin(userId)
    if (def) setRevealedPins(prev => ({ ...prev, [userId]: def }))
    await refresh()
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Users size={20} className="text-emerald-400" />
            Acessos da equipe
            {cloud && (
              <span className="text-[10px] font-normal uppercase tracking-wide bg-sky-900/50 text-sky-300 border border-sky-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud size={12} /> Nuvem
              </span>
            )}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {cloud
              ? `Login na nuvem (Supabase). E-mails: login@${getAuthEmailDomain()}`
              : 'Cada funcionário entra tocando no nome e digitando o PIN.'}
          </p>
          {cloud && (
            <p className="text-amber-300/90 text-xs mt-2 leading-relaxed">
              Na nuvem o PIN fica oculto no servidor — abaixo aparecem os <strong className="text-amber-200">PINs
              padrão</strong> (1001, 1002…). Se o celular disser PIN errado, no PC rode{' '}
              <code className="text-amber-100 bg-amber-950/50 px-1 rounded">npm run seed:auth</code> para
              redefinir todos.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => printPinsSheet(funcionarios, revealedPins)}
          className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg shrink-0"
        >
          <Printer size={16} />
          Imprimir PINs
        </button>
      </div>

      {actionError && (
        <p className="text-red-300 text-sm bg-red-900/30 border border-red-800 rounded-lg p-3 mb-3">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando equipe…</p>
      ) : (
        <div className="space-y-2 mb-4">
          {funcionarios.map(f => (
            <div
              key={f.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div>
                <p className="text-white font-medium">{f.nome}</p>
                <p className="text-gray-500 text-xs">
                  Login: <span className="text-gray-400">{f.login}</span>
                  {cloud && (
                    <>
                      {' '}
                      · E-mail:{' '}
                      <span className="text-gray-400">
                        {f.login}@{getAuthEmailDomain()}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editingId === f.id ? (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Novo PIN"
                      className="w-24 bg-gray-950 text-white text-center rounded-lg px-2 py-1.5 border border-gray-600 font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void salvarPin(f.id)}
                      className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setNewPin('')
                      }}
                      className="text-xs text-gray-400 px-2"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-right sm:text-left">
                      <span className="text-emerald-400 font-mono text-lg font-bold tabular-nums">
                        PIN {pinDisplay(f)}
                      </span>
                      {pinCaption(f) && (
                        <p className="text-gray-500 text-[10px] mt-0.5">{pinCaption(f)}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(f.id)
                        setNewPin(revealedPins[f.id] ?? '')
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Alterar
                    </button>
                    <button
                      type="button"
                      onClick={() => void gerarNovoPin(f.id)}
                      className="text-xs bg-indigo-800 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg"
                      title="Gerar PIN aleatório"
                    >
                      Novo PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => void restaurarPadrao(f.id)}
                      className="text-xs text-gray-500 hover:text-gray-300 px-1"
                      title="Voltar PIN padrão (1001, 1002…)"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {admin && (
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3">
          <p className="text-indigo-200 text-xs font-medium uppercase mb-1 flex items-center gap-1">
            <KeyRound size={14} /> Administrador
          </p>
          {cloud ? (
            <>
              <p className="text-white text-sm">
                Usuário <span className="font-mono text-indigo-300">admin</span> · e-mail{' '}
                <span className="font-mono text-indigo-300">admin@{getAuthEmailDomain()}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Senha padrão após seed: <span className="font-mono text-gray-400">admin123</span> — altere no
                painel Supabase (Authentication → Users) se necessário.
              </p>
            </>
          ) : (
            <p className="text-white text-sm">
              Usuário <span className="font-mono text-indigo-300">admin</span> · senha{' '}
              <span className="font-mono text-indigo-300">{admin.password}</span>
            </p>
          )}
        </div>
      )}

      {cloud && (
        <div className="text-gray-500 text-xs mt-3 space-y-1">
          <p>
            <strong className="text-gray-400">PIN errado no celular?</strong> No PC, na pasta do projeto:{' '}
            <code className="text-gray-400">npm run seed:auth</code> — redefine Michael 1001, Kaique 1007, etc.
          </p>
          <p>
            Para <strong className="text-gray-400">Alterar / Novo PIN</strong> pelo app, publique a Edge Function{' '}
            <code className="text-gray-500">admin-update-password</code> (docs/AUTH-SUPABASE.md). Sem ela, use o seed
            acima.
          </p>
        </div>
      )}
    </div>
  )
}
