import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Layout } from '../types/layout'
import {
  type LayoutColecao,
  loadColecoes,
  saveColecoes,
  migrateLayoutsToColecoes,
} from '../utils/layoutColecaoStorage'
import {
  loadLayoutCatalog,
  saveLayoutCatalog,
  type TipoDef,
} from '../utils/layoutCatalog'
import { loadLayouts, saveLayouts, LAYOUTS_CHANGED_EVENT } from '../utils/layoutStorage'
import { base64ToUint8Array } from '../utils/pdfUtils'

const BUCKET = 'layout-pdfs'
const CATALOG_ID = 'default'

type LayoutCatalogData = {
  customMarcas: string[]
  customTipos: TipoDef[]
}

type LayoutBundle = {
  layouts: Layout[]
  colecoes: LayoutColecao[]
  catalog: LayoutCatalogData
}

type ColecaoRow = {
  id: string
  marca: string
  tipo_modelo: string
  nome: string
  file_name: string
  storage_path: string | null
  page_count: number
  created_at: string
}

type ModelRow = {
  id: string
  marca: string
  tipo_modelo: string
  colecao_id: string | null
  pdf_page: number | null
  nome: string
  codigo: string
  cor_tecido: string
  silk: string
  puff: string
  demaos: string
  altura_gola: string
  observacoes: string
  status: Layout['status']
  created_at: string
}

type CatalogRow = {
  custom_marcas: string[]
  custom_tipos: TipoDef[]
}

export function getLayoutsStorageMode(): 'database' | 'local' {
  return isSupabaseConfigured() ? 'database' : 'local'
}

function rowToColecao(row: ColecaoRow): LayoutColecao {
  return {
    id: row.id,
    marca: row.marca,
    tipoModelo: row.tipo_modelo,
    nome: row.nome,
    fileName: row.file_name,
    dataBase64: '',
    storagePath: row.storage_path ?? undefined,
    pageCount: row.page_count,
    createdAt: row.created_at,
  }
}

function colecaoToRow(c: LayoutColecao): ColecaoRow {
  return {
    id: c.id,
    marca: c.marca,
    tipo_modelo: c.tipoModelo,
    nome: c.nome,
    file_name: c.fileName,
    storage_path: c.storagePath ?? null,
    page_count: c.pageCount,
    created_at: c.createdAt,
  }
}

function rowToLayout(row: ModelRow): Layout {
  return {
    id: row.id,
    marca: row.marca,
    tipoModelo: row.tipo_modelo,
    colecaoId: row.colecao_id ?? undefined,
    pdfPage: row.pdf_page ?? undefined,
    nome: row.nome,
    codigo: row.codigo,
    corTecido: row.cor_tecido,
    silk: row.silk,
    puff: row.puff,
    demaos: row.demaos,
    alturaGola: row.altura_gola,
    observacoes: row.observacoes,
    status: row.status,
    createdAt: new Date(row.created_at),
  }
}

function layoutToRow(l: Layout): ModelRow {
  return {
    id: l.id,
    marca: l.marca,
    tipo_modelo: l.tipoModelo,
    colecao_id: l.colecaoId ?? null,
    pdf_page: l.pdfPage ?? null,
    nome: l.nome,
    codigo: l.codigo,
    cor_tecido: l.corTecido,
    silk: l.silk,
    puff: l.puff,
    demaos: l.demaos,
    altura_gola: l.alturaGola,
    observacoes: l.observacoes,
    status: l.status,
    created_at: l.createdAt.toISOString(),
  }
}

function persistLocal(bundle: LayoutBundle): void {
  saveLayouts(bundle.layouts)
  saveColecoes(bundle.colecoes)
  saveLayoutCatalog(bundle.catalog)
  window.dispatchEvent(new CustomEvent(LAYOUTS_CHANGED_EVENT))
}

function loadLocalBundle(): LayoutBundle {
  const layouts = loadLayouts()
  const colecoes = loadColecoes()
  const migrated = migrateLayoutsToColecoes(layouts, colecoes)
  return {
    layouts: migrated.layouts,
    colecoes: migrated.colecoes,
    catalog: loadLayoutCatalog(),
  }
}

async function fetchCloudBundle(): Promise<LayoutBundle | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const [colecoesRes, modelsRes, catalogRes] = await Promise.all([
    supabase.from('layout_colecoes').select('*').order('created_at', { ascending: false }),
    supabase.from('layout_models').select('*').order('created_at', { ascending: false }),
    supabase.from('layout_catalog').select('custom_marcas, custom_tipos').eq('id', CATALOG_ID).maybeSingle(),
  ])

  if (colecoesRes.error) throw new Error(colecoesRes.error.message)
  if (modelsRes.error) throw new Error(modelsRes.error.message)
  if (catalogRes.error) throw new Error(catalogRes.error.message)

  const colecoes = ((colecoesRes.data ?? []) as ColecaoRow[]).map(rowToColecao)
  const layouts = ((modelsRes.data ?? []) as ModelRow[]).map(rowToLayout)
  const cat = catalogRes.data as CatalogRow | null

  return {
    layouts: migrateLayoutsToColecoes(layouts, colecoes).layouts,
    colecoes,
    catalog: {
      customMarcas: cat?.custom_marcas ?? [],
      customTipos: cat?.custom_tipos ?? [],
    },
  }
}

