import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Lock, Save, Timer } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { PontoAjudaFuncionario } from '../components/ponto/PontoAjudaFuncionario'
import { MonthCalendarGrid } from '../components/MonthCalendarGrid'
import { TimeInput24 } from '../components/TimeInput24'
import { validateTimesBeforeSave } from '../utils/pontoTimeValidation'
import { monthLabel, toLocalYMD, formatTimeBR, isoToTimeInput, nowTimeInput, normalizeTime24 } from '../utils/calendar'
import { getPunchForDay, listPontoMonth, salvarPontoDoDia } from '../services/pontoService'
import type { DayPunch } from '../types/ponto'
import { formatDuracaoHumana, overtimeMinutesDay, totalOvertimeMinutes } from '../utils/pontoOvertime'

function Ponto() {
  const { session } = useAuth()
  const today = useMemo(() => toLocalYMD(new Date()), [])
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [punches, setPunches] = useState<DayPunch[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  /** Funcionário só edita o dia de hoje */
  const selectedDate = today
  const [entradaHora, setEntradaHora] = useState('')
  const [saidaHora, setSaidaHora] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const clearSavedTimer = useRef<number | null>(null)

  const userId = session?.userId ?? ''
  const userNome = session?.nome ?? ''

  const syncFormFromDate = useCallback(
    async (date: string) => {
      if (!userId) return
      const p = await getPunchForDay(userId, date)
      setEntradaHora(isoToTimeInput(p?.entradaAt))
      setSaidaHora(isoToTimeInput(p?.saidaAt))
    },
    [userId]
  )

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const list = await listPontoMonth(year, month, userId)
      setPunches(list)
      await syncFormFromDate(selectedDate)
    } finally {
      setLoading(false)
    }
  }, [userId, year, month, selectedDate, syncFormFromDate])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      await syncFormFromDate(today)
    })
    return () => {
      cancelled = true
    }
  }, [today, syncFormFromDate])

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

  const salvar = async () => {
    const entradaNorm = entradaHora ? normalizeTime24(entradaHora) : ''
    const saidaNorm = saidaHora ? normalizeTime24(saidaHora) : ''
    if (entradaHora && entradaNorm === null) {
      setFormError('Hora de entrada inválida. Use formato 24h, ex: 08:00.')
      return
    }
    if (saidaHora && saidaNorm === null) {
      setFormError('Hora de saída inválida. Use formato 24h, ex: 18:00.')
      return
    }
    const entradaFinal = entradaNorm ?? ''
    const saidaFinal = saidaNorm ?? ''
    const validationError = validateTimesBeforeSave(entradaFinal, saidaFinal)
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (entradaFinal !== entradaHora) setEntradaHora(entradaFinal)
    if (saidaFinal !== saidaHora) setSaidaHora(saidaFinal)

    setActionLoading(true)
    setSavedMsg(null)
    setFormError(null)
    try {
      await salvarPontoDoDia(
        userId,
        userNome,
        selectedDate,
        entradaFinal || undefined,
        saidaFinal || undefined
      )
      await refresh()
      setSavedMsg('Horário salvo com sucesso.')
      if (clearSavedTimer.current) window.clearTimeout(clearSavedTimer.current)
      clearSavedTimer.current = window.setTimeout(() => setSavedMsg(null), 3500)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar ponto')
    } finally {
      setActionLoading(false)
    }
  }

  const resumoExtras = useMemo(() => {
    const diasComExtras = punches
      .map(p => {
        const min = overtimeMinutesDay(p)
        return min > 0 ? ({ ...p, min } as DayPunch & { min: number }) : null
      })
      .filter((row): row is DayPunch & { min: number } => row !== null)
      .sort((a, b) => b.date.localeCompare(a.date))

    const totalMinutos = totalOvertimeMinutes(punches)
    return { diasComExtras, totalMinutos }
  }, [punches])

  return (
    <div>
      <header className="page-header">
        <h1 className="text-white text-xl font-bold">Meu ponto</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Registre apenas o dia de hoje · formato 24h (ex: 18:00)
        </p>
      </header>

      <div className="page-body space-y-4 max-w-4xl">
        <div className="bg-gradient-to-br from-emerald-900/30 to-gray-800 border border-emerald-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1 text-emerald-300">
            <Clock size={20} />
            <h2 className="font-semibold text-white">
              Hoje — {new Date(today + 'T12:00:00').toLocaleDateString('pt-BR')}
            </h2>
          </div>
          <p className="text-emerald-400/80 text-xs mb-4 flex items-center gap-1">
            <Lock size={12} />
            Só é possível salvar o ponto do dia atual
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <TimeInput24
                id="entrada"
                label="Hora de entrada"
                value={entradaHora}
                onChange={setEntradaHora}
                borderClass="border-emerald-700/50"
                focusClass="focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setEntradaHora(nowTimeInput())}
                className="text-emerald-400/80 text-sm mt-2 px-3 py-2 min-h-[44px] hover:text-emerald-300 rounded-lg"
              >
                Usar horário agora
              </button>
            </div>
            <div>
              <TimeInput24
                id="saida"
                label="Hora de saída"
                value={saidaHora}
                onChange={setSaidaHora}
                borderClass="border-teal-700/50"
                focusClass="focus:border-teal-400"
              />
              <button
                type="button"
                onClick={() => setSaidaHora(nowTimeInput())}
                className="text-teal-400/80 text-sm mt-2 px-3 py-2 min-h-[44px] hover:text-teal-300 rounded-lg"
              >
                Usar horário agora
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-red-300 text-sm bg-red-900/40 border border-red-700/50 rounded-xl p-3 mb-3">
              {formError}
            </p>
          )}

          <button
            type="button"
            disabled={actionLoading || (!entradaHora && !saidaHora)}
            onClick={() => void salvar()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold min-h-[48px] py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Save size={20} />
            {actionLoading ? 'Salvando…' : savedMsg ? 'Salvo' : 'Salvar horários'}
          </button>

          {savedMsg && (
            <div className="mt-3 text-center text-xs text-emerald-200 bg-emerald-900/20 border border-emerald-700/40 rounded-lg py-2 px-3">
              {savedMsg}
            </div>
          )}
        </div>

        <PontoAjudaFuncionario userId={userId} userNome={userNome} />

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="touch-target text-gray-400 hover:text-white rounded-lg"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-white font-semibold">{monthLabel(year, month)}</h2>
            <button
              type="button"
              onClick={nextMonth}
              className="touch-target text-gray-400 hover:text-white rounded-lg"
              aria-label="Próximo mês"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">Carregando calendário…</p>
          ) : (
            <MonthCalendarGrid
              year={year}
              month={month}
              punches={punches}
              userId={userId}
              selectedDate={today}
              editableDate={today}
            />
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-950/50 border border-emerald-700/50" /> Dia completo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-950/30 border border-amber-700/50" /> Falta
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded ring-2 ring-indigo-500/60" /> Hoje (único editável)
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              Dias passados: só consulta
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <Timer size={18} />
              <h3 className="text-white font-semibold text-sm">Horas extras no mês</h3>
            </div>
            <p className="text-gray-500 text-xs mb-3">
              Regra automática: soma o tempo trabalhado <span className="text-gray-400">após as 18:00</span> em cada
              dia em que há entrada e saída (horário local).
            </p>
            <p className="text-amber-200/90 text-lg font-semibold tabular-nums">
              {formatDuracaoHumana(resumoExtras.totalMinutos)}
            </p>
            {resumoExtras.diasComExtras.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs text-gray-400 max-h-40 overflow-y-auto">
                {resumoExtras.diasComExtras.map(row => (
                  <li key={row.id} className="flex justify-between gap-2 border-b border-gray-700/50 pb-1.5 last:border-0">
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
              <p className="text-gray-500 text-xs mt-2">Nenhum dia com hora extra neste mês (ou faltam saídas).</p>
            )}
          </div>
        </div>

        {(entradaHora || saidaHora) && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300">
            Pré-visualização: entrada {entradaHora || '—'} · saída {saidaHora || '—'}
            {punches.find(p => p.date === selectedDate) && (
              <span className="block text-gray-500 mt-1">
                Salvo: E {formatTimeBR(punches.find(p => p.date === selectedDate)?.entradaAt)} · S{' '}
                {formatTimeBR(punches.find(p => p.date === selectedDate)?.saidaAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Ponto
