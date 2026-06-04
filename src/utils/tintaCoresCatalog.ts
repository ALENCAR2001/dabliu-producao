/**
 * Catálogo de cores de tinta — editável pelo usuário.
 * Persistência no navegador + sincronização com itens já salvos (ex.: Supabase).
 */

const STORAGE_KEY = 'dabliu-tinta-cores-v2'
const EXCLUDED_IDS_KEY = 'dabliu-tinta-cores-excluidos-v1'

export type TintaCorDef = {
  id: string
  label: string
}

/** Cores iniciais (mesmas da versão anterior) */
export const DEFAULT_TINTA_CORES: readonly TintaCorDef[] = [
  { id: 'branca', label: 'Branca' },
  { id: 'preta', label: 'Preta' },
  { id: 'azul', label: 'Azul' },
  { id: 'vermelha', label: 'Vermelha' },
  { id: 'amarela', label: 'Amarela' },
]

/** Cores fixas do sistema — não podem ser removidas do catálogo */
export function isTintaCorPadrao(id: string): boolean {
  return DEFAULT_TINTA_CORES.some(d => d.id === id)
}

function loadExcludedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(EXCLUDED_IDS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0))
  } catch {
    return new Set()
  }
}

function saveExcludedIds(ids: Set<string>): void {
  localStorage.setItem(EXCLUDED_IDS_KEY, JSON.stringify([...ids]))
}

export function isTintaCorExcluidaDaSync(id: string): boolean {
  return loadExcludedIds().has(id)
}

/** Deixa de ignorar uma cor na sincronização com o banco (ex.: ao cadastrar de novo) */
export function clearTintaCorExcluida(id: string): void {
  const s = loadExcludedIds()
  s.delete(id)
  saveExcludedIds(s)
}

function addTintaCorExcluida(id: string): void {
  const s = loadExcludedIds()
  s.add(id)
  saveExcludedIds(s)
}

export function slugifyTintaCorId(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return s || `cor-${Date.now()}`
}

function parseStored(): TintaCorDef[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return null
    return arr
      .filter((x): x is TintaCorDef => typeof x?.id === 'string' && typeof x?.label === 'string')
      .map(x => ({ id: x.id.trim(), label: x.label.trim() }))
      .filter(x => x.id && x.label)
  } catch {
    return null
  }
}

function saveStored(cores: TintaCorDef[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cores))
}

/** Garante que ids padrão existam com label de fábrica se faltarem */
export function mergeComPadroes(parsed: TintaCorDef[]): TintaCorDef[] {
  const map = new Map<string, TintaCorDef>()
  for (const d of DEFAULT_TINTA_CORES) map.set(d.id, { ...d })
  for (const c of parsed) map.set(c.id, c)
  return [...map.values()]
}

/** Lista ordenada por label pt-BR (cores “excluídas” somem dos chips, mantendo as 5 padrão) */
export function loadTintaCoresCatalog(): TintaCorDef[] {
  const excluded = loadExcludedIds()
  const visible = (arr: TintaCorDef[]) =>
    arr.filter(c => isTintaCorPadrao(c.id) || !excluded.has(c.id))

  const parsed = parseStored()
  if (!parsed || parsed.length === 0) {
    const init = mergeComPadroes([])
    saveStored(init)
    return visible([...init]).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }
  const merged = mergeComPadroes(parsed)
  return visible([...merged]).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function saveTintaCoresCatalogFull(list: TintaCorDef[]): void {
  saveStored(mergeComPadroes(list.filter(c => c.id && c.label)))
}

export function getTintaCorLabel(corId: string): string {
  return loadTintaCoresCatalog().find(c => c.id === corId)?.label ?? corId
}

/** Extrai "Verde gel" → "Verde" */
export function labelFromTintaNome(nome: string): string | null {
  const m = nome.match(/^(.+?)\s+(gel|rel[eé]vo)$/i)
  return m ? m[1].trim() : null
}

/** Inclui cores presentes nos itens (ex.: vindo da nuvem) que ainda não estão no catálogo gravado */
export function syncTintaCatalogWithItems(
  items: { nome: string; corTinta?: string; categoria: string }[]
): TintaCorDef[] {
  let list = mergeComPadroes(parseStored() ?? [])
  const byId = new Map(list.map(c => [c.id, c]))
  let altered = false
  for (const it of items) {
    if (it.categoria !== 'tinta') continue
    const cid = it.corTinta?.trim()
    if (!cid || byId.has(cid)) continue
    if (loadExcludedIds().has(cid)) continue
    const fromNome = labelFromTintaNome(it.nome)
    const label =
      fromNome ||
      cid
        .replace(/-/g, ' ')
        .replace(/\b\w/g, x => x.toUpperCase())
    byId.set(cid, { id: cid, label })
    altered = true
  }
  if (!altered) return [...list].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  list = [...byId.values()]
  saveStored(list)
  return [...list].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export type RemoveTintaCorResult = { ok: true } | { ok: false; message: string }

/**
 * Remove cor customizada do catálogo, marca como excluída na sync e (na tela Insumos) apaga Gel + Relevo no estoque.
 */
export function removeTintaCorDoCatalogo(id: string): RemoveTintaCorResult {
  if (isTintaCorPadrao(id)) {
    return { ok: false, message: 'As cores padrão (Branca, Preta, etc.) não podem ser removidas.' }
  }
  addTintaCorExcluida(id)
  const merged = mergeComPadroes(parseStored() ?? []).filter(c => c.id !== id)
  saveStored(merged)
  return { ok: true }
}

export type AddTintaCorResult =
  | { ok: true; id: string; label: string }
  | { ok: false; message: string }

/** Nova cor — Gel e Relevo são criados em ensureTintaVariants ao salvar lista de insumos */
export function addTintaCorToCatalog(labelDigitada: string): AddTintaCorResult {
  const label = labelDigitada.trim()
  if (label.length < 2) {
    return { ok: false, message: 'Digite pelo menos 2 letras para o nome da cor.' }
  }
  if (label.length > 48) {
    return { ok: false, message: 'Nome da cor longo demais.' }
  }
  const id = slugifyTintaCorId(label)
  let list = loadTintaCoresCatalog()
  if (list.some(c => c.id === id)) {
    return { ok: false, message: 'Já existe uma cor com esse identificador.' }
  }
  if (list.some(c => c.label.toLowerCase() === label.toLowerCase())) {
    return { ok: false, message: 'Já existe uma cor com esse nome.' }
  }
  list = [...list, { id, label }].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  clearTintaCorExcluida(id)
  saveTintaCoresCatalogFull(list)
  return { ok: true, id, label }
}
