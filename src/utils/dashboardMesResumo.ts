import type { ResumoFinanceiroMes } from '../types/financeiro'
import { buildResumoFinanceiroMes, filterFinanceiroByMonth, formatMoedaBR } from './financeiroResumo'
import type { LancamentoFinanceiro } from '../types/financeiro'
import { filterEntriesByMonth } from './exportCsv'
import type { ProducaoEntry } from './productionStorage'
import { monthLabel } from './calendar'

export type DashboardMesResumo = {
  tituloMes: string
  pecasMes: number
  fechamentosMes: number
  financeiro: ResumoFinanceiroMes
  receitaEstimada: number | null
  lucroEstimado: number | null
}

export function productionTotalMonth(
  entries: ProducaoEntry[],
  year: number,
  month: number
): { pecas: number; fechamentos: number } {
  const mes = filterEntriesByMonth(entries, year, month)
  return {
    pecas: mes.reduce((acc, e) => acc + e.total, 0),
    fechamentos: mes.length,
  }
}

export function buildDashboardMesResumo(
  producao: ProducaoEntry[],
  financeiro: LancamentoFinanceiro[],
  year: number,
  month: number,
  valorMedioPeca?: number
): DashboardMesResumo {
  const { pecas, fechamentos } = productionTotalMonth(producao, year, month)
  const finMes = filterFinanceiroByMonth(financeiro, year, month)
  const financeiroResumo = buildResumoFinanceiroMes(finMes)

  const receitaEstimada =
    valorMedioPeca && valorMedioPeca > 0 ? Math.round(pecas * valorMedioPeca * 100) / 100 : null

  const lucroEstimado =
    receitaEstimada != null
      ? Math.round((receitaEstimada - financeiroResumo.totalSaidas) * 100) / 100
      : financeiroResumo.lucro

  return {
    tituloMes: monthLabel(year, month),
    pecasMes: pecas,
    fechamentosMes: fechamentos,
    financeiro: financeiroResumo,
    receitaEstimada,
    lucroEstimado,
  }
}

export { formatMoedaBR }
