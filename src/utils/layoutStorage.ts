import { normalizeMarca } from '../config/brand'
import type { Layout, TipoModelo } from '../types/layout'
import { safeSetItem } from './safeStorage'

const LAYOUTS_KEY = 'dabliu-layouts-v2'

/** Disparado após salvar layouts — dashboard e outras telas atualizam sozinhas */
export const LAYOUTS_CHANGED_EVENT = 'dabliu:layouts-changed'
const CATEGORY_PDFS_KEY = 'dabliu-category-pdfs-v1'

export interface CategoryPdf {
  marca: string
  tipoModelo: TipoModelo
  fileName: string
  dataBase64: string
  pageCount: number
}

export function categoryPdfKey(marca: string, tipoModelo: TipoModelo): string {
  return `${marca}|${tipoModelo}`
}

export function loadLayouts(): Layout[] {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Omit<Layout, 'createdAt'> & { createdAt: string }>
    return parsed.map(l => ({
      ...l,
      marca: normalizeMarca(l.marca),
      colecaoId: l.colecaoId,
      createdAt: new Date(l.createdAt),
    }))
  } catch {
    return []
  }
}

export function saveLayouts(layouts: Layout[]): void {
  const result = safeSetItem(LAYOUTS_KEY, JSON.stringify(layouts))
  if (!result.ok) {
    window.alert(result.message)
    return
  }
  window.dispatchEvent(new CustomEvent(LAYOUTS_CHANGED_EVENT))
}

export function loadCategoryPdfs(): Record<string, CategoryPdf> {
  try {
    const raw = localStorage.getItem(CATEGORY_PDFS_KEY)
    if (!raw) return {}
    const pdfs = JSON.parse(raw) as Record<string, CategoryPdf>
    const migrated: Record<string, CategoryPdf> = {}
    for (const pdf of Object.values(pdfs)) {
      const marca = normalizeMarca(pdf.marca)
      migrated[categoryPdfKey(marca, pdf.tipoModelo)] = { ...pdf, marca }
    }
    return migrated
  } catch {
    return {}
  }
}

export function saveCategoryPdfs(pdfs: Record<string, CategoryPdf>): void {
  localStorage.setItem(CATEGORY_PDFS_KEY, JSON.stringify(pdfs))
}
