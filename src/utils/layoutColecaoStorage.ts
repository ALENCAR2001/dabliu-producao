import { normalizeMarca } from '../config/brand'
import type { Layout, TipoModelo } from '../types/layout'
import {
  categoryPdfKey,
  loadCategoryPdfs,
  type CategoryPdf,
} from './layoutStorage'
import { safeSetItem } from './safeStorage'

export interface LayoutColecao {
  id: string
  marca: string
  tipoModelo: TipoModelo
  /** Nome exibido (ex.: "29/05/2026 — lote-maio.pdf") */
  nome: string
  fileName: string
  /** Cache local; na nuvem o PDF fica em storagePath */
  dataBase64: string
  /** Caminho no bucket layout-pdfs (Supabase Storage) */
  storagePath?: string
  pageCount: number
  createdAt: string
}

const COLECOES_KEY = 'dabliu-layout-colecoes-v1'

export function formatColecaoDefaultName(fileName: string, date = new Date()): string {
  const d = date.toLocaleDateString('pt-BR')
  const base = fileName.replace(/\.pdf$/i, '').trim() || 'PDF'
  return `${d} — ${base}`
}

function loadColecoesRaw(): LayoutColecao[] {
  try {
    const raw = localStorage.getItem(COLECOES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LayoutColecao[]
    return parsed.map(c => ({
      ...c,
      marca: normalizeMarca(c.marca),
    }))
  } catch {
    return []
  }
}

export function saveColecoes(colecoes: LayoutColecao[]): boolean {
  const result = safeSetItem(COLECOES_KEY, JSON.stringify(colecoes))
  if (!result.ok) {
    window.alert(result.message)
    return false
  }
  return true
}

function migrateCategoryPdfsToColecoes(): LayoutColecao[] {
  const oldPdfs = loadCategoryPdfs()
  const colecoes: LayoutColecao[] = []
  for (const pdf of Object.values(oldPdfs) as CategoryPdf[]) {
    const marca = normalizeMarca(pdf.marca)
    const key = categoryPdfKey(marca, pdf.tipoModelo)
    colecoes.push({
      id: `legacy-${key}`,
      marca,
      tipoModelo: pdf.tipoModelo,
      nome: `Coleção anterior — ${pdf.fileName}`,
      fileName: pdf.fileName,
      dataBase64: pdf.dataBase64,
      pageCount: pdf.pageCount,
      createdAt: new Date().toISOString(),
    })
  }
  if (colecoes.length > 0) saveColecoes(colecoes)
  return colecoes
}

export function loadColecoes(): LayoutColecao[] {
  const stored = loadColecoesRaw()
  if (stored.length > 0) return stored
  return migrateCategoryPdfsToColecoes()
}

export function colecoesForMarcaTipo(
  colecoes: LayoutColecao[],
  marca: string,
  tipoModelo: TipoModelo
): LayoutColecao[] {
  return colecoes
    .filter(c => c.marca === marca && c.tipoModelo === tipoModelo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getColecaoPdf(colecao: LayoutColecao | undefined): boolean {
  return Boolean(
    colecao &&
      colecao.pageCount > 0 &&
      (Boolean(colecao.dataBase64) || Boolean(colecao.storagePath))
  )
}

/** Garante colecaoId em layouts antigos e cria coleção “modelos existentes” quando necessário */
export function migrateLayoutsToColecoes(
  layouts: Layout[],
  colecoes: LayoutColecao[]
): { layouts: Layout[]; colecoes: LayoutColecao[] } {
  const nextColecoes = [...colecoes]
  let nextLayouts = [...layouts]

  const orphansByKey = new Map<string, Layout[]>()
  for (const l of nextLayouts) {
    if (l.colecaoId) continue
    const key = categoryPdfKey(l.marca, l.tipoModelo)
    orphansByKey.set(key, [...(orphansByKey.get(key) ?? []), l])
  }

  for (const [key, group] of orphansByKey) {
    const legacyId = `legacy-${key}`
    const manualId = `manual-${key}`
    let colecaoId = nextColecoes.some(c => c.id === legacyId)
      ? legacyId
      : nextColecoes.some(c => c.id === manualId)
        ? manualId
        : null

    if (!colecaoId) {
      const [marca, tipoModelo] = key.split('|') as [string, TipoModelo]
      colecaoId = manualId
      const oldest = group.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
      nextColecoes.push({
        id: manualId,
        marca,
        tipoModelo,
        nome: 'Modelos cadastrados',
        fileName: '',
        dataBase64: '',
        pageCount: 0,
        createdAt: oldest.createdAt.toISOString(),
      })
    }

    nextLayouts = nextLayouts.map(l => {
      if (l.colecaoId) return l
      if (categoryPdfKey(l.marca, l.tipoModelo) !== key) return l
      return { ...l, colecaoId }
    })
  }

  return { layouts: nextLayouts, colecoes: nextColecoes }
}

export function createColecaoFromPdf(params: {
  marca: string
  tipoModelo: TipoModelo
  fileName: string
  dataBase64: string
  pageCount: number
  nome?: string
}): LayoutColecao {
  return {
    id: `col-${Date.now()}`,
    marca: normalizeMarca(params.marca),
    tipoModelo: params.tipoModelo,
    nome: params.nome ?? formatColecaoDefaultName(params.fileName),
    fileName: params.fileName,
    dataBase64: params.dataBase64,
    pageCount: params.pageCount,
    createdAt: new Date().toISOString(),
  }
}
