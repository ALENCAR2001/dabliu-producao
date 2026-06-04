import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { INSUMO_CATEGORIAS, type InsumoCategoria } from '../types/insumos'
import type { LancamentoFinanceiro } from '../types/financeiro'
import { monthLabel, toLocalYMD } from '../utils/calendar'
import {
  buildResumoFinanceiroMes,
  filterFinanceiroByMonth,
  formatMoedaBR,
  parseValorInput,
} from '../utils/financeiroResumo'
import { createLancamento, deleteLancamento, listFinanceiro } from '../services/financeiroService'
import { exportFinanceiroCsv } from '../utils/exportRelatorios'

type FormModo = 'entrada' | 'saida_geral' | 'saida_insumo'

function RelatorioFinanceiro() {
  const hoje = useMemo(() => toLocalYMD(new Date()), [])
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [todos, setTodos] = useState<LancamentoFinanceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modo, setModo] = useState<FormModo>('entrada')
  const [data, setData] = useState(hoje)
  const [valorStr, setValorStr] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaInsumo, setCategoriaInsumo] = useState<InsumoCategoria>('cola')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setTodos(await listFinanceiro())
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

  const doMes = useMemo(() => filterFinanceiroByMonth(todos, year, month), [todos, year, month])
  const resumo = useMemo(() => buildResumoFinanceiroMes(doMes), [doMes])
  const qtdEntradasMes = useMemo(() => doMes.filter(e => e.tipo === 'entrada').length, [doMes])
  const qtdSaidasMes = useMemo(() => doMes.filter(e => e.tipo === 'saida').length, [doMes])

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
    const valor = parseValorInput(valorStr)
    if (valor === null || valor <= 0) {
      alert('Informe um valor válido (ex.: 1500 ou 1500,50).')
      return
    }

    setSaving(true)
    try {
      if (modo === 'entrada') {
        await createLancamento({
          data,
          tipo: 'entrada',
          valor,
          grupo: 'geral',
          descricao,
        })
      } else if (modo === 'saida_geral') {
        await createLancamento({
          data,
          tipo: 'saida',
          valor,
          grupo: 'geral',
          descricao,
        })
      } else {
        await createLancamento({
          data,
          tipo: 'saida',
          valor,
          grupo: 'insumo',
          categoriaInsumo,
          descricao,
        })
      }
      setValorStr('')
      setDescricao('')
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const remover = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    try {
      await deleteLancamento(id)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir.')
    }
  }

  const lucroPositivo = resumo.lucro >= 0

  return (
    <div>
      <header className="page-header">
        <h1 className="text-white text-xl font-bold flex items-center gap-2">
          <Wallet size={22} className="text-emerald-400" />
          Relatório financeiro
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Receitas e despesas são lançadas manualmente por mês — não vêm da produção nem do estoque automaticamente.
        </p>
      </header>

      <div className="page-body space-y-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevMonth} className="p-2 text-gray-400 hover:text-white rounded-lg">
              <ChevronLeft size={24} />
            </button>
            <span className="text-white font-semibold min-w-[160px] text-center">{monthLabel(year, month)}</span>
            <button type="button" onClick={nextMonth} className="p-2 text-gray-400 hover:text-white rounded-lg">
              <ChevronRight size={24} />
            </button>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => exportFinanceiroCsv(doMes, resumo, monthLabel(year, month))}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm inline-flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Exportar mês (CSV)
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Carregando…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-800 border border-emerald-800/50 rounded-2xl p-4">
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-400" /> Entradas
                </p>
                <p className="text-emerald-300 text-2xl font-bold mt-1 tabular-nums">
                  {formatMoedaBR(resumo.totalEntradas)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {qtdEntradasMes === 0
                    ? 'Nenhuma receita lançada neste mês'
                    : `${qtdEntradasMes} lançamento(s) de receita`}
                </p>
                {qtdEntradasMes === 0 && qtdSaidasMes > 0 && (
                  <p className="text-amber-400/90 text-[11px] mt-2 leading-snug">
                    Gastos de insumo e saídas não viram entrada. Use{' '}
                    <button
                      type="button"
                      onClick={() => setModo('entrada')}
                      className="underline hover:text-amber-300"
                    >
                      Entrada (receita)
                    </button>{' '}
                    abaixo (ex.: faturamento do mês).
                  </p>
                )}
              </div>
              <div className="bg-gray-800 border border-rose-800/40 rounded-2xl p-4">
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <TrendingDown size={14} className="text-rose-400" /> Saídas
                </p>
                <p className="text-rose-300 text-2xl font-bold mt-1 tabular-nums">
                  {formatMoedaBR(resumo.totalSaidas)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Geral {formatMoedaBR(resumo.saidasGerais)} · Insumos {formatMoedaBR(resumo.gastosInsumosTotal)}
                </p>
              </div>
              <div
                className={`bg-gray-800 border rounded-2xl p-4 ${
                  lucroPositivo ? 'border-indigo-700/50' : 'border-amber-700/50'
                }`}
              >
                <p className="text-gray-400 text-sm">Lucro</p>
                <p
                  className={`text-2xl font-bold mt-1 tabular-nums ${
                    lucroPositivo ? 'text-indigo-300' : 'text-amber-300'
                  }`}
                >
                  {formatMoedaBR(resumo.lucro)}
                </p>
                <p className="text-gray-500 text-xs mt-1">Entradas − saídas</p>
              </div>
              <div className="bg-gray-800 border border-violet-800/40 rounded-2xl p-4">
                <p className="text-gray-400 text-sm">Gastos com insumos</p>
                <p className="text-violet-300 text-2xl font-bold mt-1 tabular-nums">
                  {formatMoedaBR(resumo.gastosInsumosTotal)}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
              <h2 className="text-white font-semibold mb-3">Gastos por insumo no mês</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {INSUMO_CATEGORIAS.map(c => {
                  const v = resumo.gastosPorInsumo[c.id]
                  const pct =
                    resumo.gastosInsumosTotal > 0 ? Math.round((v / resumo.gastosInsumosTotal) * 100) : 0
                  return (
                    <div
                      key={c.id}
                      className="bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 flex justify-between items-center gap-2"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{c.label}</p>
                        <p className="text-gray-500 text-xs">{c.unidade}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-violet-300 font-semibold tabular-nums text-sm">{formatMoedaBR(v)}</p>
                        {resumo.gastosInsumosTotal > 0 && (
                          <p className="text-gray-500 text-[10px]">{pct}%</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Plus size={18} className="text-emerald-400" />
                Novo lançamento
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {(
                  [
                    ['entrada', 'Entrada (receita)'],
                    ['saida_geral', 'Saída geral'],
                    ['saida_insumo', 'Gasto de insumo'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setModo(k)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      modo === k
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-gray-400 text-xs">Data</span>
                  <input
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    className="mt-1 w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-400 text-xs">Valor (R$)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorStr}
                    onChange={e => setValorStr(e.target.value)}
                    className="mt-1 w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                {modo === 'saida_insumo' && (
                  <label className="block">
                    <span className="text-gray-400 text-xs">Insumo</span>
                    <select
                      value={categoriaInsumo}
                      onChange={e => setCategoriaInsumo(e.target.value as InsumoCategoria)}
                      className="mt-1 w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                    >
                      {INSUMO_CATEGORIAS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className={`block ${modo === 'saida_insumo' ? 'sm:col-span-2 lg:col-span-1' : 'sm:col-span-2'}`}>
                  <span className="text-gray-400 text-xs">Descrição (opcional)</span>
                  <input
                    type="text"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Ex.: compra fornecedor"
                    className="mt-1 w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void salvar()}
                className="mt-4 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg"
              >
                {saving ? 'Salvando…' : 'Adicionar lançamento'}
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-white font-semibold">Lançamentos do mês</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-700">
                      <th className="p-3">Data</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {doMes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-400">
                          Nenhum lançamento neste mês. Use o formulário acima para registrar entradas e gastos.
                        </td>
                      </tr>
                    ) : (
                      doMes.map(e => {
                        const cat =
                          e.grupo === 'insumo' && e.categoriaInsumo
                            ? INSUMO_CATEGORIAS.find(c => c.id === e.categoriaInsumo)?.label ?? e.categoriaInsumo
                            : 'Geral'
                        return (
                          <tr key={e.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                            <td className="p-3 text-gray-300">
                              {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3">
                              <span
                                className={
                                  e.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {e.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-300">{cat}</td>
                            <td className="p-3 text-right text-white tabular-nums font-medium">
                              {formatMoedaBR(e.valor)}
                            </td>
                            <td className="p-3 text-gray-500 max-w-[200px] truncate">{e.descricao ?? '—'}</td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => void remover(e.id)}
                                className="p-1.5 text-gray-500 hover:text-rose-400 rounded"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RelatorioFinanceiro
