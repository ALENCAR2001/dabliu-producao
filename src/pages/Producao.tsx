import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Database,
  Download,
  Factory,
  HardDrive,
  History,
  Layers,
  RefreshCw,
  Save,
  Search,
  Shirt,
  Trash2,
} from 'lucide-react'
import type { TipoModelo } from '../types/layout'
import { getTipoModeloLabel } from '../types/layout'
import { loadLayouts } from '../utils/layoutStorage'
import {
  buildMarcaList,
  buildTipoList,
  loadLayoutCatalog,
} from '../utils/layoutCatalog'
import {
  colecoesForMarcaTipo,
  loadColecoes,
  migrateLayoutsToColecoes,
} from '../utils/layoutColecaoStorage'
import { PRODUCAO_SIZES, type ProducaoEntry, type ProducaoSize } from '../utils/productionStorage'
import {
  createProducaoEntry,
  deleteProducaoEntry,
  getStorageMode,
  listProducaoEntries,
  migrateLocalProducaoToDatabase,
} from '../services/productionService'
import { loadProducao } from '../utils/productionStorage'
import { useAuth } from '../hooks/useAuth'
import { monthLabel } from '../utils/calendar'
import { filterEntriesByMonth } from '../utils/exportCsv'
import { exportProducaoCsv } from '../utils/exportRelatorios'

function emptyQuantidades(): Record<ProducaoSize, number> {
  return PRODUCAO_SIZES.reduce((acc, s) => {
    acc[s] = 0
    return acc
  }, {} as Record<ProducaoSize, number>)
}

