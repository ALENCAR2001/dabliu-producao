import { getSupabase, isSupabaseConfigured, type ProductionClosureRow } from '../lib/supabase'
import type { TipoModelo } from '../types/layout'
import {
  type ProducaoEntry,
  type ProducaoSize,
  loadProducao,
  saveProducao,
} from '../utils/productionStorage'

export type CreateProducaoInput = {
  layoutId?: string
  marca: string
  tipoModelo: TipoModelo
  tipoModeloLabel: string
  nome: string
  codigo: string
  corTecido: string
  quantidades: Record<ProducaoSize, number>
  total: number
  observacoes?: string
}

function rowToEntry(row: ProductionClosureRow): ProducaoEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    layoutId: row.layout_id ?? undefined,
    marca: row.marca,
    tipoModelo: row.tipo_modelo as TipoModelo,
    tipoModeloLabel: row.tipo_modelo_label,
    nome: row.nome,
    codigo: row.codigo,
    corTecido: row.cor_tecido,
    quantidades: row.quantidades as Record<ProducaoSize, number>,
    total: row.total,
    observacoes: row.observacoes ?? undefined,
  }
}

export function getStorageMode(): 'database' | 'local' {
  return isSupabaseConfigured() ? 'database' : 'local'
}

export async function listProducaoEntries(): Promise<ProducaoEntry[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('production_closures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw new Error(error.message)
    return (data as ProductionClosureRow[]).map(rowToEntry)
  }

  return loadProducao().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createProducaoEntry(input: CreateProducaoInput): Promise<ProducaoEntry> {
  const supabase = getSupabase()

  if (supabase) {
    const { data, error } = await supabase
      .from('production_closures')
      .insert({
        layout_id: input.layoutId ?? null,
        marca: input.marca,
        tipo_modelo: input.tipoModelo,
        tipo_modelo_label: input.tipoModeloLabel,
        nome: input.nome,
        codigo: input.codigo,
        cor_tecido: input.corTecido,
        quantidades: input.quantidades,
        total: input.total,
        observacoes: input.observacoes ?? null,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return rowToEntry(data as ProductionClosureRow)
  }

  const entry: ProducaoEntry = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    layoutId: input.layoutId,
    marca: input.marca,
    tipoModelo: input.tipoModelo,
    tipoModeloLabel: input.tipoModeloLabel,
    nome: input.nome,
    codigo: input.codigo,
    corTecido: input.corTecido,
    quantidades: input.quantidades,
    total: input.total,
    observacoes: input.observacoes,
  }
  const prev = loadProducao()
  saveProducao([entry, ...prev])
  return entry
}

export async function deleteProducaoEntry(id: string): Promise<void> {
  const supabase = getSupabase()

  if (supabase) {
    const { error } = await supabase.from('production_closures').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }

  saveProducao(loadProducao().filter(e => e.id !== id))
}

/** Envia fechamentos do localStorage para o Supabase (uma vez, após configurar o banco) */
export async function migrateLocalProducaoToDatabase(): Promise<number> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase não configurado')

  const local = loadProducao()
  if (local.length === 0) return 0

  const rows = local.map(e => ({
    layout_id: e.layoutId ?? null,
    marca: e.marca,
    tipo_modelo: e.tipoModelo ?? 'long-line',
    tipo_modelo_label: e.tipoModeloLabel,
    nome: e.nome,
    codigo: e.codigo,
    cor_tecido: e.corTecido,
    quantidades: e.quantidades,
    total: e.total,
    observacoes: e.observacoes ?? null,
    created_at: e.createdAt,
  }))

  const { error } = await supabase.from('production_closures').insert(rows)
  if (error) throw new Error(error.message)

  saveProducao([])
  return rows.length
}
