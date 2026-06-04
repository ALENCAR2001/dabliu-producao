import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCircle2, Phone } from 'lucide-react'
import { listPontoAjuda, resolverPontoAjuda } from '../../services/pontoAjudaService'
import type { PontoAjudaSolicitacao } from '../../types/pontoAjuda'
import { isSupabaseConfigured } from '../../lib/supabase'
import { PONTO_AJUDA_CHANGED_EVENT } from '../../utils/pontoAjudaStorage'

type PontoAjudaAdminPanelProps = {
  onResolved?: () => void
}

export function PontoAjudaAdminPanel({ onResolved }: PontoAjudaAdminPanelProps) {
  const [pendentes, setPendentes] = useState<PontoAjudaSolicitacao[]>([])
  const [loading, setLoading] = useState(true)
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

  // Atualiza automaticamente para “chegar” sem recarregar
  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
    }, 8000)
    return () => window.clearInterval(id)
  }, [refresh])

  // Atualiza quando localStorage muda (mesmo navegador em outra aba/janela)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dabliu-ponto-ajuda-v1') {
        void refresh()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  // Atualiza instantaneamente quando o funcionário envia (mesma aba)
  useEffect(() => {
    const onChanged = () => void refresh()
    window.addEventListener(PONTO_AJUDA_CHANGED_EVENT, onChanged as EventListener)
    return () => window.removeEventListener(PONTO_AJUDA_CHANGED_EVENT, onChanged as EventListener)
  }, [refresh])

  const marcarResolvido = async (id: string) => {
    if (!confirm('Marcar como resolvido? (Após falar com o funcionário)')) return
    try {
      await resolverPontoAjuda(id)
      await refresh()
      onResolved?.()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar.')
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
        Funcionários que esqueceram de registrar — entre em contato e marque como resolvido.
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
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {pendentes.map(p => (
            <li
              key={p.id}
              className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between"
            >
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
              <button
                type="button"
                onClick={() => void marcarResolvido(p.id)}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg"
              >
                <CheckCircle2 size={14} />
                Resolvido
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
