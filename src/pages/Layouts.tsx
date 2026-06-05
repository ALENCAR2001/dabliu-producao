import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Eye,
  X,
  FileText,
  BadgeCheck,
  ChevronLeft,
  Shirt,
  Upload,
  Layers,
  Pencil,
  Sparkles,
  Database,
  HardDrive,
  Loader2,
  CloudUpload,
} from 'lucide-react'
import { DEMO_LAYOUTS } from '../data/demoLayouts'
import { useAuth } from '../hooks/useAuth'
import type { Layout, TipoModelo } from '../types/layout'
import { getTipoModeloLabel } from '../types/layout'
import {
  addCustomMarca,
  addCustomTipo,
  buildMarcaList,
  buildTipoList,
  loadLayoutCatalog,
  type TipoDef,
} from '../utils/layoutCatalog'
import { LayoutStatusQuickPicker } from '../components/LayoutStatusQuickPicker'
import { PdfViewerModal } from '../components/PdfViewerModal'
import {
  colecoesForMarcaTipo,
  createColecaoFromPdf,
  getColecaoPdf,
  type LayoutColecao,
} from '../utils/layoutColecaoStorage'
import {
  downloadColecaoPdfBytes,
  getLayoutsStorageMode,
  loadLayoutBundle,
  pushLocalLayoutsToCloud,
  removeColecaoFromCloud,
  removeLayoutFromCloud,
  syncLayoutBundle,
} from '../services/layoutCloudService'
import { getCloudSetupHint } from '../lib/supabase'
import { base64ToUint8Array, extractPdfPage, fileToBase64, getPdfPageCount } from '../utils/pdfUtils'

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

const DEFAULT_LAYOUTS: Layout[] = [
  {
    id: '1',
    marca: 'BRODEZ',
    tipoModelo: 'long-line',
    pdfPage: 1,
    nome: 'Long Line — Página 1',
    codigo: 'BRD-LL-001',
    corTecido: 'Preto',
    silk: 'Silk 100% Algodão',
    puff: 'Puff Simples',
    demaos: '2 demãos',
    alturaGola: '2cm',
    observacoes: 'Edite a cor e o código conforme o PDF',
    status: 'ativo',
    createdAt: new Date(),
  },
  {
    id: '2',
    marca: 'BRODEZ',
    tipoModelo: 'long-line',
    pdfPage: 2,
    nome: 'Long Line — Página 2',
    codigo: 'BRD-LL-002',
    corTecido: 'Off White',
    silk: 'Silk Premium',
    puff: 'Puff Duplo',
    demaos: '1 demão',
    alturaGola: '2cm',
    observacoes: '',
    status: 'ativo',
    createdAt: new Date(),
  },
]

