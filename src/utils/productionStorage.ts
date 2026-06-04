import { normalizeMarca } from '../config/brand'
import type { TipoModelo } from '../types/layout'
import { safeSetItem } from './safeStorage'

export type ProducaoSize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XGG'

export const PRODUCAO_SIZES: ProducaoSize[] = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export type ProducaoEntry = {
  id: string
  createdAt: string
  layoutId?: string
  tipoModelo?: TipoModelo
  /** Snapshot do modelo no momento do fechamento */
  marca: string
  tipoModeloLabel: string
  nome: string
  codigo: string
  corTecido: string
  /** Quantidades digitadas por tamanho */
  quantidades: Record<ProducaoSize, number>
  total: number
  observacoes?: string
}

const PRODUCAO_KEY = 'dabliu-producao-fechamentos-v1'

export function loadProducao(): ProducaoEntry[] {
  try {
    const raw = localStorage.getItem(PRODUCAO_KEY)
    if (!raw) return []
    const entries = JSON.parse(raw) as ProducaoEntry[]
    return entries.map(e => ({ ...e, marca: normalizeMarca(e.marca) }))
  } catch {
    return []
  }
}

export function saveProducao(entries: ProducaoEntry[]): boolean {
  const result = safeSetItem(PRODUCAO_KEY, JSON.stringify(entries))
  if (!result.ok) {
    window.alert(result.message)
    return false
  }
  return true
}

