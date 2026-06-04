import type { InsumoItem, InsumoCategoria, TintaCor, UnidadeInsumo } from '../types/insumos'
import { INSUMO_CATEGORIAS, getCategoriaMeta, isCategoriaItemUnico, unidadeLabel } from '../types/insumos'
import { getTintaCorLabel, loadTintaCoresCatalog } from './tintaCoresCatalog'
import { getItemUnico } from './insumoSimples'
import { getTintasDaCor } from './tintaVariants'

export type InsumoCardResumo = {
  categoria: InsumoCategoria
  label: string
  unidade: UnidadeInsumo
  total: number
  unidadeTexto: string
}

export type TintaCorResumo = {
  cor: TintaCor
  label: string
  gel: number
  relevo: number
  total: number
}

export type InsumoLinhaDetalhe = {
  nome: string
  quantidade: number
  unidade: UnidadeInsumo
  unidadeTexto: string
  vazio: boolean
}

export function buildInsumosDashboard(items: InsumoItem[]) {
  const cards: InsumoCardResumo[] = INSUMO_CATEGORIAS.map(cat => {
    const meta = getCategoriaMeta(cat.id)
    const total =
      cat.id === 'tinta'
        ? items.filter(i => i.categoria === 'tinta').reduce((s, i) => s + i.quantidade, 0)
        : isCategoriaItemUnico(cat.id)
          ? getItemUnico(items, cat.id).quantidade
          : items.filter(i => i.categoria === cat.id).reduce((s, i) => s + i.quantidade, 0)
    return {
      categoria: cat.id,
      label: meta.label,
      unidade: meta.unidade,
      total,
      unidadeTexto: unidadeLabel(meta.unidade, total),
    }
  })

  const tintasPorCor: TintaCorResumo[] = loadTintaCoresCatalog().map(({ id: cor }) => {
    const par = getTintasDaCor(items, cor)
    const gel = par.find(p => p.tipoTinta === 'gel')?.quantidade ?? 0
    const relevo = par.find(p => p.tipoTinta === 'relevo')?.quantidade ?? 0
    return {
      cor,
      label: getTintaCorLabel(cor),
      gel,
      relevo,
      total: gel + relevo,
    }
  })

  const detalhes: InsumoLinhaDetalhe[] = []

  for (const cat of INSUMO_CATEGORIAS) {
    if (cat.id === 'tinta') continue
    const meta = getCategoriaMeta(cat.id)
    if (isCategoriaItemUnico(cat.id)) {
      const item = getItemUnico(items, cat.id)
      detalhes.push({
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: meta.unidade,
        unidadeTexto: unidadeLabel(meta.unidade, item.quantidade),
        vazio: item.quantidade <= 0,
      })
    } else {
      for (const item of items.filter(i => i.categoria === cat.id)) {
        detalhes.push({
          nome: item.nome,
          quantidade: item.quantidade,
          unidade: meta.unidade,
          unidadeTexto: unidadeLabel(meta.unidade, item.quantidade),
          vazio: item.quantidade <= 0,
        })
      }
    }
  }

  const itensZerados = [
    ...detalhes.filter(d => d.vazio),
    ...tintasPorCor.flatMap(t => [
      { nome: `${t.label} gel`, q: t.gel },
      { nome: `${t.label} relevo`, q: t.relevo },
    ])
      .filter(x => x.q <= 0)
      .map(x => ({ nome: x.nome, quantidade: 0, unidade: 'kg' as const, unidadeTexto: 'quilos', vazio: true })),
  ]

  return { cards, tintasPorCor, detalhes, itensZerados }
}

export function formatInsumoQty(qty: number, unidade: UnidadeInsumo): string {
  const decimals = unidade === 'kg' || unidade === 'litros' ? 1 : 0
  return qty.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}
