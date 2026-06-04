import {
  DEFAULT_TIPOS_MODELO,
  getTipoModeloLabelFromCatalog,
  type TipoDef,
} from '../utils/layoutCatalog'

/** Tipos padrão (Long Line, Oversized, …) */
export const TIPOS_MODELO = DEFAULT_TIPOS_MODELO

export type TipoModelo = string

export type { TipoDef }

export function getTipoModeloLabel(id: TipoModelo | string): string {
  return getTipoModeloLabelFromCatalog(id)
}

/** Cada modelo = uma cor/referência. Se veio do PDF da categoria, pdfPage indica a página (1, 2, 3…) */
export interface Layout {
  id: string
  marca: string
  tipoModelo: TipoModelo
  /** Coleção (lote de PDF) — separa semana a semana sem misturar */
  colecaoId?: string
  /** Página do PDF desta coleção (1 = primeira página) */
  pdfPage?: number
  nome: string
  codigo: string
  corTecido: string
  silk: string
  puff: string
  demaos: string
  alturaGola: string
  observacoes: string
  status: 'ativo' | 'producao' | 'finalizado'
  createdAt: Date
}
