import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, Clock, Factory, Layers, Package, RefreshCw, TrendingUp } from 'lucide-react'
import { listFuncionariosAsync } from '../services/userService'
import { DashboardInsumos } from '../components/dashboard/DashboardInsumos'
import { DashboardVisaoMes } from '../components/dashboard/DashboardVisaoMes'
import { LayoutStatusList } from '../components/dashboard/LayoutStatusList'
import { loadSistemaConfig } from '../config/sistemaConfig'
import { listFinanceiro } from '../services/financeiroService'
import { listInsumos } from '../services/insumosService'
import { listProducaoEntries } from '../services/productionService'
import { listPontoMonth } from '../services/pontoService'
import type { LancamentoFinanceiro } from '../types/financeiro'
import { buildDashboardMesResumo } from '../utils/dashboardMesResumo'
import type { Layout } from '../types/layout'
import type { DayPunch } from '../types/ponto'
import { toLocalYMD } from '../utils/calendar'
import {
  countLayoutsByStatus,
  layoutsByStatus,
  pontoTodaySummary,
  productionLastNDays,
  productionTotalOnDay,
  recentProduction,
} from '../utils/dashboardStats'
import { LAYOUTS_CHANGED_EVENT, loadLayouts } from '../utils/layoutStorage'
import { getLayoutStatusLabel } from '../utils/layoutStatus'
import type { InsumoItem } from '../types/insumos'
import type { ProducaoEntry } from '../utils/productionStorage'

type LayoutTab = Layout['status']

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR')
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

function KpiCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className={`bg-gray-800 border rounded-2xl p-4 ${color}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-3xl font-bold mt-1 tabular-nums">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

function Dashboard() {
  const today = useMemo(() => toLocalYMD(new Date()), [])
  const now = useMemo(() => new Date(), [])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [producao, setProducao] = useState<ProducaoEntry[]>([])
  const [punches, setPunches] = useState<DayPunch[]>([])
  const [insumos, setInsumos] = useState<InsumoItem[]>([])
  const [financeiro, setFinanceiro] = useState<LancamentoFinanceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layoutTab, setLayoutTab] = useState<LayoutTab>('ativo')
  const [configTick, setConfigTick] = useState(0)

  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    void listFuncionariosAsync().then(list =>
      setFuncionarios(list.map(f => ({ id: f.id, nome: f.nome })))
    )
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLayouts(loadLayouts())
      const [prod, ponto, estoque, fin] = await Promise.all([
        listProducaoEntries(),
        listPontoMonth(now.getFullYear(), now.getMonth()),
        listInsumos(),
        listFinanceiro(),
      ])
      setProducao(prod)
      setPunches(ponto)
      setInsumos(estoque)
      setFinanceiro(fin)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [now])

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
    const syncLayouts = () => setLayouts(loadLayouts())
    window.addEventListener(LAYOUTS_CHANGED_EVENT, syncLayouts)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dabliu-layouts-v2') syncLayouts()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(LAYOUTS_CHANGED_EVENT, syncLayouts)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const counts = useMemo(() => countLayoutsByStatus(layouts), [layouts])
  const producao7d = useMemo(() => productionLastNDays(producao, 7), [producao])
  const pecasHoje = useMemo(() => productionTotalOnDay(producao, today), [producao, today])
  const pontoHoje = useMemo(
    () => pontoTodaySummary(punches, today, funcionarios.length),
    [punches, today, funcionarios.length]
  )
  const ultimosFechamentos = useMemo(() => recentProduction(producao, 5), [producao])

  const layoutsNaAba = useMemo(() => layoutsByStatus(layouts, layoutTab, 8), [layouts, layoutTab])

  const mesResumo = useMemo(() => {
    void configTick
    const cfg = loadSistemaConfig()
    return buildDashboardMesResumo(
      producao,
      financeiro,
      now.getFullYear(),
      now.getMonth(),
      cfg.valorMedioPeca
    )
  }, [producao, financeiro, now, configTick])

  const layoutTabs: { id: LayoutTab; count: number }[] = [
    { id: 'ativo', count: counts.ativo },
    { id: 'producao', count: counts.producao },
    { id: 'finalizado', count: counts.finalizado },
  ]

  const emptyPorAba: Record<LayoutTab, string> = {
    ativo: 'Nenhum layout ativo.',
    producao: 'Nenhum em produção.',
    finalizado: 'Nenhum finalizado.',
  }

  return (
    <div className="min-h-full">
      <header className="page-header">
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <div>
            <h1 className="text-white text-xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-xs mt-0.5">Resumo para gerência</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 px-3 py-2 rounded-lg disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </header>

      <div className="page-body max-w-5xl space-y-5">
        {error && (
          <div className="bg-red-950/40 border border-red-700/50 text-red-200 text-sm rounded-xl p-3">{error}</div>
        )}

        <DashboardVisaoMes
          resumo={mesResumo}
          loading={loading}
          onValorMedioSaved={() => setConfigTick(t => t + 1)}
        />

        {/* Números principais */}
        <section>
          <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Layouts</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Ativos"
              value={loading ? '…' : counts.ativo}
              color="border-emerald-500/40"
              icon={<Layers className="text-emerald-400" size={26} />}
            />
            <KpiCard
              label="Em produção"
              value={loading ? '…' : counts.producao}
              color="border-amber-500/40"
              icon={<Factory className="text-amber-400" size={26} />}
            />
            <KpiCard
              label="Finalizados"
              value={loading ? '…' : counts.finalizado}
              color="border-indigo-500/40"
              icon={<CheckCircle2 className="text-indigo-400" size={26} />}
            />
            <KpiCard
              label="Peças hoje"
              value={loading ? '…' : formatNumber(pecasHoje)}
              color="border-teal-500/40"
              icon={<TrendingUp className="text-teal-400" size={26} />}
            />
          </div>
        </section>

        {/* Produção 7 dias — um gráfico só */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <h2 className="text-white font-semibold text-sm">Peças produzidas — última semana</h2>
          {loading ? (
            <p className="text-gray-500 text-sm py-12 text-center">Carregando…</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={producao7d} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={value => [`${formatNumber(Number(value ?? 0))} peças`, '']}
                  labelFormatter={label => String(label)}
                />
                <Bar dataKey="total" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <Link to="/producao" className="text-indigo-400 text-xs mt-2 inline-block hover:underline">
            Abrir Produção →
          </Link>
        </section>

        <DashboardInsumos items={insumos} loading={loading} />

        {/* Layouts — abas em vez de 3 colunas */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-white font-semibold text-sm">Modelos por status</h2>
            <Link to="/layouts" className="text-indigo-400 text-xs hover:underline">
              Gerenciar layouts →
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {layoutTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLayoutTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  layoutTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {getLayoutStatusLabel(tab.id)} ({tab.count})
              </button>
            ))}
          </div>
          <LayoutStatusList
            title=""
            subtitle=""
            layouts={layoutsNaAba}
            emptyText={emptyPorAba[layoutTab]}
            hideFooter
          />
        </section>

        {/* Hoje: ponto + fechamentos */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-400" />
              Ponto hoje
            </h2>
            {loading ? (
              <p className="text-gray-500 text-sm">Carregando…</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-white tabular-nums">
                  {pontoHoje.comEntrada}/{pontoHoje.totalFuncionarios}
                </p>
                <p className="text-gray-500 text-xs mt-1">com entrada registrada</p>
                <p className="text-gray-500 text-xs mt-2">
                  {pontoHoje.diaCompleto} dia completo · {pontoHoje.semPonto} sem entrada
                </p>
                <Link to="/ponto-admin" className="text-indigo-400 text-xs mt-3 inline-block hover:underline">
                  Ver equipe →
                </Link>
              </>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
              <Package size={16} className="text-emerald-400" />
              Últimos fechamentos
            </h2>
            {loading ? (
              <p className="text-gray-500 text-sm">Carregando…</p>
            ) : ultimosFechamentos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum fechamento ainda.</p>
            ) : (
              <ul className="space-y-2">
                {ultimosFechamentos.map(e => (
                  <li key={e.id} className="flex justify-between gap-2 text-sm border-b border-gray-700/50 pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="text-white truncate">{e.nome}</p>
                      <p className="text-gray-500 text-xs">{formatDateTime(e.createdAt)}</p>
                    </div>
                    <span className="text-emerald-400 font-semibold shrink-0 tabular-nums">
                      {formatNumber(e.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
