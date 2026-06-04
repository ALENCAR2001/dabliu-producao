import { DEFAULT_INSUMOS } from '../data/defaultInsumos'
import type { InsumoItem } from '../types/insumos'

const KEY = 'dabliu-insumos-v1'
const SEEDED_KEY = 'dabliu-insumos-seeded'

export function loadInsumos(): InsumoItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      if (!localStorage.getItem(SEEDED_KEY)) {
        saveInsumos(DEFAULT_INSUMOS)
        localStorage.setItem(SEEDED_KEY, '1')
        return DEFAULT_INSUMOS
      }
      return []
    }
    return JSON.parse(raw) as InsumoItem[]
  } catch {
    return []
  }
}

export function saveInsumos(items: InsumoItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}
