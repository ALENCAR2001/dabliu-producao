import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'
import { copyBytes, renderPdfToContainer, shouldUseNativePdfViewer } from '../utils/pdfJsViewer'

type PdfViewerModalProps = {
  open: boolean
  title: string
  loadPdf: () => Promise<Uint8Array | null>
  onClose: () => void
}

export function PdfViewerModal({ open, title, loadPdf, onClose }: PdfViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [openUrl, setOpenUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const useNativeViewer = shouldUseNativePdfViewer()

  useEffect(() => {
    if (open) return
    void Promise.resolve().then(() => {
      setOpenUrl(prev => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
      setError(null)
      setLoading(false)
      containerRef.current?.replaceChildren()
    })
  }, [open])

  useEffect(() => {
    if (!open) return

    const container = containerRef.current
    if (!container && !useNativeViewer) return

    const abort = new AbortController()
    let objectUrl: string | null = null

    void Promise.resolve().then(async () => {
      setLoading(true)
      setError(null)
      container?.replaceChildren()

      try {
        const bytes = await loadPdf()
        if (abort.signal.aborted) return
        if (!bytes || bytes.length === 0) {
          setError('PDF não encontrado ou vazio.')
          return
        }

        const safeBytes = copyBytes(bytes)
        const blob = new Blob([Uint8Array.from(safeBytes)], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        setOpenUrl(objectUrl)

        if (!useNativeViewer && container) {
          await renderPdfToContainer(container, bytes, abort.signal)
        }
      } catch {
        if (!abort.signal.aborted) {
          setError('Não foi possível abrir o PDF neste dispositivo.')
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false)
      }
    })

    return () => {
      abort.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, loadPdf, useNativeViewer])

  if (!open) return null

  return (
    <div
      className="modal-sheet z-[60]"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-sheet-panel max-w-5xl sm:m-4 h-[92dvh] sm:h-[90vh] flex flex-col">
        <div className="p-3 sm:p-4 border-b border-gray-700 flex justify-between items-center gap-2 shrink-0">
          <h2 className="text-white font-semibold truncate pr-2 text-sm sm:text-base">{title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            {openUrl && (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target text-indigo-300 hover:text-indigo-200 rounded-lg px-2 gap-1 text-xs sm:text-sm inline-flex items-center"
                title="Abrir em nova aba"
              >
                <ExternalLink size={18} />
                <span className="hidden sm:inline">Abrir</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="touch-target text-gray-400 hover:text-white rounded-lg"
              aria-label="Fechar"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-gray-900 overflow-hidden relative flex flex-col">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-gray-400 bg-gray-900/90">
              <Loader2 className="animate-spin" size={24} />
              Carregando PDF…
            </div>
          )}

          {error && !loading && (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center text-gray-400 gap-4">
              <p>{error}</p>
              {openUrl && (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-btn bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  Abrir PDF em nova aba
                </a>
              )}
            </div>
          )}

          {!error && useNativeViewer && openUrl && !loading && (
            <iframe
              src={`${openUrl}#view=FitH`}
              title={title}
              className="flex-1 w-full min-h-0 border-0 bg-white rounded-b-xl"
            />
          )}

          {!useNativeViewer && (
            <div
              ref={containerRef}
              className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-3 ${
                error && !loading ? 'hidden' : 'block'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