function Layouts() {
  const { isAdmin, isFuncionario } = useAuth()
  const storageMode = getLayoutsStorageMode()
  const hydratedRef = useRef(false)

  const [layouts, setLayouts] = useState<Layout[]>([])
  const [colecoes, setColecoes] = useState<LayoutColecao[]>([])
  const [layoutCatalog, setLayoutCatalog] = useState(() => loadLayoutCatalog())
  const [cloudLoading, setCloudLoading] = useState(storageMode === 'database')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [newMarcaName, setNewMarcaName] = useState('')
  const [newTipoLabel, setNewTipoLabel] = useState('')
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewLayoutId, setViewLayoutId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [marcaFilter, setMarcaFilter] = useState<string>('todas')
  const [tipoFilter, setTipoFilter] = useState<TipoModelo | null>(null)
  const [colecaoFilter, setColecaoFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'todos' | Layout['status']>('todos')

  const [showImportModal, setShowImportModal] = useState(false)
  const [importPageCount, setImportPageCount] = useState(0)
  const [importFileName, setImportFileName] = useState('')
  const [pendingImportColecaoId, setPendingImportColecaoId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [renameModal, setRenameModal] = useState<{ id: string; nome: string } | null>(null)

  const [pdfViewer, setPdfViewer] = useState<{
    title: string
    loadPdf: () => Promise<Uint8Array | null>
  } | null>(null)

  const categoryFileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    marca: 'BRODEZ',
    tipoModelo: 'long-line' as TipoModelo,
    pdfPage: '' as string,
    nome: '',
    codigo: '',
    corTecido: '',
    silk: '',
    puff: '',
    demaos: '',
    alturaGola: '',
    observacoes: '',
    status: 'ativo' as Layout['status'],
  })

  useEffect(() => {
    let cancelled = false
    void loadLayoutBundle().then(bundle => {
      if (cancelled) return
      const useDefaults =
        bundle.layouts.length === 0 &&
        bundle.colecoes.length === 0 &&
        storageMode === 'local'
      setLayouts(useDefaults ? DEFAULT_LAYOUTS : bundle.layouts)
      setColecoes(bundle.colecoes)
      setLayoutCatalog(bundle.catalog)
      setCloudLoading(false)
      hydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [storageMode])

  useEffect(() => {
    if (!hydratedRef.current) return
    const timer = window.setTimeout(() => {
      setSyncing(true)
      void syncLayoutBundle({ layouts, colecoes, catalog: layoutCatalog })
        .then(() => setSyncError(null))
        .catch(e => setSyncError(e instanceof Error ? e.message : 'Erro ao sincronizar'))
        .finally(() => setSyncing(false))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [layouts, colecoes, layoutCatalog])

  const colecoesDoTipo = useMemo(() => {
    if (marcaFilter === 'todas' || !tipoFilter) return []
    return colecoesForMarcaTipo(colecoes, marcaFilter, tipoFilter)
  }, [colecoes, marcaFilter, tipoFilter])

  const currentColecao = useMemo(
    () => (colecaoFilter ? colecoes.find(c => c.id === colecaoFilter) : undefined),
    [colecoes, colecaoFilter]
  )

  const allMarcas = useMemo(
    () => buildMarcaList(layoutCatalog, layouts),
    [layoutCatalog, layouts]
  )

  const allTipos = useMemo(
    () => buildTipoList(layoutCatalog, layouts),
    [layoutCatalog, layouts]
  )

  const layoutsDaMarca = useMemo(() => {
    if (marcaFilter === 'todas') return []
    return layouts.filter(l => l.marca === marcaFilter)
  }, [layouts, marcaFilter])

  const contagemPorTipo = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of allTipos) counts[t.id] = 0
    for (const l of layoutsDaMarca) counts[l.tipoModelo] = (counts[l.tipoModelo] ?? 0) + 1
    return counts
  }, [layoutsDaMarca, allTipos])

  const filteredLayouts = useMemo(() => {
    if (marcaFilter === 'todas' || !tipoFilter || !colecaoFilter) return []
    const q = search.trim().toLowerCase()
    return layouts.filter(l => {
      const matchesMarca = l.marca === marcaFilter
      const matchesTipo = l.tipoModelo === tipoFilter
      const matchesColecao = l.colecaoId === colecaoFilter
      const matchesStatus = statusFilter === 'todos' ? true : l.status === statusFilter
      const matchesSearch =
        q.length === 0
          ? true
          : `${l.nome} ${l.codigo} ${l.corTecido} ${l.marca}`.toLowerCase().includes(q)
      return matchesMarca && matchesTipo && matchesColecao && matchesStatus && matchesSearch
    })
  }, [layouts, marcaFilter, tipoFilter, colecaoFilter, search, statusFilter])

  const getStatusColor = (status: Layout['status']) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-600'
      case 'producao':
        return 'bg-yellow-600'
      case 'finalizado':
        return 'bg-blue-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusLabel = (status: Layout['status']) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'producao':
        return 'Em produção'
      case 'finalizado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const selectMarca = (marca: string) => {
    setMarcaFilter(marca)
    setTipoFilter(null)
    setColecaoFilter(null)
    setSearch('')
  }

  const voltarParaMarcas = () => {
    setMarcaFilter('todas')
    setTipoFilter(null)
    setColecaoFilter(null)
    setSearch('')
  }

  const voltarParaTipos = () => {
    setTipoFilter(null)
    setColecaoFilter(null)
    setSearch('')
  }

  const voltarParaColecoes = () => {
    setColecaoFilter(null)
    setSearch('')
  }

  const selectColecao = (id: string) => {
    setColecaoFilter(id)
    setSearch('')
  }

  const openPdfForLayout = (layout: Layout) => {
    const col = layout.colecaoId ? colecoes.find(c => c.id === layout.colecaoId) : undefined
    if (!col || !getColecaoPdf(col)) {
      alert('Nenhum PDF nesta coleção. Importe um PDF na lista de coleções.')
      return
    }
    if (!layout.pdfPage) {
      alert('Este modelo não está ligado a uma página do PDF. Edite e informe o número da página.')
      return
    }
    setPdfViewer({
      title: `${layout.nome} — Página ${layout.pdfPage}`,
      loadPdf: async () => {
        const bytes = await downloadColecaoPdfBytes(col)
        if (!bytes) return null
        return extractPdfPage(bytes, layout.pdfPage! - 1)
      },
    })
  }

  const openColecaoPdf = (col: LayoutColecao) => {
    if (!getColecaoPdf(col)) return
    setPdfViewer({
      title: `${col.nome} — PDF completo`,
      loadPdf: async () => downloadColecaoPdfBytes(col),
    })
  }

  const openFullColecaoPdf = () => {
    if (!currentColecao) return
    openColecaoPdf(currentColecao)
  }

  const handleNewColecaoPdfUpload = async (file: File) => {
    if (marcaFilter === 'todas' || !tipoFilter) return
    setImporting(true)
    try {
      const base64 = await fileToBase64(file)
      const bytes = base64ToUint8Array(base64)
      const pageCount = await getPdfPageCount(bytes)

      const nova = createColecaoFromPdf({
        marca: marcaFilter,
        tipoModelo: tipoFilter,
        fileName: file.name,
        dataBase64: base64,
        pageCount,
      })
      setColecoes(prev => [nova, ...prev])
      setPendingImportColecaoId(nova.id)
      setImportFileName(file.name)
      setImportPageCount(pageCount)
      setShowImportModal(true)
    } catch {
      alert('Não foi possível ler o PDF. Verifique se o arquivo é válido.')
    } finally {
      setImporting(false)
    }
  }

  const confirmSplitIntoModels = () => {
    if (!pendingImportColecaoId || marcaFilter === 'todas' || !tipoFilter || importPageCount < 1) return

    const tipoLabel = getTipoModeloLabel(tipoFilter)
    const prefix = `${marcaFilter.slice(0, 3)}-${tipoFilter.slice(0, 2).toUpperCase()}`
    const seqBase = layouts.filter(l => l.marca === marcaFilter && l.tipoModelo === tipoFilter).length

    const newModels: Layout[] = Array.from({ length: importPageCount }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      marca: marcaFilter,
      tipoModelo: tipoFilter,
      colecaoId: pendingImportColecaoId,
      pdfPage: i + 1,
      nome: `${tipoLabel} — Cor / ref. ${i + 1}`,
      codigo: `${prefix}-${String(seqBase + i + 1).padStart(3, '0')}`,
      corTecido: '',
      silk: '',
      puff: '',
      demaos: '',
      alturaGola: '',
      observacoes: 'Preencha a cor e os dados desta página do PDF',
      status: 'ativo' as const,
      createdAt: new Date(),
    }))

    setLayouts(prev => [...newModels, ...prev])
    setShowImportModal(false)
    setPendingImportColecaoId(null)
    setColecaoFilter(pendingImportColecaoId)
  }

  const closeImportModal = (openColecao: boolean) => {
    const id = pendingImportColecaoId
    setShowImportModal(false)
    setPendingImportColecaoId(null)
    if (openColecao && id) setColecaoFilter(id)
  }

  const deleteColecao = (id: string) => {
    const col = colecoes.find(c => c.id === id)
    if (!confirm(`Excluir a coleção "${col?.nome}" e todos os modelos dela?`)) return
    setColecoes(prev => prev.filter(c => c.id !== id))
    setLayouts(prev => prev.filter(l => l.colecaoId !== id))
    if (colecaoFilter === id) setColecaoFilter(null)
    void removeColecaoFromCloud(id, col?.storagePath)
  }

  const openRenameColecao = (id: string) => {
    const col = colecoes.find(c => c.id === id)
    if (!col) return
    setRenameModal({ id, nome: col.nome })
  }

  const confirmRenameColecao = () => {
    if (!renameModal) return
    const nome = renameModal.nome.trim()
    if (!nome) return
    setColecoes(prev => prev.map(c => (c.id === renameModal.id ? { ...c, nome } : c)))
    setRenameModal(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pdfPage = formData.pdfPage ? parseInt(formData.pdfPage, 10) : undefined
    const pdfPageValid = pdfPage && !Number.isNaN(pdfPage) ? pdfPage : undefined

    if (editingId) {
      setLayouts(
        layouts.map(l =>
          l.id === editingId
            ? {
                ...l,
                marca: formData.marca.trim(),
                tipoModelo: formData.tipoModelo,
                pdfPage: pdfPageValid,
                nome: formData.nome,
                codigo: formData.codigo,
                corTecido: formData.corTecido,
                silk: formData.silk,
                puff: formData.puff,
                demaos: formData.demaos,
                alturaGola: formData.alturaGola,
                observacoes: formData.observacoes,
                status: formData.status,
              }
            : l
        )
      )
      if (viewLayoutId === editingId) setViewLayoutId(editingId)
    } else {
      const newLayout: Layout = {
        id: crypto.randomUUID(),
        marca: formData.marca.trim(),
        tipoModelo: formData.tipoModelo,
        colecaoId: colecaoFilter ?? undefined,
        pdfPage: pdfPageValid,
        nome: formData.nome,
        codigo: formData.codigo,
        corTecido: formData.corTecido,
        silk: formData.silk,
        puff: formData.puff,
        demaos: formData.demaos,
        alturaGola: formData.alturaGola,
        observacoes: formData.observacoes,
        status: formData.status,
        createdAt: new Date(),
      }
      setLayouts([newLayout, ...layouts])
    }
    closeFormModal()
  }

  const resetForm = () => {
    setFormData({
      marca: marcaFilter !== 'todas' ? marcaFilter : 'BRODEZ',
      tipoModelo: tipoFilter ?? 'long-line',
      pdfPage: '',
      nome: '',
      codigo: '',
      corTecido: '',
      silk: '',
      puff: '',
      demaos: '',
      alturaGola: '',
      observacoes: '',
      status: 'ativo',
    })
    setEditingId(null)
  }

  const closeFormModal = () => {
    setShowModal(false)
    setNewMarcaName('')
    setNewTipoLabel('')
    setCatalogError(null)
    resetForm()
  }

  const handleAddMarca = () => {
    setCatalogError(null)
    try {
      const { catalog, marca } = addCustomMarca(newMarcaName, layoutCatalog)
      setLayoutCatalog(catalog)
      setFormData(prev => ({ ...prev, marca }))
      setNewMarcaName('')
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'Não foi possível adicionar a marca.')
    }
  }

  const handleAddTipo = () => {
    setCatalogError(null)
    try {
      const { catalog, tipo } = addCustomTipo(newTipoLabel, layoutCatalog)
      setLayoutCatalog(catalog)
      setFormData(prev => ({ ...prev, tipoModelo: tipo.id }))
      setNewTipoLabel('')
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'Não foi possível adicionar o tipo.')
    }
  }

  const openEditLayout = (layout: Layout) => {
    setEditingId(layout.id)
    setViewLayoutId(null)
    setFormData({
      marca: layout.marca,
      tipoModelo: layout.tipoModelo,
      pdfPage: layout.pdfPage ? String(layout.pdfPage) : '',
      nome: layout.nome,
      codigo: layout.codigo,
      corTecido: layout.corTecido,
      silk: layout.silk,
      puff: layout.puff,
      demaos: layout.demaos,
      alturaGola: layout.alturaGola,
      observacoes: layout.observacoes,
      status: layout.status,
    })
    setShowModal(true)
  }

  const loadDemoExamples = () => {
    if (
      !confirm(
        'Carregar dados de exemplo? Isso substitui todos os modelos atuais por amostras (BRODEZ Long Line, Oversized, NOZES T-shirt).'
      )
    ) {
      return
    }
    setLayouts(DEMO_LAYOUTS.map(l => ({ ...l, createdAt: new Date() })))
    setMarcaFilter('BRODEZ')
    setTipoFilter('long-line')
    setSearch('')
  }

  const deleteLayout = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      setLayouts(layouts.filter(l => l.id !== id))
      void removeLayoutFromCloud(id)
    }
  }

  const forceCloudPush = async () => {
    setSyncing(true)
    const result = await pushLocalLayoutsToCloud()
    setSyncing(false)
    if (!result.ok) {
      setSyncError(result.message)
      return
    }
    setSyncError(null)
    const bundle = await loadLayoutBundle()
    setLayouts(bundle.layouts)
    setColecoes(bundle.colecoes)
    setLayoutCatalog(bundle.catalog)
    alert(result.message)
  }

  const setLayoutStatus = (id: string, status: Layout['status']) => {
    setLayouts(prev => prev.map(l => (l.id === id ? { ...l, status } : l)))
  }

  const viewLayout = viewLayoutId ? layouts.find(l => l.id === viewLayoutId) : null

  const openNewLayoutModal = () => {
    setEditingId(null)
    resetForm()
    setFormData(prev => ({
      ...prev,
      marca: marcaFilter !== 'todas' ? marcaFilter : 'BRODEZ',
      tipoModelo: tipoFilter ?? 'long-line',
      status: 'ativo',
    }))
    setShowModal(true)
  }

  return (
    <div>
      <header className="page-header">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-xl font-bold">Layouts</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {isFuncionario
                ? 'Consulte layouts e PDFs — busque por marca, tipo, coleção e cor.'
                : 'Cada PDF vira uma coleção nova (não apaga a anterior) → modelos por página.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              {storageMode === 'database' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                  <Database size={14} />
                  Nuvem
                  {syncing && <Loader2 size={12} className="animate-spin" />}
                </span>
              ) : (
                <span className="inline-flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/40 text-amber-200 border border-amber-700/40">
                    <HardDrive size={14} />
                    Local
                  </span>
                  <span className="text-amber-400/80 max-w-xs leading-snug">{getCloudSetupHint()}</span>
                </span>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              {storageMode === 'database' && (
                <button
                  type="button"
                  onClick={() => void forceCloudPush()}
                  disabled={syncing || cloudLoading}
                  className="bg-emerald-800 px-3 py-2 rounded-lg text-white hover:bg-emerald-700 flex items-center gap-2 text-sm disabled:opacity-50"
                  title="Enviar layouts e PDFs deste aparelho para a nuvem"
                >
                  <CloudUpload size={18} />
                  <span className="hidden sm:inline">Enviar nuvem</span>
                </button>
              )}
              <button
                onClick={loadDemoExamples}
                className="bg-gray-700 px-3 py-2 rounded-lg text-white hover:bg-gray-600 flex items-center gap-2 text-sm"
                type="button"
                title="Ver como fica com exemplos"
              >
                <Sparkles size={18} />
                <span className="hidden sm:inline">Ver exemplo</span>
              </button>
              <button
                onClick={openNewLayoutModal}
                className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700 flex items-center gap-2"
                type="button"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo modelo</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-body">
        {cloudLoading && (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
            <Loader2 className="animate-spin" size={24} />
            Carregando layouts da nuvem…
          </div>
        )}

        {!cloudLoading && syncError && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4 text-sm text-red-200">
            Sincronização: {syncError}. Verifique se rodou <code className="text-red-100">layouts_cloud.sql</code> no
            Supabase e se está logado.
          </div>
        )}

        {!cloudLoading && isAdmin && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 mb-4 text-sm text-amber-100/90">
            <strong>Como separar cada cor:</strong> o sistema consegue separar automaticamente quando{' '}
            <strong>cada cor/modelo está em uma página diferente</strong> do PDF. Se várias cores estão na mesma
            página, cadastre cada uma manualmente e indique o número da página.
          </div>
        )}

        {!cloudLoading && (
        <>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-300 mb-3">
            <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Marca → tipo → coleção (lote/semana) → modelos por cor/página.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={voltarParaMarcas}
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
                  onClick={voltarParaTipos}
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
                  onClick={voltarParaColecoes}
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
                <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white max-w-[12rem] truncate">
                  {currentColecao.nome}
                </span>
              </>
            )}
          </div>
        </div>

        {marcaFilter === 'todas' && (
          <div>
            <h2 className="text-white font-semibold mb-3">Selecione a marca</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allMarcas.map(marca => {
                const total = layouts.filter(l => l.marca === marca).length
                return (
                  <button
                    key={marca}
                    type="button"
                    onClick={() => selectMarca(marca)}
                    className="bg-gray-800 hover:bg-gray-700/80 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4 text-left"
                  >
                    <Shirt size={20} className="text-indigo-300 mb-3" />
                    <p className="text-white font-semibold">{marca}</p>
                    <p className="text-gray-500 text-xs mt-1">{total} modelos</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {marcaFilter !== 'todas' && !tipoFilter && (
          <div>
            <button type="button" onClick={voltarParaMarcas} className="flex items-center gap-1 text-gray-400 text-sm mb-4">
              <ChevronLeft size={18} /> Voltar
            </button>
            <h2 className="text-white font-semibold mb-4">{marcaFilter} — tipo de camisa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTipos.map((tipo: TipoDef) => {
                const count = contagemPorTipo[tipo.id] ?? 0
                const nColecoes = colecoesForMarcaTipo(colecoes, marcaFilter, tipo.id).length
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => {
                      setTipoFilter(tipo.id)
                      setColecaoFilter(null)
                      setSearch('')
                    }}
                    className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-5 text-left"
                  >
                    <p className="text-white font-semibold text-lg">{tipo.label}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {count} {count === 1 ? 'modelo' : 'modelos'}
                      {nColecoes > 0
                        ? ` · ${nColecoes} ${nColecoes === 1 ? 'coleção' : 'coleções'}`
                        : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {marcaFilter !== 'todas' && tipoFilter && !colecaoFilter && (
          <div>
            <button type="button" onClick={voltarParaTipos} className="flex items-center gap-1 text-gray-400 text-sm mb-4">
              <ChevronLeft size={18} /> Voltar para tipos
            </button>
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-3 mb-4 text-sm text-emerald-100/90">
              <strong>Coleções:</strong> cada PDF importado vira uma coleção nova. A da semana passada fica
              separada — nada é apagado ao adicionar outro PDF.
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-white font-semibold">
                {marcaFilter} · {getTipoModeloLabel(tipoFilter)} — coleções
              </h2>
              {isAdmin && (
                <>
                  <input
                    ref={categoryFileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) void handleNewColecaoPdfUpload(f)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    disabled={importing}
                    onClick={() => categoryFileRef.current?.click()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 shrink-0"
                  >
                    <Upload size={18} />
                    {importing ? 'Lendo PDF…' : 'Importar novo PDF (nova coleção)'}
                  </button>
                </>
              )}
            </div>
            {colecoesDoTipo.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <Layers className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-white font-semibold">Nenhuma coleção ainda</p>
                <p className="text-gray-400 text-sm mt-2">
                  Importe um PDF para criar a primeira coleção deste tipo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colecoesDoTipo.map(col => {
                  const modelos = layouts.filter(l => l.colecaoId === col.id)
                  return (
                    <div
                      key={col.id}
                      className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-4"
                    >
                      <button
                        type="button"
                        onClick={() => selectColecao(col.id)}
                        className="w-full text-left"
                      >
                        <p className="text-white font-semibold">{col.nome}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(col.createdAt).toLocaleDateString('pt-BR')}
                          {getColecaoPdf(col) ? ` · ${col.fileName} (${col.pageCount} pág.)` : ' · sem PDF'}
                        </p>
                        <p className="text-indigo-300 text-sm mt-2">
                          {modelos.length} {modelos.length === 1 ? 'modelo' : 'modelos'}
                        </p>
                      </button>
                      {isAdmin && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              openRenameColecao(col.id)
                            }}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Renomear
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              deleteColecao(col.id)
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Excluir coleção
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {marcaFilter !== 'todas' && tipoFilter && colecaoFilter && currentColecao && (
          <>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-white font-semibold truncate">{currentColecao.nome}</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {marcaFilter} · {getTipoModeloLabel(tipoFilter)}
                    {getColecaoPdf(currentColecao)
                      ? ` · ${currentColecao.fileName} (${currentColecao.pageCount} páginas)`
                      : ' · modelos sem PDF vinculado'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {getColecaoPdf(currentColecao) && (
                    <button
                      type="button"
                      onClick={openFullColecaoPdf}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
                    >
                      <FileText size={18} />
                      Ver PDF completo
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openRenameColecao(currentColecao.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Renomear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <button type="button" onClick={voltarParaColecoes} className="flex items-center gap-1 text-gray-400 text-sm">
                <ChevronLeft size={18} /> Voltar para coleções
              </button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 min-h-[44px]">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar cor, nome ou código…"
                    className="bg-transparent text-white flex-1 outline-none text-base min-w-0"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as Layout['status'] | 'todos')}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-base min-h-[44px] sm:min-w-[10rem]"
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="producao">Em produção</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-3">
              {filteredLayouts.length} {filteredLayouts.length === 1 ? 'modelo' : 'modelos'} — cada um com informações
              e PDF da sua página
            </p>

            {filteredLayouts.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <Layers className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-white font-semibold">Nenhum modelo ainda</p>
                <p className="text-gray-400 text-sm mt-2">
                  Importe um PDF na lista de coleções ou crie modelos manualmente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredLayouts.map(layout => (
                  <div
                    key={layout.id}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-indigo-500/30"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`w-4 h-4 rounded-full shrink-0 ${corDotClass(layout.corTecido || '')}`}
                            title={layout.corTecido || 'Cor'}
                          />
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-200 border border-indigo-700/40">
                            {layout.corTecido || 'Cor não informada'}
                          </span>
                          {layout.pdfPage && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-gray-400 border border-gray-700">
                              Pág. {layout.pdfPage}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                          <p className="text-gray-400 text-xs font-mono">#{layout.codigo}</p>
                          {isAdmin ? (
                            <LayoutStatusQuickPicker
                              status={layout.status}
                              onChange={s => setLayoutStatus(layout.id, s)}
                            />
                          ) : (
                            <span className={`${getStatusColor(layout.status)} text-white text-xs px-2 py-0.5 rounded-full w-fit`}>
                              {getStatusLabel(layout.status)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-semibold">{layout.nome}</h3>
                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-300">
                          <span>Silk: {layout.silk || '—'}</span>
                          <span>Puff: {layout.puff || '—'}</span>
                          <span>Demãos: {layout.demaos || '—'}</span>
                          <span>Gola: {layout.alturaGola || '—'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {currentColecao && getColecaoPdf(currentColecao) && layout.pdfPage && (
                          <button
                            type="button"
                            onClick={() => openPdfForLayout(layout)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                            title="Ver PDF desta cor/página"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openEditLayout(layout)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-amber-300"
                            title="Editar informações"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewLayoutId(layout.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => deleteLayout(layout.id)}
                            className="p-2 hover:bg-red-900/20 rounded-lg text-red-400"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>

      {renameModal && (
        <div className="modal-sheet z-[60]">
          <div className="modal-sheet-panel max-w-md p-5 sm:m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-bold">Renomear coleção</h2>
              <button type="button" onClick={() => setRenameModal(null)} aria-label="Fechar">
                <X size={22} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <label className="text-gray-300 text-sm block mb-1">Nome da coleção</label>
            <input
              type="text"
              value={renameModal.nome}
              onChange={e => setRenameModal({ ...renameModal, nome: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRenameColecao()
                if (e.key === 'Escape') setRenameModal(null)
              }}
              autoFocus
              placeholder="Ex.: Semana 12/05, Lote maio"
              className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-700 focus:border-indigo-500 outline-none"
            />
            <p className="text-gray-500 text-xs mt-2">
              Use um nome que identifique o lote (semana, cliente, pedido).
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setRenameModal(null)}
                className="flex-1 bg-gray-700 py-2.5 rounded-lg text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRenameColecao}
                disabled={!renameModal.nome.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 rounded-lg text-white font-semibold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: separar PDF por páginas */}
      {showImportModal && (
        <div className="modal-sheet z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 p-5">
            <h2 className="text-white text-lg font-bold">Nova coleção</h2>
            <p className="text-gray-400 text-sm mt-2">
              O arquivo <span className="text-gray-200">{importFileName}</span> tem{' '}
              <strong className="text-white">{importPageCount} páginas</strong>.
            </p>
            <p className="text-emerald-200/90 text-sm mt-3">
              Os modelos das coleções antigas <strong>não serão apagados</strong>. Este PDF vira uma coleção
              separada.
            </p>
            <p className="text-gray-300 text-sm mt-3">
              Criar <strong>{importPageCount} modelos novos</strong> (um por página)? Depois preencha a cor de cada
              um.
            </p>
            <p className="text-amber-200/80 text-xs mt-3">
              Funciona melhor quando cada cor está em uma página separada no PDF.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => closeImportModal(true)}
                className="flex-1 bg-gray-700 py-2 rounded-lg text-white"
              >
                Só guardar coleção
              </button>
              <button
                type="button"
                onClick={confirmSplitIntoModels}
                className="flex-1 bg-indigo-600 py-2 rounded-lg text-white font-semibold"
              >
                Criar {importPageCount} modelos
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLayout && (
        <div className="modal-sheet z-50">
          <div className="modal-sheet-panel max-w-2xl sm:m-4">
            <div className="p-4 border-b border-gray-700 flex justify-between sticky top-0 bg-gray-800">
              <div>
                <h2 className="text-white font-bold">{viewLayout.nome}</h2>
                <p className="text-gray-400 text-xs">
                  {viewLayout.marca} · {getTipoModeloLabel(viewLayout.tipoModelo)}
                  {viewLayout.pdfPage ? ` · Página ${viewLayout.pdfPage}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openEditLayout(viewLayout)}
                    className="text-amber-300 hover:text-amber-200 p-1"
                    title="Editar"
                  >
                    <Pencil size={22} />
                  </button>
                )}
                <button type="button" onClick={() => setViewLayoutId(null)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-gray-400 text-sm font-mono">#{viewLayout.codigo}</p>
                {isAdmin ? (
                  <LayoutStatusQuickPicker
                    status={viewLayout.status}
                    onChange={s => {
                      setLayoutStatus(viewLayout.id, s)
                    }}
                  />
                ) : (
                  <span className={`${getStatusColor(viewLayout.status)} text-white text-xs px-2 py-0.5 rounded-full`}>
                    {getStatusLabel(viewLayout.status)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {viewLayout.colecaoId &&
                  getColecaoPdf(colecoes.find(c => c.id === viewLayout.colecaoId)) &&
                  viewLayout.pdfPage && (
                  <button
                    type="button"
                    onClick={() => openPdfForLayout(viewLayout)}
                    className="bg-indigo-600 px-4 py-2 rounded-lg text-white text-sm inline-flex items-center gap-2"
                  >
                    <FileText size={18} />
                    Ver PDF desta cor (página {viewLayout.pdfPage})
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Cor:</span>{' '}
                  <span className="text-white">{viewLayout.corTecido || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Código:</span>{' '}
                  <span className="text-white">#{viewLayout.codigo}</span>
                </div>
                <div>
                  <span className="text-gray-500">Silk:</span> <span className="text-white">{viewLayout.silk || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Puff:</span> <span className="text-white">{viewLayout.puff || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Demãos:</span>{' '}
                  <span className="text-white">{viewLayout.demaos || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gola:</span>{' '}
                  <span className="text-white">{viewLayout.alturaGola || '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Obs.:</span>{' '}
                  <span className="text-white">{viewLayout.observacoes || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && isAdmin && (
        <div className="modal-sheet z-50">
          <div className="modal-sheet-panel max-w-lg sm:m-4">
            <div className="p-4 border-b border-gray-700 flex justify-between sticky top-0 bg-gray-800">
              <h2 className="text-white font-bold">{editingId ? 'Editar modelo' : 'Novo modelo'}</h2>
              <button type="button" onClick={closeFormModal}>
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {catalogError && (
                <p className="text-red-300 text-sm bg-red-900/40 border border-red-700/50 rounded-lg p-2">
                  {catalogError}
                </p>
              )}
              <div>
                <label className="text-gray-300 text-sm">Marca *</label>
                <select
                  value={formData.marca}
                  onChange={e => setFormData({ ...formData, marca: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                >
                  {allMarcas.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newMarcaName}
                    onChange={e => setNewMarcaName(e.target.value)}
                    placeholder="Nova marca (ex: MINHA MARCA)"
                    className="flex-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddMarca}
                    className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Tipo de camisa *</label>
                <select
                  value={formData.tipoModelo}
                  onChange={e => setFormData({ ...formData, tipoModelo: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                >
                  {allTipos.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newTipoLabel}
                    onChange={e => setNewTipoLabel(e.target.value)}
                    placeholder="Novo tipo (ex: Regata, Manga Longa…)"
                    className="flex-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTipo}
                    className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Nº da página no PDF (se importou)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.pdfPage}
                  onChange={e => setFormData({ ...formData, pdfPage: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                  placeholder="Ex: 3"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Nome *</label>
                <input
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Código *</label>
                <input
                  required
                  value={formData.codigo}
                  onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Cor do tecido *</label>
                <input
                  required
                  value={formData.corTecido}
                  onChange={e => setFormData({ ...formData, corTecido: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                  placeholder="Ex: Preto, Off White, Azul…"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Silk</label>
                <input
                  value={formData.silk}
                  onChange={e => setFormData({ ...formData, silk: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Puff</label>
                <input
                  value={formData.puff}
                  onChange={e => setFormData({ ...formData, puff: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Demãos</label>
                <input
                  value={formData.demaos}
                  onChange={e => setFormData({ ...formData, demaos: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Altura da gola</label>
                <input
                  value={formData.alturaGola}
                  onChange={e => setFormData({ ...formData, alturaGola: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full mt-1 bg-gray-900 text-white rounded-lg p-2 border border-gray-700 resize-none"
                  rows={2}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 py-2 rounded-lg text-white font-semibold">
                {editingId ? 'Salvar alterações' : 'Cadastrar modelo'}
              </button>
            </form>
          </div>
        </div>
      )}

      <PdfViewerModal
        open={!!pdfViewer}
        title={pdfViewer?.title ?? ''}
        loadPdf={pdfViewer?.loadPdf ?? (async () => null)}
        onClose={() => setPdfViewer(null)}
      />
    </div>
  )
}

export default Layouts
