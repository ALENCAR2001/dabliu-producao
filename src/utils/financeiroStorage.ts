import type { LancamentoFinanceiro } from '../types/financeiro'

const KEY = 'dabliu-financeiro-v1'

export function loadFinanceiro(): LancamentoFinanceiro[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as LancamentoFinanceiro[]
  } catch {
    return []
  }
}

export function saveFinanceiro(entries: LancamentoFinanceiro[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries))
}
