import { COMPANY_MARCA } from '../config/brand'

type LayoutLike = { marca: string; tipoModelo: string }

export const DEFAULT_MARCAS = [
  COMPANY_MARCA,
  'BRODEZ',
  'NOZES',
  'KING BEE',
  'ESTILO FAVELA',
  'CB BLACK',
] as const

export const DEFAULT_TIPOS_MODELO = [
  { id: 'long-line', label: 'Long Line' },
  { id: 'oversized', label: 'Oversized' },
  { id: 't-shirt', label: 'T-shirt' },
  { id: 'cropped-over', label: 'Cropped Over' },
  { id: 'infantil', label: 'Infantil' },
] as const

export type TipoDef = { id: string; label: string }

const CATALOG_KEY = 'dabliu-layout-catalog-v1'

type LayoutCatalog = {
  customMarcas: string[]
  customTipos: TipoDef[]
}

function emptyCatalog(): LayoutCatalog {
  return { customMarcas: [], customTipos: [] }
}

export function loadLayoutCatalog(): LayoutCatalog {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    if (!raw) return emptyCatalog()
    const parsed = JSON.parse(raw) as LayoutCatalog
    return {
      customMarcas: Array.isArray(parsed.customMarcas)
        ? parsed.customMarcas.map(m => normalizeMarcaName(m)).filter(Boolean)
        : [],
      customTipos: Array.isArray(parsed.customTipos)
        ? parsed.customTipos.filter(t => t?.id && t?.label)
        : [],
    }
  } catch {
    return emptyCatalog()
  }
}

export function saveLayoutCatalog(catalog: LayoutCatalog): void {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog))
}

export function normalizeMarcaName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function slugifyTipoId(label: string): string {
  const base =
    label
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tipo'
  return base
}

function uniqueTipoId(baseId: string, taken: Set<string>): string {
  let id = baseId
  let n = 2
  while (taken.has(id)) {
    id = `${baseId}-${n}`
    n += 1
  }
  return id
}

export function buildMarcaList(catalog: LayoutCatalog, layouts: LayoutLike[]): string[] {
  const set = new Set<string>()
  for (const m of DEFAULT_MARCAS) set.add(m)
  for (const m of catalog.customMarcas) set.add(normalizeMarcaName(m))
  for (const l of layouts) if (l.marca.trim()) set.add(normalizeMarcaName(l.marca))

  return [...set].sort((a, b) => {
    const ai = DEFAULT_MARCAS.indexOf(a as (typeof DEFAULT_MARCAS)[number])
    const bi = DEFAULT_MARCAS.indexOf(b as (typeof DEFAULT_MARCAS)[number])
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return -1
    if (bi >= 0) return 1
    return a.localeCompare(b, 'pt-BR')
  })
}

export function buildTipoList(catalog: LayoutCatalog, layouts: LayoutLike[]): TipoDef[] {
  const map = new Map<string, string>()
  for (const t of DEFAULT_TIPOS_MODELO) map.set(t.id, t.label)
  for (const t of catalog.customTipos) map.set(t.id, t.label)
  for (const l of layouts) {
    if (!map.has(l.tipoModelo)) {
      map.set(l.tipoModelo, l.tipoModelo.replace(/-/g, ' '))
    }
  }
  const defaultOrder: string[] = [...DEFAULT_TIPOS_MODELO.map(t => t.id)]
  return [...map.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => {
      const ai = defaultOrder.indexOf(a.id)
      const bi = defaultOrder.indexOf(b.id)
      if (ai >= 0 && bi >= 0) return ai - bi
      if (ai >= 0) return -1
      if (bi >= 0) return 1
      return a.label.localeCompare(b.label, 'pt-BR')
    })
}

export function getTipoModeloLabelFromCatalog(
  id: string,
  catalog = loadLayoutCatalog(),
  layouts: LayoutLike[] = []
): string {
  return buildTipoList(catalog, layouts).find(t => t.id === id)?.label ?? id.replace(/-/g, ' ')
}

export function addCustomMarca(name: string, catalog = loadLayoutCatalog()): { catalog: LayoutCatalog; marca: string } {
  const marca = normalizeMarcaName(name)
  if (!marca) throw new Error('Informe o nome da marca.')
  if ((DEFAULT_MARCAS as readonly string[]).includes(marca)) {
    return { catalog, marca }
  }
  if (!catalog.customMarcas.includes(marca)) {
    catalog = { ...catalog, customMarcas: [...catalog.customMarcas, marca] }
    saveLayoutCatalog(catalog)
  }
  return { catalog, marca }
}

export function addCustomTipo(
  label: string,
  catalog = loadLayoutCatalog()
): { catalog: LayoutCatalog; tipo: TipoDef } {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('Informe o nome do tipo de camisa.')

  const existing = buildTipoList(catalog, [])
  const taken = new Set(existing.map(t => t.id))
  const byLabel = existing.find(t => t.label.toLowerCase() === trimmed.toLowerCase())
  if (byLabel) return { catalog, tipo: byLabel }

  const id = uniqueTipoId(slugifyTipoId(trimmed), taken)
  const tipo: TipoDef = { id, label: trimmed }
  const next = { ...catalog, customTipos: [...catalog.customTipos, tipo] }
  saveLayoutCatalog(next)
  return { catalog: next, tipo }
}
