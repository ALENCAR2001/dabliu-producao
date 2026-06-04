import type { InsumoCategoria } from '../types/insumos'
import type { LancamentoFinanceiro, LancamentoGrupo, LancamentoTipo } from '../types/financeiro'
import { loadFinanceiro, saveFinanceiro } from '../utils/financeiroStorage'

export type CreateLancamentoInput = {
  data: string
  tipo: LancamentoTipo
  valor: number
  grupo: LancamentoGrupo
  categoriaInsumo?: InsumoCategoria
  descricao?: string
}

function newId(): string {
  return `fin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function listFinanceiro(): Promise<LancamentoFinanceiro[]> {
  return loadFinanceiro().sort((a, b) => b.data.localeCompare(a.data) || b.createdAt.localeCompare(a.createdAt))
}

export async function createLancamento(input: CreateLancamentoInput): Promise<LancamentoFinanceiro> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) {
    throw new Error('Data inválida.')
  }
  if (input.valor <= 0) {
    throw new Error('Informe um valor maior que zero.')
  }
  if (input.grupo === 'insumo') {
    if (input.tipo !== 'saida') {
      throw new Error('Gastos de insumo são registrados como saída.')
    }
    if (!input.categoriaInsumo) {
      throw new Error('Selecione a categoria do insumo.')
    }
  }

  const entry: LancamentoFinanceiro = {
    id: newId(),
    data: input.data,
    tipo: input.tipo,
    valor: input.valor,
    grupo: input.grupo,
    categoriaInsumo: input.categoriaInsumo,
    descricao: input.descricao?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  const all = loadFinanceiro()
  all.push(entry)
  saveFinanceiro(all)
  return entry
}

export async function deleteLancamento(id: string): Promise<void> {
  const all = loadFinanceiro()
  const next = all.filter(e => e.id !== id)
  if (next.length === all.length) {
    throw new Error('Lançamento não encontrado.')
  }
  saveFinanceiro(next)
}
