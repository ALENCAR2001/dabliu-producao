import type { InsumoCategoria } from './insumos'

/** Receita ou despesa (não confundir com entrada/saída de ponto). */
export type LancamentoTipo = 'entrada' | 'saida'

/** Despesa geral ou gasto vinculado a categoria de insumo. */
export type LancamentoGrupo = 'geral' | 'insumo'

export type LancamentoFinanceiro = {
  id: string
  /** Data do lançamento YYYY-MM-DD */
  data: string
  tipo: LancamentoTipo
  /** Valor positivo em reais */
  valor: number
  grupo: LancamentoGrupo
  /** Preenchido quando grupo === 'insumo' */
  categoriaInsumo?: InsumoCategoria
  descricao?: string
  createdAt: string
}

export type ResumoFinanceiroMes = {
  totalEntradas: number
  totalSaidas: number
  lucro: number
  gastosInsumosTotal: number
  gastosPorInsumo: Record<InsumoCategoria, number>
  saidasGerais: number
}
