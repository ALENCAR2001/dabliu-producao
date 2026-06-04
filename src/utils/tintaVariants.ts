import type { InsumoItem, TintaTipo } from '../types/insumos'
import { getTintaCorLabel, loadTintaCoresCatalog } from './tintaCoresCatalog'

export const TINTA_TIPOS: { id: TintaTipo; label: string }[] = [
  { id: 'gel', label: 'Gel' },
  { id: 'relevo', label: 'Relevo' },
]

/** Nome curto no masculino (só presets legados) — ex.: Branco gel */
const TINTA_COR_NOME_LEGACY: Record<string, string> = {
  branca: 'Branco',
  preta: 'Preto',
  azul: 'Azul',
  vermelha: 'Vermelho',
  amarela: 'Amarelo',
}

export function tintaItemId(corId: string, tipo: TintaTipo): string {
  return `tinta-${corId}-${tipo}`
}

export function getTintaNome(corId: string, tipo: TintaTipo): string {
  const base = TINTA_COR_NOME_LEGACY[corId] ?? getTintaCorLabel(corId)
  const sufixo = tipo === 'gel' ? 'gel' : 'relevo'
  return `${base} ${sufixo}`
}

export function getTintaTipoLabel(tipo: TintaTipo): string {
  return TINTA_TIPOS.find(t => t.id === tipo)?.label ?? tipo
}

function inferTipoFromNome(nome: string): TintaTipo {
  return /relevo|relévo/i.test(nome) ? 'relevo' : 'gel'
}

function inferCorFromLegacy(item: InsumoItem): string | undefined {
  if (item.corTinta) return item.corTinta
  const n = item.nome.toLowerCase()
  for (const c of loadTintaCoresCatalog()) {
    const lab = c.label.toLowerCase()
    if (lab.length >= 3 && n.includes(lab)) return c.id
    if (n.includes(c.id.replace(/-/g, ' '))) return c.id
  }
  if (n.includes('branc')) return 'branca'
  if (n.includes('pret') || n.includes('preto')) return 'preta'
  if (n.includes('azul')) return 'azul'
  if (n.includes('vermelh')) return 'vermelha'
  if (n.includes('amarel')) return 'amarela'
  return undefined
}

/** Garante Gel + Relevo para cada cor do catálogo; migra cadastros antigos */
export function ensureTintaVariants(items: InsumoItem[]): InsumoItem[] {
  const cores = loadTintaCoresCatalog()
  const nonTinta = items.filter(i => i.categoria !== 'tinta')
  const legacyTintas = items.filter(i => i.categoria === 'tinta')
  const usedLegacy = new Set<string>()
  const tintas: InsumoItem[] = []

  for (const { id: cor } of cores) {
    for (const { id: tipo } of TINTA_TIPOS) {
      const id = tintaItemId(cor, tipo)
      const nome = getTintaNome(cor, tipo)

      let match = legacyTintas.find(i => i.id === id)
      if (!match) {
        match = legacyTintas.find(i => {
          if (usedLegacy.has(i.id)) return false
          const ic = inferCorFromLegacy(i)
          if (ic !== cor) return false
          const it = i.tipoTinta ?? inferTipoFromNome(i.nome)
          return it === tipo
        })
      }
      if (match) usedLegacy.add(match.id)

      tintas.push({
        id,
        categoria: 'tinta',
        nome,
        corTinta: cor,
        tipoTinta: tipo,
        quantidade: match?.quantidade ?? 0,
        updatedAt: match?.updatedAt ?? new Date().toISOString(),
        observacoes: match?.observacoes,
      })
    }
  }

  return [...nonTinta, ...tintas]
}

export function buildDefaultTintas(): InsumoItem[] {
  const now = new Date().toISOString()
  const qty: Partial<Record<string, number>> = {
    'tinta-preta-gel': 2,
    'tinta-preta-relevo': 6,
    'tinta-branca-gel': 4,
    'tinta-branca-relevo': 3,
    'tinta-azul-gel': 3,
    'tinta-azul-relevo': 2,
    'tinta-vermelha-gel': 2,
    'tinta-vermelha-relevo': 1.5,
    'tinta-amarela-gel': 1.5,
    'tinta-amarela-relevo': 1,
  }

  return loadTintaCoresCatalog().flatMap(({ id: cor }) =>
    TINTA_TIPOS.map(({ id: tipo }) => ({
      id: tintaItemId(cor, tipo),
      categoria: 'tinta' as const,
      nome: getTintaNome(cor, tipo),
      corTinta: cor,
      tipoTinta: tipo,
      quantidade: qty[tintaItemId(cor, tipo)] ?? 0,
      updatedAt: now,
    }))
  )
}

export function getTintasDaCor(items: InsumoItem[], cor: string): InsumoItem[] {
  return TINTA_TIPOS.map(({ id: tipo }) => {
    const id = tintaItemId(cor, tipo)
    return (
      items.find(i => i.id === id) ?? {
        id,
        categoria: 'tinta',
        nome: getTintaNome(cor, tipo),
        corTinta: cor,
        tipoTinta: tipo,
        quantidade: 0,
        updatedAt: new Date().toISOString(),
      }
    )
  })
}
