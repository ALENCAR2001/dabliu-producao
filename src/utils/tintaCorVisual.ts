/**
 * Cor visual dos chips/catálogo de tinta — combina nome + id (slug).
 * Reconhece nomes em português comuns; cores desconhecidas ganham tonalidade estável (hash por id).
 */

function normalizeParaBusca(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Mais longos primeiro para bater «azul marinho» antes de «azul» */
const PALAVRA_HEX_ENTRIES: [keyword: string, hex: string][] = [
    ['azul marinho', '#1e3a8a'],
    ['verde militar', '#3f6212'],
    ['verde lima', '#84cc16'],
    ['verde escuro', '#14532d'],
    ['verde claro', '#4ade80'],
    ['azul celeste', '#38bdf8'],
    ['azul claro', '#7dd3fc'],
    ['azul royal', '#1d4ed8'],
    ['vinho bordo', '#7f1d1d'],
    ['off white', '#f5f5f4'],
    ['off-white', '#f5f5f4'],
    ['preto fosco', '#27272a'],
    ['cinza chumbo', '#52525b'],
    ['cinza grafite', '#3f3f46'],
    ['rosa choque', '#db2777'],
    ['rosa bebe', '#fbcfe8'],
    ['rosa bebê', '#fce7f3'],
    ['terracota', '#c2410c'],
    ['salmão', '#fa8072'],
    ['salmao', '#fa8072'],
    ['turquesa', '#14b8a6'],
    ['champagne', '#e8d4b8'],
    ['dourado', '#ca8a04'],
    ['chocolate', '#451a03'],
    ['café', '#422006'],
    ['cafe', '#422006'],
    ['vinho', '#7f1d1d'],
    ['bordô', '#7f1d1d'],
    ['bordo', '#7f1d1d'],
    ['lilás', '#a855f7'],
    ['lilas', '#a855f7'],
    ['violeta', '#7c3aed'],
    ['magenta', '#c026d3'],
    ['laranja', '#f97316'],
    ['amarelo', '#eab308'],
    ['amarela', '#eab308'],
    ['ouro', '#ca8a04'],
    ['vermelho', '#dc2626'],
    ['vermelha', '#dc2626'],
    ['rosa', '#ec4899'],
    ['pink', '#ec4899'],
    ['preto', '#18181b'],
    ['preta', '#18181b'],
    ['branco', '#f5f5f5'],
    ['branca', '#f5f5f5'],
    ['cinza', '#71717a'],
    ['grafite', '#52525b'],
    ['azul', '#2563eb'],
    ['celeste', '#0ea5e9'],
    ['ciano', '#06b6d4'],
    ['verde', '#16a34a'],
    ['oliva', '#4d7c0f'],
    ['militar', '#3f6212'],
    ['perola', '#e7e5e4'],
    ['pérola', '#e7e5e4'],
    ['bronze', '#a16207'],
    ['prata', '#9ca3af'],
    ['nude', '#c4a894'],
    ['creme', '#f5e6d3'],
    ['bege', '#e8dcc8'],
    ['marrom', '#78350f'],
    ['coral', '#fb7185'],
    ['neon', '#bef264'],
    ['roxo', '#7e22ce'],
    ['roxa', '#7e22ce'],
    ['black', '#18181b'],
    ['white', '#f5f5f5'],
    ['blue', '#2563eb'],
    ['red', '#dc2626'],
    ['yellow', '#eab308'],
    ['green', '#16a34a'],
    ['purple', '#7e22ce'],
    ['orange', '#f97316'],
  ]

const PALAVRA_HEX: [string, string][] = [...PALAVRA_HEX_ENTRIES].sort(
  (a: [string, string], b: [string, string]) => b[0].length - a[0].length
)

function hashHue(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h % 360
}

/**
 * Cor CSS (#hex ou hsl) para bolinha / amostra visual.
 */
export function getTintaVisualColor(corId: string, label: string): string {
  const slug = normalizeParaBusca(corId.replace(/-/g, ' '))
  const lab = normalizeParaBusca(label)
  const texto = `${slug} ${lab}`.trim()

  for (const [kw, hex] of PALAVRA_HEX) {
    const nk = normalizeParaBusca(kw)
    if (texto.includes(nk)) return hex
  }

  const hue = hashHue(corId || label || 'tinta')
  return `hsl(${hue} 58% 44%)`
}