function storagePathFor(colecaoId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'documento.pdf'
  return `${colecaoId}/${safe}`
}

async function uploadColecaoPdf(colecao: LayoutColecao): Promise<string | null> {
  if (!colecao.dataBase64 || colecao.pageCount <= 0) return colecao.storagePath ?? null

  const supabase = getSupabase()
  if (!supabase) return null

  const path = colecao.storagePath ?? storagePathFor(colecao.id, colecao.fileName || 'lote.pdf')
  const bytes = base64ToUint8Array(colecao.dataBase64)
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'application/pdf',
  })
  if (error) throw new Error(error.message)
  return path
}

async function deleteColecaoPdf(storagePath: string | undefined): Promise<void> {
  if (!storagePath) return
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.storage.from(BUCKET).remove([storagePath])
}

export async function downloadColecaoPdfBytes(colecao: LayoutColecao): Promise<Uint8Array | null> {
  if (colecao.dataBase64) {
    return base64ToUint8Array(colecao.dataBase64)
  }
  if (!colecao.storagePath) return null

  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.storage.from(BUCKET).download(colecao.storagePath)
  if (error || !data) throw new Error(error?.message ?? 'PDF não encontrado na nuvem')
  const buf = await data.arrayBuffer()
  return new Uint8Array(buf)
}

export async function loadLayoutBundle(): Promise<LayoutBundle> {
  const local = loadLocalBundle()

  if (!isSupabaseConfigured()) {
    return local
  }

  try {
    const cloud = await fetchCloudBundle()
    if (!cloud) return local

    const cloudEmpty = cloud.colecoes.length === 0 && cloud.layouts.length === 0
    const localHasData = local.colecoes.length > 0 || local.layouts.length > 0

    if (cloudEmpty && localHasData) {
      await syncLayoutBundle(local)
      return local
    }

    persistLocal(cloud)
    return cloud
  } catch {
    return local
  }
}

async function pruneCloudOrphans(bundle: LayoutBundle): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const [colecoesRes, modelsRes] = await Promise.all([
    supabase.from('layout_colecoes').select('id, storage_path'),
    supabase.from('layout_models').select('id'),
  ])

  const colecaoIds = new Set(bundle.colecoes.map(c => c.id))
  const layoutIds = new Set(bundle.layouts.map(l => l.id))

  for (const row of (colecoesRes.data ?? []) as { id: string; storage_path: string | null }[]) {
    if (!colecaoIds.has(row.id)) {
      await deleteColecaoPdf(row.storage_path ?? undefined)
      await supabase.from('layout_colecoes').delete().eq('id', row.id)
    }
  }

  for (const row of (modelsRes.data ?? []) as { id: string }[]) {
    if (!layoutIds.has(row.id)) {
      await supabase.from('layout_models').delete().eq('id', row.id)
    }
  }
}

export async function syncLayoutBundle(bundle: LayoutBundle): Promise<void> {
  persistLocal(bundle)

  const supabase = getSupabase()
  if (!supabase) return

  await pruneCloudOrphans(bundle)

  const colecoesWithPaths: LayoutColecao[] = []
  for (const c of bundle.colecoes) {
    let storagePath = c.storagePath
    if (c.dataBase64 && c.pageCount > 0) {
      storagePath = (await uploadColecaoPdf({ ...c, storagePath })) ?? storagePath
    }
    colecoesWithPaths.push({
      ...c,
      storagePath,
      dataBase64: storagePath ? '' : c.dataBase64,
    })
  }

  const colecaoRows = colecoesWithPaths.map(colecaoToRow)
  const modelRows = bundle.layouts.map(layoutToRow)

  if (colecaoRows.length > 0) {
    const { error } = await supabase.from('layout_colecoes').upsert(colecaoRows, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  if (modelRows.length > 0) {
    const { error } = await supabase.from('layout_models').upsert(modelRows, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  const { error: catError } = await supabase.from('layout_catalog').upsert(
    {
      id: CATALOG_ID,
      custom_marcas: bundle.catalog.customMarcas,
      custom_tipos: bundle.catalog.customTipos,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (catError) throw new Error(catError.message)

  if (colecoesWithPaths.some(c => c.storagePath !== bundle.colecoes.find(x => x.id === c.id)?.storagePath)) {
    saveColecoes(colecoesWithPaths)
  }
}

export async function removeColecaoFromCloud(colecaoId: string, storagePath?: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  await deleteColecaoPdf(storagePath)
  await supabase.from('layout_models').delete().eq('colecao_id', colecaoId)
  await supabase.from('layout_colecoes').delete().eq('id', colecaoId)
}

export async function removeLayoutFromCloud(layoutId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.from('layout_models').delete().eq('id', layoutId)
}

export async function pushLocalLayoutsToCloud(): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase não configurado.' }
  }
  try {
    const local = loadLocalBundle()
    await syncLayoutBundle(local)
    return { ok: true, message: 'Layouts e PDFs enviados para a nuvem.' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Falha ao enviar.' }
  }
}
