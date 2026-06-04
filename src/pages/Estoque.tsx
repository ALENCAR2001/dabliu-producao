import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Droplets,
  FlaskConical,
  Minus,
  Package,
  Plus,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  Waves,
  X,
} from 'lucide-react'
import { INSUMO_CATEGORIAS, getCategoriaMeta, isCategoriaItemUnico, unidadeLabel, type InsumoCategoria, type InsumoItem } from '../types/insumos'
import { addTintaCorToCatalog, getTintaCorLabel, isTintaCorPadrao, loadTintaCoresCatalog, removeTintaCorDoCatalogo } from '../utils/tintaCoresCatalog'
import { deleteInsumo, listInsumos, upsertInsumo, updateQuantidade } from '../services/insumosService'
import { getItemUnico } from '../utils/insumoSimples'
import { InsumoAlertBadge } from '../components/InsumoAlertBadge'
import { alertaPorId, analisarInsumos } from '../utils/insumoAlertas'
import { getTintaVisualColor } from '../utils/tintaCorVisual'
import { getTintasDaCor, getTintaTipoLabel, tintaItemId } from '../utils/tintaVariants'

function categoriaIcon(cat: InsumoCategoria) {
  switch (cat) {
    case 'cola':
      return <Droplets size={22} className="text-amber-400" />
    case 'tinta':
      return <Package size={22} className="text-violet-400" />
    case 'fita':
      return <Scissors size={22} className="text-rose-400" />
    case 'emulsao':
      return <FlaskConical size={22} className="text-cyan-400" />
    case 'desgravador':
      return <Sparkles size={22} className="text-orange-400" />
    case 'solvente':
      return <Waves size={22} className="text-sky-400" />
  }
}

