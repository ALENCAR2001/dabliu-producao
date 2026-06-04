import { DEFAULT_TINTA_CORES } from '../utils/tintaCoresCatalog'

export const INSUMO_CATEGORIAS = [
  { id: 'cola', label: 'Cola', unidade: 'tubos' as const, icone: 'cola' },
  { id: 'tinta', label: 'Tinta', unidade: 'kg' as const, icone: 'tinta' },
  { id: 'fita', label: 'Fita', unidade: 'unidades' as const, icone: 'fita' },
  { id: 'emulsao', label: 'Emulsão', unidade: 'litros' as const, icone: 'emulsao' },
  { id: 'desgravador', label: 'Desgravador', unidade: 'unidades' as const, icone: 'desgravador' },
  { id: 'solvente', label: 'Solvente', unidade: 'latas' as const, icone: 'solvente' },
] as const

export type InsumoCategoria = (typeof INSUMO_CATEGORIAS)[number]['id']

export type UnidadeInsumo = 'tubos' | 'kg' | 'unidades' | 'litros' | 'latas'

/** Categoria com um único item fixo (sem cadastrar vários) */
export type InsumoCategoriaSimples = 'fita' | 'emulsao' | 'desgravador' | 'solvente'

export const CATEGORIAS_ITEM_UNICO: InsumoCategoriaSimples[] = [
  'fita',
  'emulsao',
  'desgravador',
  'solvente',
]

/** ID da cor da tinta no catálogo (ex.: preta, verde-militar). */
export type TintaCor = string

export const TINTA_CORES = DEFAULT_TINTA_CORES

export type TintaTipo = 'gel' | 'relevo'

export type InsumoItem = {
  id: string
  categoria: InsumoCategoria
  nome: string
  corTinta?: TintaCor
  tipoTinta?: TintaTipo
  quantidade: number
  updatedAt: string
  observacoes?: string
}

export function getCategoriaMeta(cat: InsumoCategoria) {
  return INSUMO_CATEGORIAS.find(c => c.id === cat)!
}

export function isCategoriaItemUnico(cat: InsumoCategoria): cat is InsumoCategoriaSimples {
  return (CATEGORIAS_ITEM_UNICO as readonly string[]).includes(cat)
}

export function unidadeLabel(unidade: UnidadeInsumo, qtd: number): string {
  if (unidade === 'kg') return qtd === 1 ? 'quilo' : 'quilos'
  if (unidade === 'tubos') return qtd === 1 ? 'tubo' : 'tubos'
  if (unidade === 'litros') return qtd === 1 ? 'litro' : 'litros'
  if (unidade === 'latas') return qtd === 1 ? 'lata' : 'latas'
  return qtd === 1 ? 'unidade' : 'unidades'
}
