import type { Layout } from '../types/layout'
import type { DayPunch } from '../types/ponto'
import type { ProducaoEntry } from './productionStorage'
import { toLocalYMD } from './calendar'
import { LAYOUT_STATUS_ORDER } from './layoutStatus'
import { getLayoutStatusLabel } from './layoutStatus'

export type LayoutStatusCounts = Record<Layout['status'], number> & { total: number }

export function countLayoutsByStatus(layouts: Layout[]): LayoutStatusCounts {
  const counts: LayoutStatusCounts = { ativo: 0, producao: 0, finalizado: 0, total: layouts.length }
  for (const l of layouts) counts[l.status]++
  return counts
}

export function layoutsByStatus(layouts: Layout[], status: Layout['status'], limit = 6): Layout[] {
  return layouts
    .filter(l => l.status === status)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
}

export function layoutsByMarca(layouts: Layout[]): { marca: string; count: number }[] {
  const map = new Map<string, number>()
  for (const l of layouts) map.set(l.marca, (map.get(l.marca) ?? 0) + 1)
  return [...map.entries()]
    .map(([marca, count]) => ({ marca, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export function statusChartData(counts: LayoutStatusCounts) {
  return LAYOUT_STATUS_ORDER.map(status => ({
    status,
    name: getLayoutStatusLabel(status),
    value: counts[status],
  })).filter(d => d.value > 0)
}

export function isSameLocalDay(iso: string, ymd: string): boolean {
  try {
    return toLocalYMD(new Date(iso)) === ymd
  } catch {
    return false
  }
}

export function productionTotalOnDay(entries: ProducaoEntry[], ymd: string): number {
  return entries.filter(e => isSameLocalDay(e.createdAt, ymd)).reduce((s, e) => s + e.total, 0)
}

export function productionLastNDays(entries: ProducaoEntry[], days = 7) {
  const result: { label: string; date: string; total: number; fechamentos: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const ymd = toLocalYMD(d)
    const dayEntries = entries.filter(e => isSameLocalDay(e.createdAt, ymd))
    result.push({
      date: ymd,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      total: dayEntries.reduce((s, e) => s + e.total, 0),
      fechamentos: dayEntries.length,
    })
  }
  return result
}

export function recentProduction(entries: ProducaoEntry[], limit = 8): ProducaoEntry[] {
  return [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function pontoTodaySummary(punches: DayPunch[], today: string, totalFuncionarios: number) {
  const todayPunches = punches.filter(p => p.date === today)
  const comEntrada = todayPunches.filter(p => p.entradaAt).length
  const diaCompleto = todayPunches.filter(p => p.entradaAt && p.saidaAt).length
  return {
    comEntrada,
    diaCompleto,
    semPonto: Math.max(0, totalFuncionarios - comEntrada),
    totalFuncionarios,
  }
}

export function productionByMarca(entries: ProducaoEntry[], days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const recent = entries.filter(e => new Date(e.createdAt) >= cutoff)
  const map = new Map<string, number>()
  for (const e of recent) map.set(e.marca, (map.get(e.marca) ?? 0) + e.total)
  return [...map.entries()]
    .map(([marca, total]) => ({ marca, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
}
