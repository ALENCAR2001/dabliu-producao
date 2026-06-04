import {
  CATEGORIAS_ITEM_UNICO,
  type InsumoCategoriaSimples,
  type InsumoItem,
} from '../types/insumos'

export const ITEM_UNICO_NOME: Record<InsumoCategoriaSimples, string> = {
  fita: 'Fita',
  emulsao: 'Emulsão',
  desgravador: 'Desgravador',
  solvente: 'Solvente',
}

export function itemUnicoId(cat: InsumoCategoriaSimples): string {
  return cat
}

export function buildItemUnico(cat: InsumoCategoriaSimples, quantidade = 0): InsumoItem {
  return {
    id: itemUnicoId(cat),
    categoria: cat,
    nome: ITEM_UNICO_NOME[cat],
    quantidade,
    updatedAt: new Date().toISOString(),
  }
}

export function getItemUnico(items: InsumoItem[], cat: InsumoCategoriaSimples): InsumoItem {
  const id = itemUnicoId(cat)
  return (
    items.find(i => i.id === id) ?? buildItemUnico(cat, 0)
  )
}

const LEGACY_CATEGORIA_MAP: Record<string, InsumoCategoriaSimples> = {
  desgrava: 'desgravador',
}

/** Uma entrada por categoria (fita, emulsão, desgravador, solvente); soma legados */
export function ensureItensUnicos(items: InsumoItem[]): InsumoItem[] {
  const normalized = items.map(i => {
    const mapped = LEGACY_CATEGORIA_MAP[i.categoria]
    if (!mapped) return i
    return {
      ...i,
      categoria: mapped,
      id: i.id === 'desgrava' ? 'desgravador' : i.id,
      nome: ITEM_UNICO_NOME[mapped],
    }
  })

  const nonSimple = normalized.filter(
    i => !CATEGORIAS_ITEM_UNICO.includes(i.categoria as InsumoCategoriaSimples)
  )
  const legacySimple = normalized.filter(i =>
    CATEGORIAS_ITEM_UNICO.includes(i.categoria as InsumoCategoriaSimples)
  )

  const simples: InsumoItem[] = CATEGORIAS_ITEM_UNICO.map(cat => {
    const id = itemUnicoId(cat)
    const sameCat = legacySimple.filter(i => i.categoria === cat)
    const canonical = sameCat.find(i => i.id === id)
    const qty = sameCat.reduce((s, i) => s + i.quantidade, 0)
    const latest = sameCat.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0]

    return {
      id,
      categoria: cat,
      nome: ITEM_UNICO_NOME[cat],
      quantidade: canonical?.quantidade ?? qty,
      updatedAt: canonical?.updatedAt ?? latest?.updatedAt ?? new Date().toISOString(),
      observacoes: canonical?.observacoes ?? latest?.observacoes,
    }
  })

  return [...nonSimple, ...simples]
}
