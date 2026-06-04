import type { DayPunch } from '../types/ponto'
import type { InsumoItem } from '../types/insumos'
import type { LancamentoFinanceiro, ResumoFinanceiroMes } from '../types/financeiro'
import { INSUMO_CATEGORIAS } from '../types/insumos'
import { formatMoedaBR } from './financeiroResumo'
import { PRODUCAO_SIZES, type ProducaoEntry } from './productionStorage'
import { downloadCsv } from './exportCsv'
import { formatTimeBR } from './calendar'
import { getCategoriaMeta, unidadeLabel } from '../types/insumos'

function formatDateTimeExport(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

export function exportProducaoCsv(entries: ProducaoEntry[], tituloMes: string): void {
  const headers = [
    'Data',
    'Marca',
    'Modelo',
    'Código',
    'Cor tecido',
    'Tipo',
    ...PRODUCAO_SIZES,
    'Total',
    'Observações',
  ]
  const rows = entries.map(e => [
    formatDateTimeExport(e.createdAt),
    e.marca,
    e.nome,
    e.codigo,
    e.corTecido,
    e.tipoModeloLabel,
    ...PRODUCAO_SIZES.map(s => e.quantidades[s] ?? 0),
    e.total,
    e.observacoes ?? '',
  ])
  const safe = tituloMes.replace(/[^\w-]+/g, '_')
  downloadCsv(`dabliu-jeans-producao-${safe}.csv`, headers, rows)
}

export function exportPontoCsv(punches: DayPunch[], tituloMes: string): void {
  const headers = ['Data', 'Funcionário', 'Entrada', 'Saída', 'Status']
  const rows = punches
    .sort((a, b) => a.date.localeCompare(b.date) || a.userNome.localeCompare(b.userNome))
    .map(p => {
      const status =
        p.entradaAt && p.saidaAt ? 'Completo' : p.entradaAt ? 'Falta' : 'Sem registro'
      return [
        p.date,
        p.userNome,
        p.entradaAt ? formatTimeBR(p.entradaAt) : '',
        p.saidaAt ? formatTimeBR(p.saidaAt) : '',
        status,
      ]
    })
  const safe = tituloMes.replace(/[^\w-]+/g, '_')
  downloadCsv(`dabliu-jeans-ponto-${safe}.csv`, headers, rows)
}

export function exportInsumosCsv(items: InsumoItem[]): void {
  const headers = ['Categoria', 'Item', 'Quantidade', 'Unidade', 'Atualizado em']
  const rows = items.map(i => {
    const meta = getCategoriaMeta(i.categoria)
    return [
      meta.label,
      i.nome,
      i.quantidade,
      unidadeLabel(meta.unidade, i.quantidade),
      formatDateTimeExport(i.updatedAt),
    ]
  })
  const hoje = new Date().toISOString().slice(0, 10)
  downloadCsv(`dabliu-jeans-insumos-${hoje}.csv`, headers, rows)
}

function lancamentoLabel(e: LancamentoFinanceiro): string {
  if (e.grupo === 'insumo' && e.categoriaInsumo) {
    const cat = INSUMO_CATEGORIAS.find(c => c.id === e.categoriaInsumo)
    return `Insumo — ${cat?.label ?? e.categoriaInsumo}`
  }
  return 'Geral'
}

export function exportFinanceiroCsv(
  lancamentos: LancamentoFinanceiro[],
  resumo: ResumoFinanceiroMes,
  tituloMes: string
): void {
  const headers = ['Data', 'Tipo', 'Grupo', 'Valor (R$)', 'Descrição']
  const rows = lancamentos
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data) || a.createdAt.localeCompare(b.createdAt))
    .map(e => [
      e.data,
      e.tipo === 'entrada' ? 'Entrada' : 'Saída',
      lancamentoLabel(e),
      e.valor.toFixed(2).replace('.', ','),
      e.descricao ?? '',
    ])

  rows.push([])
  rows.push(['Resumo do mês', '', '', '', ''])
  rows.push(['Entradas', '', '', formatMoedaBR(resumo.totalEntradas), ''])
  rows.push(['Saídas', '', '', formatMoedaBR(resumo.totalSaidas), ''])
  rows.push(['Lucro', '', '', formatMoedaBR(resumo.lucro), ''])
  rows.push(['Gastos insumos', '', '', formatMoedaBR(resumo.gastosInsumosTotal), ''])
  for (const c of INSUMO_CATEGORIAS) {
    rows.push([`  ${c.label}`, '', '', formatMoedaBR(resumo.gastosPorInsumo[c.id]), ''])
  }

  const safe = tituloMes.replace(/[^\w-]+/g, '_')
  downloadCsv(`dabliu-jeans-financeiro-${safe}.csv`, headers, rows)
}
