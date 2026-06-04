import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { InsumoItem } from '../types/insumos'
import { loadInsumos, saveInsumos } from '../utils/insumosStorage'
import { ensureInsumoCatalog } from '../utils/insumoCatalog'

type InsumoRow = {
  id: string
  categoria: string
  nome: string
  cor_tinta: string | null
  tipo_tinta: string | null
  quantidade: number
  observacoes: string | null
  updated_at: string
}

function rowToItem(row: InsumoRow): InsumoItem {
  return {
    id: row.id,
    categoria: row.categoria as InsumoItem['categoria'],
    nome: row.nome,
    corTinta: (row.cor_tinta as InsumoItem['corTinta']) ?? undefined,
    tipoTinta: (row.tipo_tinta as InsumoItem['tipoTinta']) ?? undefined,
    quantidade: Number(row.quantidade),
    observacoes: row.observacoes ?? undefined,
    updatedAt: row.updated_at,
  }
}

function itemToRow(item: InsumoItem): InsumoRow {
  return {
    id: item.id,
    categoria: item.categoria,
    nome: item.nome,
    cor_tinta: item.corTinta ?? null,
    tipo_tinta: item.tipoTinta ?? null,
    quantidade: item.quantidade,
    observacoes: item.observacoes ?? null,
    updated_at: item.updatedAt,
  }
}

async function saveAllInsumos(items: InsumoItem[]): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) {
    saveInsumos(items)
    return
  }
  const rows = items.map(itemToRow)
  const { error } = await supabase.from('inventory_items').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  saveInsumos(items)
}

async function normalizeAndSave(items: InsumoItem[]): Promise<InsumoItem[]> {
  const ensured = ensureInsumoCatalog(items)
  const changed =
    ensured.length !== items.length ||
    JSON.stringify(ensured) !== JSON.stringify(items)
  if (changed) await saveAllInsumos(ensured)
  return ensured
}

export function getInsumosStorageMode(): 'database' | 'local' {
  return isSupabaseConfigured() ? 'database' : 'local'
}

export async function listInsumos(): Promise<InsumoItem[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase.from('inventory_items').select('*').order('categoria').order('nome')
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as InsumoRow[]
    if (rows.length === 0) {
      const local = loadInsumos()
      if (local.length > 0) return normalizeAndSave(local)
    } else {
      return normalizeAndSave(rows.map(rowToItem))
    }
  }
  return normalizeAndSave(loadInsumos())
}

export async function upsertInsumo(item: InsumoItem): Promise<InsumoItem> {
  const supabase = getSupabase()
  const row = itemToRow(item)

  if (supabase) {
    const { error } = await supabase.from('inventory_items').upsert(row, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  const all = loadInsumos()
  const idx = all.findIndex(i => i.id === item.id)
  const next = [...all]
  if (idx >= 0) next[idx] = item
  else next.push(item)
  saveInsumos(next)
  return item
}

export async function deleteInsumo(id: string): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  saveInsumos(loadInsumos().filter(i => i.id !== id))
}

export async function updateQuantidade(id: string, quantidade: number): Promise<InsumoItem> {
  const all = await listInsumos()
  const item = all.find(i => i.id === id)
  if (!item) throw new Error('Item não encontrado')
  const updated: InsumoItem = {
    ...item,
    quantidade: Math.max(0, quantidade),
    updatedAt: new Date().toISOString(),
  }
  return upsertInsumo(updated)
}