function parseQty(value: string): number {
  const n = Number(value.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function corDotClass(cor: string): string {
  const c = cor.toLowerCase()
  if (c.includes('preto') || c.includes('black')) return 'bg-zinc-900 ring-1 ring-gray-500'
  if (c.includes('branco') || c.includes('white') || c.includes('off')) return 'bg-stone-100 ring-1 ring-gray-400'
  if (c.includes('azul') || c.includes('marinho')) return 'bg-blue-900 ring-1 ring-blue-600'
  if (c.includes('vermelho') || c.includes('red')) return 'bg-red-700 ring-1 ring-red-500'
  if (c.includes('verde')) return 'bg-green-800 ring-1 ring-green-600'
  if (c.includes('bege')) return 'bg-amber-200 ring-1 ring-amber-400'
  if (c.includes('grafite') || c.includes('cinza')) return 'bg-gray-600 ring-1 ring-gray-500'
  return 'bg-indigo-600 ring-1 ring-indigo-400'
}

let cachedInitialProducaoLayoutState: ReturnType<typeof migrateLayoutsToColecoes> | undefined

function getInitialProducaoLayoutState() {
  cachedInitialProducaoLayoutState ??= migrateLayoutsToColecoes(loadLayouts(), loadColecoes())
  return cachedInitialProducaoLayoutState
}

function Producao() {
  const { isAdmin, isFuncionario } = useAuth()
  const storageMode = getStorageMode()
  const layoutCatalog = useMemo(() => loadLayoutCatalog(), [])

  const { layouts, colecoes } = useMemo(() => getInitialProducaoLayoutState(), [])

  const [tab, setTab] = useState<'fechar' | 'historico'>('fechar')
  const [marcaFilter, setMarcaFilter] = useState<string>('todas')
  const [tipoFilter, setTipoFilter] = useState<TipoModelo | null>(null)
  const [colecaoFilter, setColecaoFilter] = useState<string | null>(null)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [histSearch, setHistSearch] = useState('')

  const [quantidades, setQuantidades] = useState<Record<ProducaoSize, number>>(emptyQuantidades)
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [historico, setHistorico] = useState<ProducaoEntry[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histError, setHistError] = useState<string | null>(null)
  const [migrating, setMigrating] = useState(false)

  const allMarcas = useMemo(() => buildMarcaList(layoutCatalog, layouts), [layoutCatalog, layouts])
  const allTipos = useMemo(() => buildTipoList(layoutCatalog, layouts), [layoutCatalog, layouts])

  const colecoesDoTipo = useMemo(() => {
    if (marcaFilter === 'todas' || !tipoFilter) return []
    return colecoesForMarcaTipo(colecoes, marcaFilter, tipoFilter)
  }, [colecoes, marcaFilter, tipoFilter])

  const currentColecao = useMemo(
    () => (colecaoFilter ? colecoes.find(c => c.id === colecaoFilter) : undefined),
    [colecoes, colecaoFilter]
  )

  const modelosDaColecao = useMemo(() => {
    if (!colecaoFilter) return []
    const q = search.trim().toLowerCase()
    return layouts
      .filter(l => l.colecaoId === colecaoFilter)
      .filter(l => {
        if (!q) return true
        return `${l.nome} ${l.codigo} ${l.corTecido}`.toLowerCase().includes(q)
      })
  }, [layouts, colecaoFilter, search])

  const selectedLayout = useMemo(
    () => (selectedLayoutId ? layouts.find(l => l.id === selectedLayoutId) ?? null : null),
    [layouts, selectedLayoutId]
  )

  const contagemPorTipo = useMemo(() => {
    if (marcaFilter === 'todas') return {} as Record<string, number>
    const counts: Record<string, number> = {}
    for (const t of allTipos) counts[t.id] = 0
    for (const l of layouts.filter(l => l.marca === marcaFilter)) {
      counts[l.tipoModelo] = (counts[l.tipoModelo] ?? 0) + 1
    }
    return counts
  }, [layouts, marcaFilter, allTipos])

  const total = useMemo(() => PRODUCAO_SIZES.reduce((sum, s) => sum + (quantidades[s] || 0), 0), [quantidades])

  const refreshHistorico = useCallback(async () => {
    setHistLoading(true)
    setHistError(null)
    try {
      setHistorico(await listProducaoEntries())
    } catch (e) {
      setHistError(e instanceof Error ? e.message : 'Erro ao carregar histórico')
    } finally {
      setHistLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab !== 'historico') return
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      await refreshHistorico()
    })
    return () => {
      cancelled = true
    }
  }, [tab, refreshHistorico])

  const historicoFiltrado = useMemo(() => {
    const q = histSearch.trim().toLowerCase()
    if (!q) return historico
    return historico.filter(
      e =>
        `${e.marca} ${e.tipoModeloLabel} ${e.nome} ${e.codigo} ${e.corTecido}`.toLowerCase().includes(q)
    )
  }, [historico, histSearch])

  const resumoHoje = useMemo(() => {
    const hoje = new Date().toDateString()
    const deHoje = historico.filter(e => new Date(e.createdAt).toDateString() === hoje)
    return {
      fechamentos: deHoje.length,
      pecas: deHoje.reduce((s, e) => s + e.total, 0),
    }
  }, [historico])

  const resetContagem = () => {
    setQuantidades(emptyQuantidades())
    setObs('')
    setSaveSuccess(false)
    setFormError(null)
  }

  const voltarMarcas = () => {
    setMarcaFilter('todas')
    setTipoFilter(null)
    setColecaoFilter(null)
    setSelectedLayoutId(null)
    setSearch('')
    resetContagem()
  }

  const voltarTipos = () => {
    setTipoFilter(null)
    setColecaoFilter(null)
    setSelectedLayoutId(null)
    setSearch('')
    resetContagem()
  }

  const voltarColecoes = () => {
    setColecaoFilter(null)
    setSelectedLayoutId(null)
    setSearch('')
    resetContagem()
  }

  const voltarModelos = () => {
    setSelectedLayoutId(null)
    resetContagem()
  }

  const selectModelo = (id: string) => {
    setSelectedLayoutId(id)
    resetContagem()
  }

  const salvarFechamento = async () => {
    if (!selectedLayout) return
    if (total <= 0) {
      setFormError('Digite pelo menos uma quantidade para salvar.')
      return
    }

    setSaving(true)
    setSaveSuccess(false)
    setFormError(null)
    try {
      await createProducaoEntry({
        layoutId: selectedLayout.id,
        marca: selectedLayout.marca,
        tipoModelo: selectedLayout.tipoModelo,
        tipoModeloLabel: getTipoModeloLabel(selectedLayout.tipoModelo),
        nome: selectedLayout.nome,
        codigo: selectedLayout.codigo,
        corTecido: selectedLayout.corTecido,
        quantidades,
        total,
        observacoes: obs.trim() ? obs.trim() : undefined,
      })
      resetContagem()
      setSaveSuccess(true)
      await refreshHistorico()
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar fechamento')
    } finally {
      setSaving(false)
    }
  }

  const excluirFechamento = async (id: string) => {
    if (!confirm('Excluir este fechamento do histórico?')) return
    try {
      await deleteProducaoEntry(id)
      await refreshHistorico()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const migrarLocal = async () => {
    const qtd = loadProducao().length
    if (qtd === 0) {
      alert('Não há fechamentos locais para enviar.')
      return
    }
    if (!confirm(`Enviar ${qtd} fechamento(s) do navegador para o banco de dados?`)) return
    setMigrating(true)
    try {
      const n = await migrateLocalProducaoToDatabase()
      alert(`${n} fechamento(s) migrados com sucesso.`)
      await refreshHistorico()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro na migração')
    } finally {
      setMigrating(false)
    }
  }

  const breadcrumb = (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 mb-4">
      <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
        <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
        <span>Marca → tipo → coleção → modelo → contagem</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={voltarMarcas}
          className={`px-3 py-1.5 rounded-lg ${
            marcaFilter === 'todas' ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-300 border border-gray-700'
          }`}
        >
          Marcas
        </button>
        {marcaFilter !== 'todas' && (
          <>
            <span className="text-gray-600">/</span>
            <button
              type="button"
              onClick={voltarTipos}
              className={`px-3 py-1.5 rounded-lg ${
                !tipoFilter ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-300 border border-gray-700'
              }`}
            >
              {marcaFilter}
            </button>
          </>
        )}
        {tipoFilter && (
          <>
            <span className="text-gray-600">/</span>
            <button
              type="button"
              onClick={voltarColecoes}
              className={`px-3 py-1.5 rounded-lg ${
                !colecaoFilter ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-300 border border-gray-700'
              }`}
            >
              {getTipoModeloLabel(tipoFilter)}
            </button>
          </>
        )}
        {colecaoFilter && currentColecao && (
          <>
            <span className="text-gray-600">/</span>
            <button
              type="button"
              onClick={voltarModelos}
              className={`px-3 py-1.5 rounded-lg max-w-[11rem] truncate ${
                !selectedLayoutId ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-300 border border-gray-700'
              }`}
            >
              {currentColecao.nome}
            </button>
          </>
        )}
        {selectedLayout && (
          <>
            <span className="text-gray-600">/</span>
            <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white max-w-[10rem] truncate">
              {selectedLayout.corTecido || selectedLayout.nome}
            </span>
          </>
        )}
      </div>
    </div>
  )

  const painelContagem = selectedLayout && (
    <div className="bg-gray-800 border border-indigo-500/40 rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <h2 className="text-white font-semibold">Contagem por tamanho</h2>
          </div>
          <p className="text-white font-semibold text-lg truncate">{selectedLayout.nome}</p>
          <p className="text-gray-400 text-sm mt-0.5">
            #{selectedLayout.codigo} · {selectedLayout.corTecido || 'Cor não informada'}
          </p>
        </div>
        <button
          type="button"
          disabled={saving || total <= 0}
          onClick={() => void salvarFechamento()}
          className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white min-h-[48px] px-5 py-2.5 rounded-lg font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Save size={18} />
          {saving ? 'Salvando…' : 'Salvar fechamento'}
        </button>
      </div>

      {formError && (
        <p className="text-red-300 text-sm bg-red-900/40 border border-red-700/50 rounded-lg px-3 py-2 mb-4">
          {formError}
        </p>
      )}

      {saveSuccess && (
        <p className="text-emerald-300 text-sm bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2 mb-4">
          Fechamento salvo com sucesso. Pode registrar outro modelo da mesma coleção.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {PRODUCAO_SIZES.map(size => (
          <label
            key={size}
            className="bg-gray-900 border border-gray-700 rounded-xl p-2 sm:p-3 flex flex-col items-center gap-1.5"
          >
            <span className="text-gray-300 font-bold text-sm">{size}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={quantidades[size] || ''}
              onChange={e =>
                setQuantidades(prev => ({ ...prev, [size]: parseQty(e.target.value) }))
              }
              className="w-full bg-gray-800 text-white text-center text-xl rounded-lg p-3 min-h-[48px] border border-gray-600 focus:border-indigo-500 outline-none"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-700 pt-3 mb-3">
        <span className="text-gray-300 font-medium">Total de peças</span>
        <span className="text-white text-3xl font-bold">{total}</span>
      </div>

      <textarea
        value={obs}
        onChange={e => setObs(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="w-full bg-gray-900 text-white rounded-lg p-2 border border-gray-700 resize-none text-sm"
      />
    </div>
  )

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-white text-xl font-bold flex items-center gap-2">
              <Factory size={22} className="text-indigo-300" />
              Produção
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {isFuncionario
                ? 'Navegue como em Layouts e feche a contagem do modelo.'
                : 'Fechamento por modelo e histórico para relatórios.'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 text-xs shrink-0">
              {storageMode === 'database' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                  <Database size={14} />
                  Nuvem
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/40 text-amber-200 border border-amber-700/40">
                  <HardDrive size={14} />
                  Local
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-0 lg:mt-4">
          <button
            type="button"
            onClick={() => setTab('fechar')}
            className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${
              tab === 'fechar' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <ClipboardList size={16} />
            Fechar contagem
          </button>
          <button
            type="button"
            onClick={() => setTab('historico')}
            className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${
              tab === 'historico' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <History size={16} />
            Histórico
            {historico.length > 0 && (
              <span className="bg-gray-900/50 px-1.5 py-0.5 rounded text-xs">{historico.length}</span>
            )}
          </button>
        </div>
      </header>

      {tab === 'fechar' && (
        <div className="page-body">
          {breadcrumb}

          {layouts.length === 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <Layers className="mx-auto text-gray-500 mb-3" size={40} />
              <p className="text-white font-semibold">Nenhum modelo cadastrado</p>
              <p className="text-gray-400 text-sm mt-2">Cadastre layouts e importe PDFs na aba Layouts primeiro.</p>
            </div>
          )}

          {layouts.length > 0 && marcaFilter === 'todas' && (
            <div>
              <h2 className="text-white font-semibold mb-3">Selecione a marca</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {allMarcas.map(marca => {
                  const totalModelos = layouts.filter(l => l.marca === marca).length
                  return (
                    <button
                      key={marca}
                      type="button"
                      onClick={() => {
                        setMarcaFilter(marca)
                        setTipoFilter(null)
                        setColecaoFilter(null)
                        setSelectedLayoutId(null)
                      }}
                      className="bg-gray-800 hover:bg-gray-700/80 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 text-left"
                    >
                      <Shirt size={20} className="text-indigo-300 mb-3" />
                      <p className="text-white font-semibold">{marca}</p>
                      <p className="text-gray-500 text-xs mt-1">{totalModelos} modelos</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {marcaFilter !== 'todas' && !tipoFilter && (
            <div>
              <button type="button" onClick={voltarMarcas} className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                <ChevronLeft size={18} /> Voltar
              </button>
              <h2 className="text-white font-semibold mb-4">{marcaFilter} — tipo de camisa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTipos
                  .filter(t => layouts.some(l => l.marca === marcaFilter && l.tipoModelo === t.id))
                  .map(tipo => (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => {
                        setTipoFilter(tipo.id)
                        setColecaoFilter(null)
                        setSelectedLayoutId(null)
                      }}
                      className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-5 text-left"
                    >
                      <p className="text-white font-semibold text-lg">{tipo.label}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {contagemPorTipo[tipo.id] ?? 0} modelos ·{' '}
                        {colecoesForMarcaTipo(colecoes, marcaFilter, tipo.id).length} coleções
                      </p>
                    </button>
                  ))}
              </div>
              {allTipos.filter(t => layouts.some(l => l.marca === marcaFilter && l.tipoModelo === t.id)).length ===
                0 && (
                <p className="text-gray-400 text-sm">Nenhum modelo desta marca. Cadastre em Layouts.</p>
              )}
            </div>
          )}

          {marcaFilter !== 'todas' && tipoFilter && !colecaoFilter && (
            <div>
              <button type="button" onClick={voltarTipos} className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                <ChevronLeft size={18} /> Voltar
              </button>
              <h2 className="text-white font-semibold mb-4">
                {marcaFilter} · {getTipoModeloLabel(tipoFilter)} — coleção
              </h2>
              {colecoesDoTipo.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                  <p className="text-white font-semibold">Nenhuma coleção</p>
                  <p className="text-gray-400 text-sm mt-2">Importe um PDF em Layouts para esta marca e tipo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colecoesDoTipo.map(col => {
                    const n = layouts.filter(l => l.colecaoId === col.id).length
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setColecaoFilter(col.id)
                          setSelectedLayoutId(null)
                          setSearch('')
                          resetContagem()
                        }}
                        className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 text-left"
                      >
                        <p className="text-white font-semibold">{col.nome}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(col.createdAt).toLocaleDateString('pt-BR')} · {n}{' '}
                          {n === 1 ? 'modelo' : 'modelos'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {marcaFilter !== 'todas' && tipoFilter && colecaoFilter && currentColecao && (
            <div className={selectedLayoutId ? 'pb-28 lg:pb-0' : undefined}>
              <button
                type="button"
                onClick={voltarColecoes}
                className="flex items-center gap-1 text-gray-400 text-sm mb-4"
              >
                <ChevronLeft size={18} /> Voltar para coleções
              </button>

              <div className="mb-4">
                <h2 className="text-white font-semibold truncate">{currentColecao.nome}</h2>
                <p className="text-gray-400 text-sm">
                  {marcaFilter} · {getTipoModeloLabel(tipoFilter)} — escolha o modelo e informe as quantidades
                </p>
              </div>

              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 min-h-[44px]">
                <Search size={18} className="text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar cor, nome ou código…"
                  className="bg-transparent text-white flex-1 outline-none text-sm"
                />
              </div>

              {modelosDaColecao.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
                  <p className="text-gray-400 text-sm">Nenhum modelo nesta coleção.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modelosDaColecao.map(layout => {
                    const selected = layout.id === selectedLayoutId
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectModelo(layout.id)}
                        className={`text-left rounded-xl border p-4 transition-colors ${
                          selected
                            ? 'border-indigo-500 bg-indigo-900/25 ring-1 ring-indigo-500/50'
                            : 'border-gray-700 bg-gray-800 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`w-4 h-4 rounded-full shrink-0 ${corDotClass(layout.corTecido || '')}`}
                          />
                          <span className="text-xs text-indigo-200">{layout.corTecido || 'Cor não informada'}</span>
                          {layout.pdfPage && (
                            <span className="text-xs text-gray-500">pág. {layout.pdfPage}</span>
                          )}
                        </div>
                        <p className="text-white font-semibold">{layout.nome}</p>
                        <p className="text-gray-500 text-xs mt-0.5">#{layout.codigo}</p>
                        {selected && (
                          <p className="text-emerald-400 text-xs mt-2 font-medium">● Selecionado — use o painel de contagem</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {painelContagem}
            </div>
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div className="page-body space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs">Fechamentos hoje</p>
              <p className="text-white text-2xl font-bold mt-1">{resumoHoje.fechamentos}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs">Peças hoje</p>
              <p className="text-white text-2xl font-bold mt-1">{resumoHoje.pecas}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-gray-400 text-xs">Total registrado</p>
              <p className="text-white text-2xl font-bold mt-1">{historico.length}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1">
              <Search size={18} className="text-gray-400" />
              <input
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                placeholder="Buscar marca, modelo, cor, código…"
                className="bg-transparent text-white flex-1 outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => void refreshHistorico()}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={histLoading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const n = new Date()
                  exportProducaoCsv(
                    filterEntriesByMonth(historico, n.getFullYear(), n.getMonth()),
                    monthLabel(n.getFullYear(), n.getMonth())
                  )
                }}
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Exportar mês
              </button>
            )}
            {isAdmin && storageMode === 'database' && loadProducao().length > 0 && (
              <button
                type="button"
                disabled={migrating}
                onClick={() => void migrarLocal()}
                className="bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm"
              >
                {migrating ? 'Enviando…' : 'Enviar local → nuvem'}
              </button>
            )}
          </div>

          {histError && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 rounded-xl p-3 text-sm">{histError}</div>
          )}

          {histLoading && historico.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Carregando histórico…</p>
          ) : historicoFiltrado.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <History className="mx-auto text-gray-500 mb-3" size={40} />
              <p className="text-white font-semibold">Nenhum fechamento</p>
              <p className="text-gray-400 text-sm mt-2">Use &quot;Fechar contagem&quot; para registrar produção.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historicoFiltrado.map(entry => (
                <div
                  key={entry.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs">{formatDateTime(entry.createdAt)}</p>
                    <p className="text-xs text-indigo-300 mt-1">
                      {entry.marca} · {entry.tipoModeloLabel}
                    </p>
                    <p className="text-white font-semibold mt-0.5 truncate">
                      {entry.nome} — {entry.corTecido || '—'}
                    </p>
                    <p className="text-gray-500 text-xs">#{entry.codigo}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PRODUCAO_SIZES.map(s => (
                        <span
                          key={s}
                          className="text-xs bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-gray-300"
                        >
                          {s}: <strong className="text-white">{entry.quantidades[s] ?? 0}</strong>
                        </span>
                      ))}
                    </div>
                    {entry.observacoes && (
                      <p className="text-gray-500 text-xs mt-2">Obs.: {entry.observacoes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-white text-2xl font-bold">{entry.total}</p>
                      <p className="text-gray-500 text-xs">peças</p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => void excluirFechamento(entry.id)}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Producao
