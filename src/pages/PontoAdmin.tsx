import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CloudUpload, Database, Download, HardDrive, Timer, Users } from 'lucide-react'
import { listFuncionariosAsync } from '../services/userService'
import { MonthCalendarGrid } from '../components/MonthCalendarGrid'
import { formatTimeBR, monthLabel } from '../utils/calendar'
import { getStorageMode, listPontoMonth, migrateLocalPontoToDatabase } from '../services/pontoService'
import { loadPonto, PONTO_CHANGED_EVENT, PONTO_STORAGE_KEY } from '../utils/pontoStorage'
import { exportPontoCsv } from '../utils/exportRelatorios'
import type { DayPunch } from '../types/ponto'
import { formatDuracaoHumana, overtimeMinutesDay, totalOvertimeMinutes } from '../utils/pontoOvertime'
import { PontoAjudaAdminPanel } from '../components/admin/PontoAjudaAdminPanel'

function PontoAdmin() {
  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string; login: string }[]>([])
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [selectedUserId, setSelectedUserId] = useState<string>('todos')
  const [punches, setPunches] = useState<DayPunch[]>([])
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const storageMode = getStorageMode()

  useEffect(() => {
    void listFuncionariosAsync().then(list => {
      setFuncionarios(list.map(f => ({ id: f.id, nome: f.nome, login: f.login })))
    })
  }, [])

  /** Sempre o mês inteiro (todos os funcionários) para os cards e para filtrar na UI. */
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const list = await listPontoMonth(year, month)
      setPunches(list)
      setLastSync(new Date())
    } finally {
      if (!silent) setLoading(false)
    }
  }, [year, month])

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
      void refresh(true)
    }, 8000)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PONTO_STORAGE_KEY) void refresh(true)
    }
    const onChanged = () => void refresh(true)
    window.addEventListener('storage', onStorage)
    window.addEventListener(PONTO_CHANGED_EVENT, onChanged as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(PONTO_CHANGED_EVENT, onChanged as EventListener)
    }
  }, [refresh])

  const migrarLocal = async () => {
    setMigrating(true)
    try {
      const n = await migrateLocalPontoToDatabase()
      await refresh(true)
      window.alert(n > 0 ? `${n} registro(s) enviado(s) para a nuvem.` : 'Nada no armazenamento local para enviar.')
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao enviar para a nuvem.')
    } finally {
      setMigrating(false)
    }
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else setMonth(m => m + 1)
  }

  const resumoFuncionarios = useMemo(() => {
    return funcionarios.map(f => {
      const doFunc = punches.filter(p => p.userId === f.id)
      const diasCompletos = doFunc.filter(p => p.entradaAt && p.saidaAt).length
      const diasSoEntrada = doFunc.filter(p => p.entradaAt && !p.saidaAt).length
      const minutosExtras = totalOvertimeMinutes(doFunc)
      return { ...f, diasCompletos, diasSoEntrada, total: doFunc.length, minutosExtras }
    })
  }, [funcionarios, punches])

  const totalExtrasEquipe = useMemo(
    () => resumoFuncionarios.reduce((acc, f) => acc + f.minutosExtras, 0),
    [resumoFuncionarios]
  )

  const extrasFuncionarioSelecionado = useMemo(() => {
    if (selectedUserId === 'todos') return null
    const doFunc = punches.filter(p => p.userId === selectedUserId)
    const diasComExtras = doFunc
      .map(p => {
        const min = overtimeMinutesDay(p)
        return min > 0 ? ({ ...p, min } as DayPunch & { min: number }) : null
      })
      .filter((row): row is DayPunch & { min: number } => row !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
    return {
      totalMinutos: totalOvertimeMinutes(doFunc),
      diasComExtras,
      nome: funcionarios.find(f => f.id === selectedUserId)?.nome ?? 'Funcionário',
    }
  }, [punches, selectedUserId, funcionarios])

  const punchesVisiveis = useMemo(
    () =>
      selectedUserId === 'todos' ? punches : punches.filter(p => p.userId === selectedUserId),
    [punches, selectedUserId]
  )

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-white text-xl font-bold">Ponto — Administrador</h1>
            <p className="text-gray-400 text-xs mt-0.5">Acompanhe entrada e saída de todos os funcionários</p>
            {lastSync && (
              <p className="text-gray-600 text-[10px] mt-1">
                Atualizado {lastSync.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            {storageMode === 'database' ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                <Database size={14} />
                Nuvem
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/40 text-amber-200 border border-amber-700/40">
                <HardDrive size={14} />
                Local (não sincroniza)
              </span>
            )}
            {storageMode === 'database' && loadPonto().length > 0 && (
              <button
                type="button"
                disabled={migrating}
                onClick={() => void migrarLocal()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-800 hover:bg-amber-700 disabled:opacity-60 text-amber-50 text-xs"
              >
                <CloudUpload size={14} />
                {migrating ? 'Enviando…' : 'Enviar local → nuvem'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="page-body space-y-4 max-w-5xl">
        <PontoAjudaAdminPanel />

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevMonth} className="touch-target text-gray-400 hover:text-white rounded-lg" aria-label="Mês anterior">
              <ChevronLeft size={24} />
            </button>
            <span className="text-white font-semibold text-sm sm:text-base min-w-0 flex-1 text-center px-1">{monthLabel(year, month)}</span>
            <button type="button" onClick={nextMonth} className="touch-target text-gray-400 hover:text-white rounded-lg" aria-label="Próximo mês">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="touch-select w-full sm:w-auto bg-gray-800 border border-gray-700 text-white"
            >
              <option value="todos">Todos os funcionários</option>
              {funcionarios.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => exportPontoCsv(punchesVisiveis, monthLabel(year, month))}
              className="touch-btn w-full sm:w-auto bg-emerald-800 hover:bg-emerald-700 text-white text-sm inline-flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Exportar mês
            </button>
          </div>
        </div>

        {/* Resumo cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resumoFuncionarios.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedUserId(f.id)}
              className={`text-left bg-gray-800 border rounded-xl p-4 transition-colors ${
                selectedUserId === f.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 text-indigo-300 mb-2">
                <Users size={16} />
                <span className="text-white font-semibold">{f.nome}</span>
              </div>
              <p className="text-gray-400 text-xs">login: {f.login}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="text-emerald-400">{f.diasCompletos} dias ok</span>
                <span className="text-emerald-300/90">{f.diasSoEntrada} falta</span>
                <span className="text-amber-300/90">{formatDuracaoHumana(f.minutosExtras)} extra</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-300 mb-2">
            <Timer size={18} />
            <h2 className="text-white font-semibold">Horas extras da equipe</h2>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Soma automática do tempo trabalhado <span className="text-gray-400">após as 18:00</span> em cada dia com
            entrada e saída. Total da equipe no mês:{' '}
            <span className="text-amber-200/90 font-semibold">{formatDuracaoHumana(totalExtrasEquipe)}</span>
          </p>
          {loading ? (
            <p className="text-gray-400 text-sm py-4 text-center">Carregando…</p>
          ) : funcionarios.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum funcionário cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-gray-700">
                    <th className="p-2">Funcionário</th>
                    <th className="p-2 text-right">Horas extras</th>
                  </tr>
                </thead>
                <tbody>
                  {[...resumoFuncionarios]
                    .sort((a, b) => b.minutosExtras - a.minutosExtras || a.nome.localeCompare(b.nome))
                    .map(f => (
                      <tr
                        key={f.id}
                        className={`border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/20 ${
                          selectedUserId === f.id ? 'bg-indigo-950/30' : ''
                        }`}
                        onClick={() => setSelectedUserId(f.id)}
                      >
                        <td className="p-2 text-white">{f.nome}</td>
                        <td className="p-2 text-right text-amber-300/90 tabular-nums font-medium">
                          {formatDuracaoHumana(f.minutosExtras)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {extrasFuncionarioSelecionado && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-white text-sm font-medium mb-1">
                Detalhe — {extrasFuncionarioSelecionado.nome}
              </p>
              <p className="text-amber-200/90 text-base font-semibold tabular-nums mb-2">
                {formatDuracaoHumana(extrasFuncionarioSelecionado.totalMinutos)}
              </p>
              {extrasFuncionarioSelecionado.diasComExtras.length > 0 ? (
                <ul className="space-y-1 text-xs text-gray-400 max-h-36 overflow-y-auto">
                  {extrasFuncionarioSelecionado.diasComExtras.map(row => (
                    <li
                      key={row.id}
                      className="flex justify-between gap-2 border-b border-gray-700/50 pb-1 last:border-0"
                    >
                      <span className="text-gray-300">
                        {new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <span className="text-amber-400/90 tabular-nums shrink-0">
                        +{formatDuracaoHumana(row.min)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-xs">Nenhum dia com hora extra neste mês.</p>
              )}
            </div>
          )}
        </div>

        {selectedUserId !== 'todos' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            {loading ? (
              <p className="text-gray-400 text-center py-8">Carregando…</p>
            ) : (
              <MonthCalendarGrid
                year={year}
                month={month}
                punches={punchesVisiveis}
                userId={selectedUserId}
              />
            )}
          </div>
        )}

        {/* Tabela do mês */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">Registros do mês</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-700">
                  <th className="p-3">Data</th>
                  <th className="p-3">Funcionário</th>
                  <th className="p-3">Entrada</th>
                  <th className="p-3">Saída</th>
                  <th className="p-3 text-right">Extra</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      Carregando…
                    </td>
                  </tr>
                ) : punchesVisiveis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      Nenhum registro neste mês.
                    </td>
                  </tr>
                ) : (
                  punchesVisiveis
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date) || a.userNome.localeCompare(b.userNome))
                    .map(p => {
                      const extraMin = overtimeMinutesDay(p)
                      return (
                      <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="p-3 text-gray-300">
                          {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 text-white">{p.userNome}</td>
                        <td className="p-3 text-emerald-300">{formatTimeBR(p.entradaAt)}</td>
                        <td className="p-3 text-teal-300">{formatTimeBR(p.saidaAt)}</td>
                        <td className="p-3 text-right text-amber-300/90 tabular-nums">
                          {extraMin > 0 ? formatDuracaoHumana(extraMin) : '—'}
                        </td>
                      </tr>
                    )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PontoAdmin
