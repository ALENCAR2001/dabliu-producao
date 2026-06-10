import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCircle2, Clock, Phone, X } from 'lucide-react'
import { listPontoAjuda, resolverPontoAjudaComHorario } from '../../services/pontoAjudaService'
import { getPunchForDay } from '../../services/pontoService'
import type { PontoAjudaSolicitacao } from '../../types/pontoAjuda'
import { isSupabaseConfigured } from '../../lib/supabase'
import { PONTO_AJUDA_CHANGED_EVENT } from '../../utils/pontoAjudaStorage'
import { TimeInput24 } from '../TimeInput24'
import { isoToTimeInput } from '../../utils/calendar'

type PontoAjudaAdminPanelProps = {
  onResolved?: () => void
}

export function PontoAjudaAdminPanel({ onResolved }: PontoAjudaAdminPanelProps) {
  const [pendentes, setPendentes] = useState<PontoAjudaSolicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvendo, setResolvendo] = useState<PontoAjudaSolicitacao | null>(null)
  const [entradaHora, setEntradaHora] = useState('')
  const [saidaHora, setSaidaHora] = useState('')
  const [carregandoHorario, setCarregandoHorario] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const cloud = isSupabaseConfigured()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setPendentes(await listPontoAjuda('pendente'))
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
    }, 8000)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dabliu-ponto-ajuda-v1') void refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  useEffect(() => {
    const onChanged = () => void refresh()
    window.addEventListener(PONTO_AJUDA_CHANGED_EVENT, onChanged as EventListener)
    return () => window.removeEventListener(PONTO_AJUDA_CHANGED_EVENT, onChanged as EventListener)
  }, [refresh])

  useEffect(() => {
    if (!resolvendo) {
      setEntradaHora('')
      setSaidaHora('')
      setFormError(null)
      return
    }

    let cancelled = false
    setCarregandoHorario(true)
    void getPunchForDay(resolvendo.userId, resolvendo.date)
      .then(punch => {
        if (cancelled) return
        setEntradaHora(isoToTimeInput(punch?.entradaAt))
        setSaidaHora(isoToTimeInput(punch?.saidaAt))
      })
      .finally(() => {
        if (!cancelled) setCarregandoHorario(false)
      })

    return () => {
      cancelled = true
    }
  }, [resolvendo])

  const fecharFormulario = () => {
    setResolvendo(null)
    setFormError(null)
  }

  const salvarEResolver = async () => {
    if (!resolvendo) return
    setFormError(null)
    setSalvando(true)
    try {
      await resolverPontoAjudaComHorario(resolvendo, entradaHora, saidaHora || undefined)
      fecharFormulario()
      await refresh()
      onResolved?.()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar horário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="bg-amber-950/20 border border-amber-700/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={18} className="text-amber-400" />
        <h2 className="text-white font-semibold text-sm">Pedidos de ajuda — ponto</h2>
        {!loading && pendentes.length > 0 && (
          <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {pendentes.length}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs mb-3 flex items-center gap-1">
        <Phone size={12} />
        Funcionários que esqueceram de registrar — informe o horário trabalhado e marque como resolvido.
      </p>
      {!cloud && (
        <p className="text-amber-200/80 text-[11px] mb-3">
          Modo local: pedidos aparecem apenas <strong>neste mesmo aparelho/navegador</strong>. Para receber pedidos
          enviados do celular/PC do funcionário, é necessário ativar a nuvem (Supabase).
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando…</p>
      ) : pendentes.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum pedido pendente.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {pendentes.map(p => (
            <li
              key={p.id}
              className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:justify-between">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">{p.userNome}</p>
                  <p className="text-gray-400 text-xs">
                    Dia:{' '}
                    <span className="text-amber-200">
                      {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    {' · '}
                    Pedido em{' '}
                    {new Date(p.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {p.motivo && <p className="text-gray-500 text-xs mt-1 italic">“{p.motivo}”</p>}
                </div>
                {resolvendo?.id !== p.id && (
                  <button
                    type="button"
                    onClick={() => setResolvendo(p)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg"
                  >
                    <Clock size={14} />
                    Registrar horário
                  </button>
                )}
              </div>

              {resolvendo?.id === p.id && (
                <div className="border-t border-gray-700 pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-emerald-300 text-xs font-medium flex items-center gap-1">
                      <Clock size={14} />
                      Horário trabalhado neste dia
                    </p>
                    <button
                      type="button"
                      onClick={fecharFormulario}
                      className="text-gray-500 hover:text-white p-1"
                      aria-label="Fechar"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {carregandoHorario ? (
                    <p className="text-gray-500 text-xs">Carregando horário atual…</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TimeInput24
                        id={`entrada-${p.id}`}
                        label="Entrada"
                        value={entradaHora}
                        onChange={setEntradaHora}
                        borderClass="border-emerald-700/50"
                        focusClass="focus:border-emerald-400"
                      />
                      <TimeInput24
                        id={`saida-${p.id}`}
                        label="Saída"
                        value={saidaHora}
                        onChange={setSaidaHora}
                        borderClass="border-teal-700/50"
                        focusClass="focus:border-teal-400"
                      />
                    </div>
                  )}

                  {formError && (
                    <p className="text-red-300 text-xs bg-red-900/40 border border-red-700/50 rounded-lg p-2">
                      {formError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={salvando || carregandoHorario || (!entradaHora && !saidaHora)}
                      onClick={() => void salvarEResolver()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg"
                    >
                      <CheckCircle2 size={14} />
                      {salvando ? 'Salvando…' : 'Salvar horário e resolver'}
                    </button>
                    <button
                      type="button"
                      onClick={fecharFormulario}
                      className="text-gray-400 text-xs px-3 py-2 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
