import type { InsumoItem } from '../types/insumos'
import { tintaItemId } from '../utils/tintaVariants'
import type { TintaCor, TintaTipo } from '../types/insumos'

const STORAGE_KEY = 'dabliu-insumo-minimos-v1'

/** Mínimos padrão — ajuste aqui ou pela tela Administração */
export const DEFAULT_INSUMO_MINIMOS: Record<string, number> = {
  cola: 2,
  fita: 3,
  emulsao: 2,
  desgravador: 1,
  solvente: 2,
  'tinta-default': 1.5,
  'tinta-preta-relevo': 3,
  'tinta-preta-gel': 2,
}

export function loadInsumoMinimos(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_INSUMO_MINIMOS }
    return { ...DEFAULT_INSUMO_MINIMOS, ...(JSON.parse(raw) as Record<string, number>) }
  } catch {
    return { ...DEFAULT_INSUMO_MINIMOS }
  }
}

export function saveInsumoMinimos(minimos: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(minimos))
}

export function getMinimoTinta(cor: TintaCor, tipo: TintaTipo, minimos: Record<string, number>): number {
  return minimos[tintaItemId(cor, tipo)] ?? minimos['tinta-default'] ?? 1.5
}

export function getMinimoForItem(item: InsumoItem, minimos: Record<string, number>): number {
  if (item.categoria === 'tinta' && item.corTinta && item.tipoTinta) {
    return getMinimoTinta(item.corTinta, item.tipoTinta, minimos)
  }
  return minimos[item.categoria] ?? minimos[item.id] ?? 1
}