function Estoque() {
  const [items, setItems] = useState<InsumoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState<InsumoCategoria>('tinta')
  const [corTinta, setCorTinta] = useState<string>('preta')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [showNovaCor, setShowNovaCor] = useState(false)
  const [novaCorNome, setNovaCorNome] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listInsumos()
      setItems(list)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao carregar estoque')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      await refresh()
    })
    return () => {
      cancelled = true
    }
  }, [refresh])

  const meta = getCategoriaMeta(categoria)

  const tintaCoresCatalog = useMemo(() => loadTintaCoresCatalog(), [])

  useEffect(() => {
    if (categoria !== 'tinta' || tintaCoresCatalog.length === 0) return
    void Promise.resolve().then(() => {
      if (!tintaCoresCatalog.some(c => c.id === corTinta)) setCorTinta(tintaCoresCatalog[0].id)
    })
  }, [categoria, corTinta, tintaCoresCatalog])

  const filtered = useMemo(() => {
    if (categoria === 'tinta') return getTintasDaCor(items, corTinta)
    if (isCategoriaItemUnico(categoria)) return [getItemUnico(items, categoria)]
    return items
      .filter(i => i.categoria === categoria)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [items, categoria, corTinta])

  const totaisCategoria = useMemo(() => {
    const map = Object.fromEntries(INSUMO_CATEGORIAS.map(c => [c.id, 0])) as Record<
      InsumoCategoria,
      number
    >
    for (const i of items) map[i.categoria] += i.quantidade
    return map
  }, [items])

  const categoriaFixa = categoria === 'tinta' || isCategoriaItemUnico(categoria)
  const stepQty = meta.unidade === 'kg' || meta.unidade === 'litros' ? 0.5 : 1
  const { alertas } = useMemo(() => analisarInsumos(items), [items])

  const selected = useMemo(
    () => (selectedId ? items.find(i => i.id === selectedId) ?? null : null),
    [items, selectedId]
  )

  useEffect(() => {
    void Promise.resolve().then(() => {
      setEditQty(selected ? String(selected.quantidade) : '')
    })
  }, [selected])

  const selectItem = (item: InsumoItem) => {
    setSelectedId(item.id)
    setEditQty(String(item.quantidade))
    if (item.categoria === 'tinta' && item.corTinta) setCorTinta(item.corTinta)
  }

  const salvarQuantidade = async () => {
    if (!selected) return
    const n = Number(editQty.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) {
      alert('Quantidade inválida')
      return
    }
    setSaving(true)
    try {
      await updateQuantidade(selected.id, n)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const ajustar = async (delta: number) => {
    if (!selected) return
    const atual = Number(editQty.replace(',', '.')) || 0
    const nova = Math.max(0, atual + delta)
    setEditQty(String(nova))
    setSaving(true)
    try {
      await updateQuantidade(selected.id, nova)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const adicionarItem = async () => {
    const nome = newNome.trim()
    if (!nome) {
      alert('Digite o nome do item')
      return
    }
    const id = `${categoria}-${Date.now()}`
    const item: InsumoItem = {
      id,
      categoria,
      nome,
      quantidade: 0,
      updatedAt: new Date().toISOString(),
    }
    setSaving(true)
    try {
      await upsertInsumo(item)
      setShowAdd(false)
      setNewNome('')
      setSelectedId(id)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao adicionar')
    } finally {
      setSaving(false)
    }
  }

  const removerItem = async () => {
    if (!selected || !confirm(`Remover "${selected.nome}"?`)) return
    setSaving(true)
    try {
      await deleteInsumo(selected.id)
      setSelectedId(null)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover')
    } finally {
      setSaving(false)
    }
  }

  const removerCorSelecionada = async () => {
    if (isTintaCorPadrao(corTinta)) return
    const nome = getTintaCorLabel(corTinta)
    if (
      !confirm(
        `Remover a cor «${nome}»?\n\nOs dois itens em estoque (${nome} gel e ${nome} relevo, em kg) serão excluídos. Para usar essa cor de novo, use «Nova cor».`
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await deleteInsumo(tintaItemId(corTinta, 'gel'))
      await deleteInsumo(tintaItemId(corTinta, 'relevo'))
      const r = removeTintaCorDoCatalogo(corTinta)
      if (!r.ok) {
        alert(r.message)
        return
      }
      setSelectedId(null)
      setCorTinta('preta')
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover a cor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <header className="page-header">
        <h1 className="text-white text-xl font-bold">Controle de insumos</h1>
        <p className="text-gray-400 text-xs mt-0.5">Cola, tinta, fita, emulsão, desgravador e solvente</p>
      </header>

      <div className="page-body max-w-3xl space-y-5">
        {/* Categorias */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INSUMO_CATEGORIAS.map(cat => {
            const m = getCategoriaMeta(cat.id)
            const active = categoria === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoria(cat.id)
                  setSelectedId(null)
                }}
                className={`rounded-2xl p-4 border text-left transition-all ${
                  active
                    ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">{categoriaIcon(cat.id)}</div>
                <p className="text-white font-semibold text-sm">{cat.label}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 capitalize">{m.unidade}</p>
                <p className="text-indigo-300 text-lg font-bold tabular-nums mt-1">
                  {loading ? '…' : totaisCategoria[cat.id].toLocaleString('pt-BR')}
                </p>
              </button>
            )
          })}
        </div>

        {/* Filtro de cor — só tinta */}
        {categoria === 'tinta' && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Cor da tinta</p>
              <button
                type="button"
                onClick={() => {
                  setShowNovaCor(true)
                  setNovaCorNome('')
                }}
                className="text-[11px] bg-violet-800/70 hover:bg-violet-700 text-violet-100 px-2.5 py-1 rounded-lg border border-violet-500/40 inline-flex items-center gap-1"
              >
                <Plus size={12} /> Nova cor
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tintaCoresCatalog.map(cor => {
                const amostra = getTintaVisualColor(cor.id, cor.label)
                const ativo = corTinta === cor.id
                return (
                  <button
                    key={cor.id}
                    type="button"
                    onClick={() => {
                      setCorTinta(cor.id)
                      setSelectedId(null)
                    }}
                    className={`inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-full text-sm font-medium transition-all border ${
                      ativo
                        ? 'bg-gray-800 ring-2 ring-indigo-400 border-indigo-500/60 shadow-md'
                        : 'bg-gray-800/90 border-gray-600 hover:border-gray-500 opacity-95 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full shrink-0 border-2 border-black/40 shadow-inner ring-1 ring-white/10"
                      style={{ backgroundColor: amostra }}
                      title={cor.label}
                      aria-hidden
                    />
                    <span className="text-white">{cor.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-gray-600 text-[10px] mt-2">
              Cada cor abre dois itens ao salvar estoque (sempre <strong className="text-gray-400">Gel</strong> e{' '}
              <strong className="text-gray-400">Relevo</strong>, em kg).
            </p>
            {!isTintaCorPadrao(corTinta) && (
              <div className="mt-3 flex flex-wrap gap-2 items-center justify-end">
                <button
                  type="button"
                  disabled={saving || loading}
                  onClick={() => void removerCorSelecionada()}
                  className="text-[11px] text-red-400/95 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-950/35"
                >
                  <Trash2 size={13} aria-hidden />
                  Remover esta cor do catálogo…
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 flex-wrap">
              {categoria === 'tinta' ? (
                <>
                  <span
                    className="w-6 h-6 rounded-full shrink-0 border-2 border-black/40 ring-1 ring-white/15 shadow-inner"
                    style={{ backgroundColor: getTintaVisualColor(corTinta, getTintaCorLabel(corTinta)) }}
                    title={getTintaCorLabel(corTinta)}
                    aria-hidden
                  />
                  <span>
                    {getTintaCorLabel(corTinta)} — Gel e Relevo
                  </span>
                </>
              ) : (
                meta.label
              )}
            </h2>
            {!categoriaFixa && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus size={14} />
                Novo item
              </button>
            )}
          </div>

          {isCategoriaItemUnico(categoria) && (
            <p className="text-gray-500 text-xs mb-3">
              Toque em <span className="text-white">{meta.label}</span> para alterar a quantidade (
              {meta.unidade}).
            </p>
          )}

          {loading ? (
            <p className="text-gray-500 text-sm py-8 text-center">Carregando…</p>
          ) : filtered.length === 0 && !categoriaFixa ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              Nenhum item nesta categoria. Toque em &quot;Novo item&quot; para cadastrar.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map(item => {
                const active = selectedId === item.id
                const u = getCategoriaMeta(item.categoria).unidade
                const alerta = alertaPorId(alertas, item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                        active
                          ? 'bg-indigo-950/50 border-indigo-500'
                          : alerta?.nivel === 'zerado'
                            ? 'bg-red-950/20 border-red-900/50 hover:border-red-800'
                            : alerta?.nivel === 'baixo'
                              ? 'bg-amber-950/15 border-amber-900/40 hover:border-amber-800'
                              : 'bg-gray-900/60 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium">{item.nome}</p>
                            {alerta && <InsumoAlertBadge nivel={alerta.nivel} />}
                          </div>
                          {item.categoria === 'tinta' && item.tipoTinta && (
                            <p className="text-violet-400/90 text-xs font-medium">
                              {getTintaTipoLabel(item.tipoTinta)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-white tabular-nums">
                            {item.quantidade.toLocaleString('pt-BR', {
                              maximumFractionDigits: u === 'kg' ? 2 : 0,
                            })}
                          </p>
                          <p className="text-gray-500 text-[10px]">{unidadeLabel(u, item.quantidade)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Painel de edição */}
        {selected && (
          <section className="bg-gradient-to-br from-indigo-950/40 to-gray-800 border border-indigo-500/30 rounded-2xl p-5 sticky bottom-4 shadow-xl">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Alterar estoque</p>
                <h3 className="text-white text-lg font-bold">{selected.nome}</h3>
                <p className="text-indigo-300 text-sm mt-0.5">
                  Em {unidadeLabel(meta.unidade, Number(editQty) || 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-gray-500 hover:text-white p-1"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => void ajustar(-stepQty)}
                className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Minus size={22} />
              </button>
              <input
                type="text"
                inputMode="decimal"
                value={editQty}
                onChange={e => setEditQty(e.target.value)}
                className="w-28 text-center text-3xl font-bold bg-gray-950 text-white rounded-xl py-3 border border-indigo-500/50 outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void ajustar(stepQty)}
                className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Plus size={22} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void salvarQuantidade()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              {!categoriaFixa && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removerItem()}
                  className="px-4 bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl hover:bg-red-900/40 disabled:opacity-50"
                  title="Remover item"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Modal novo item */}
        {showAdd && !categoriaFixa && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Novo item — {meta.label}</h3>
              <label className="text-gray-400 text-xs block mb-1">Nome</label>
              <input
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                placeholder={categoria === 'cola' ? 'Ex: Cola padrão' : 'Ex: Fita crepe'}
                className="w-full bg-gray-950 text-white rounded-xl p-3 border border-gray-700 mb-3 outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void adicionarItem()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {showNovaCor && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-semibold mb-1">Nova cor de tinta</h3>
              <p className="text-gray-500 text-xs mb-4">
                Serão criados automaticamente os estoques <span className="text-violet-300">Gel</span> e{' '}
                <span className="text-violet-300">Relevo</span> (kg) para essa cor.
              </p>
              <label className="text-gray-400 text-xs block mb-1">Nome da cor</label>
              <input
                value={novaCorNome}
                onChange={e => setNovaCorNome(e.target.value)}
                placeholder="Ex: Verde, Pink, Nude…"
                className="w-full bg-gray-950 text-white rounded-xl p-3 border border-gray-700 mb-3 outline-none focus:border-violet-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNovaCor(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving || !novaCorNome.trim()}
                  onClick={async () => {
                    const res = addTintaCorToCatalog(novaCorNome)
                    if (!res.ok) {
                      alert(res.message)
                      return
                    }
                    setShowNovaCor(false)
                    setNovaCorNome('')
                    setCorTinta(res.id)
                    setSelectedId(null)
                    setSaving(true)
                    try {
                      await refresh()
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-50"
                >
                  Adicionar cor
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 text-[10px] text-center pb-6">
          Tinta (kg) · Cola (tubos) · Fita, Desgravador (un.) · Emulsão (litros) · Solvente (latas)
        </p>
      </div>
    </div>
  )
}

export default Estoque
