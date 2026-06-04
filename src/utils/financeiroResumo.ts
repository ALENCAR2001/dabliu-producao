import { INSUMO_CATEGORIAS, type InsumoCategoria } from '../types/insumos'
import type { LancamentoFinanceiro, ResumoFinanceiroMes } from '../types/financeiro'

export function formatMoedaBR(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function filterFinanceiroByMonth(
  entries: LancamentoFinanceiro[],
  year: number,
  month: number
): LancamentoFinanceiro[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return entries.filter(e => e.data.startsWith(prefix))
}

function emptyGastosPorInsumo(): Record<InsumoCategoria, number> {
  return INSUMO_CATEGORIAS.reduce(
    (acc, c) => {
      acc[c.id] = 0
      return acc
    },
    {} as Record<InsumoCategoria, number>
  )
}

export function buildResumoFinanceiroMes(entries: LancamentoFinanceiro[]): ResumoFinanceiroMes {
  const gastosPorInsumo = emptyGastosPorInsumo()
  let totalEntradas = 0
  let totalSaidas = 0
  let gastosInsumosTotal = 0
  let saidasGerais = 0

  for (const e of entries) {
    const v = Math.max(0, Number(e.valor) || 0)
    if (e.tipo === 'entrada') {
      totalEntradas += v
      continue
    }
    totalSaidas += v
    if (e.grupo === 'insumo' && e.categoriaInsumo) {
      gastosPorInsumo[e.categoriaInsumo] += v
      gastosInsumosTotal += v
    } else {
      saidasGerais += v
    }
  }

  return {
    totalEntradas,
    totalSaidas,
    lucro: totalEntradas - totalSaidas,
    gastosInsumosTotal,
    gastosPorInsumo,
    saidasGerais,
  }
}

export function parseValorInput(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '')
  if (!t) return null
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  const n = Number(normalized)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}
