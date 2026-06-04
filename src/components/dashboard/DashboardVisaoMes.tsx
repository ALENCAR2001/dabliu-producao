import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Package, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { DashboardMesResumo } from '../../utils/dashboardMesResumo'
import { formatMoedaBR } from '../../utils/dashboardMesResumo'
import { loadSistemaConfig, setValorMedioPeca } from '../../config/sistemaConfig'
import { parseValorInput } from '../../utils/financeiroResumo'

type DashboardVisaoMesProps = {
  resumo: DashboardMesResumo
  loading: boolean
  onValorMedioSaved?: () => void
}

export function DashboardVisaoMes({ resumo, loading, onValorMedioSaved }: DashboardVisaoMesProps) {
  const cfg = loadSistemaConfig()
  const [editValor, setEditValor] = useState(false)
  const [valorStr, setValorStr] = useState(
    cfg.valorMedioPeca != null ? String(cfg.valorMedioPeca).replace('.', ',') : ''
  )

  const salvarValor = () => {
    const v = parseValorInput(valorStr)
    if (v === null || v <= 0) {
      setValorMedioPeca(undefined)
    } else {
      setValorMedioPeca(v)
    }
    setEditValor(false)
    onValorMedioSaved?.()
  }

  const lucro = resumo.lucroEstimado ?? resumo.financeiro.lucro
  const lucroPositivo = lucro >= 0

  return (
    <section className="bg-gradient-to-br from-indigo-950/80 via-gray-800 to-gray-900 border border-indigo-700/40 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide">Fase 1 — visão do mês</p>
          <h2 className="text-white text-lg font-bold">{resumo.tituloMes}</h2>
        </div>
        <Link
          to="/financeiro"
          className="text-indigo-400 text-xs hover:underline shrink-0"
        >
          Abrir financeiro →
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-6 text-center">Carregando resumo…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-900/70 border border-teal-700/40 rounded-xl p-4">
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <Package size={14} className="text-teal-400" /> Peças no mês
              </p>
              <p className="text-white text-3xl font-bold tabular-nums mt-1">
                {resumo.pecasMes.toLocaleString('pt-BR')}
              </p>
              <p className="text-gray-500 text-[11px] mt-1">{resumo.fechamentosMes} fechamento(s)</p>
              <Link to="/producao" className="text-teal-400 text-xs mt-2 inline-block hover:underline">
                Ver produção →
              </Link>
            </div>

            <div className="bg-gray-900/70 border border-emerald-700/40 rounded-xl p-4">
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <TrendingUp size={14} className="text-emerald-400" /> Entradas
              </p>
              <p className="text-emerald-300 text-2xl font-bold tabular-nums mt-1">
                {formatMoedaBR(resumo.financeiro.totalEntradas)}
              </p>
              {resumo.receitaEstimada != null && (
                <p className="text-gray-500 text-[11px] mt-1">
                  Estimada (peças): {formatMoedaBR(resumo.receitaEstimada)}
                </p>
              )}
            </div>

            <div
              className={`bg-gray-900/70 border rounded-xl p-4 ${
                lucroPositivo ? 'border-indigo-600/50' : 'border-amber-600/50'
              }`}
            >
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <Wallet size={14} className={lucroPositivo ? 'text-indigo-300' : 'text-amber-300'} /> Lucro
              </p>
              <p
                className={`text-2xl font-bold tabular-nums mt-1 ${
                  lucroPositivo ? 'text-indigo-200' : 'text-amber-200'
                }`}
              >
                {formatMoedaBR(lucro)}
              </p>
              <p className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                <TrendingDown size={12} />
                Saídas: {formatMoedaBR(resumo.financeiro.totalSaidas)}
              </p>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span className="flex items-center gap-1">
                <DollarSign size={14} className="text-violet-400" />
                Gastos insumos: {formatMoedaBR(resumo.financeiro.gastosInsumosTotal)}
              </span>
              {!editValor ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = loadSistemaConfig()
                    setValorStr(
                      c.valorMedioPeca != null ? String(c.valorMedioPeca).replace('.', ',') : ''
                    )
                    setEditValor(true)
                  }}
                  className="text-indigo-400 hover:underline"
                >
                  {cfg.valorMedioPeca
                    ? `Valor médio/peça: ${formatMoedaBR(cfg.valorMedioPeca)} (editar)`
                    : 'Definir valor médio por peça'}
                </button>
              ) : (
                <span className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 45"
                    value={valorStr}
                    onChange={e => setValorStr(e.target.value)}
                    className="bg-gray-950 border border-gray-600 rounded px-2 py-1 text-white w-24"
                  />
                  <button type="button" onClick={salvarValor} className="text-emerald-400 hover:underline">
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditValor(false)} className="text-gray-500 hover:underline">
                    Cancelar
                  </button>
                </span>
              )}
            </div>
            {resumo.receitaEstimada == null && !editValor && (
              <p className="text-gray-500 mt-2">
                Dica: defina o valor médio por peça para estimar receita e lucro com base na produção.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
