import { loadInsumoMinimos, getMinimoForItem } from '../data/insumoMinimos'
import type { InsumoItem, UnidadeInsumo } from '../types/insumos'
import { getCategoriaMeta, unidadeLabel } from '../types/insumos'
import { ensureInsumoCatalog } from './insumoCatalog'

export type NivelAlertaInsumo = 'ok' | 'baixo' | 'zerado'

export type InsumoAlerta = {
  id: string
  nome: string
  categoria: InsumoItem['categoria']
  quantidade: number
  minimo: number
  nivel: NivelAlertaInsumo
  unidade: UnidadeInsumo
  unidadeTexto: string
}

export function nivelAlerta(qtd: number, minimo: number): NivelAlertaInsumo {
  if (qtd <= 0) return 'zerado'
  if (qtd < minimo) return 'baixo'
  return 'ok'
}

export function analisarInsumos(items: InsumoItem[]): {
  alertas: InsumoAlerta[]
  zerados: InsumoAlerta[]
  baixos: InsumoAlerta[]
  ok: number
} {
  const minimos = loadInsumoMinimos()
  const catalog = ensureInsumoCatalog(items)

  const alertas: InsumoAlerta[] = catalog.map(item => {
    const meta = getCategoriaMeta(item.categoria)
    const minimo = getMinimoForItem(item, minimos)
    const nivel = nivelAlerta(item.quantidade, minimo)
    return {
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      quantidade: item.quantidade,
      minimo,
      nivel,
      unidade: meta.unidade,
      unidadeTexto: unidadeLabel(meta.unidade, item.quantidade),
    }
  })

  const zerados = alertas.filter(a => a.nivel === 'zerado')
  const baixos = alertas.filter(a => a.nivel === 'baixo')
  const ok = alertas.filter(a => a.nivel === 'ok').length

  return { alertas, zerados, baixos, ok }
}

export function alertaPorId(alertas: InsumoAlerta[], id: string): InsumoAlerta | undefined {
  return alertas.find(a => a.id === id)
}

export function piorNivelCategoria(alertas: InsumoAlerta[], categoria: InsumoItem['categoria']): NivelAlertaInsumo {
  const daCat = alertas.filter(a => a.categoria === categoria)
  if (daCat.some(a => a.nivel === 'zerado')) return 'zerado'
  if (daCat.some(a => a.nivel === 'baixo')) return 'baixo'
  return 'ok'
}
