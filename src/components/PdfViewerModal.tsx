import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'

type PdfViewerModalProps = {
  open: boolean
  title: string
  loadPdf: () => Promise<Uint8Array | null>
  onClose: () => void
}

export function PdfViewerModal({ open, title, loadPdf, onClose }: PdfViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) return
    void Promise.resolve().then(() => {
      setUrl(prev => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
      setError(null)
      setLoading(false)
    })
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    let objectUrl: string | null = null

    void Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const bytes = await loadPdf()
        if (cancelled) return
        if (!bytes || bytes.length === 0) {
          setError('PDF não encontrado ou vazio.')
          return
        }
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch {
        if (!cancelled) setError('Não foi possível abrir o PDF.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, loadPdf])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl border border-gray-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center gap-2 shrink-0">
          <h2 className="text-white font-semibold truncate pr-2">{title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-indigo-300 hover:text-indigo-200 rounded-lg"
                title="Abrir em nova aba"
              >
                <ExternalLink size={20} />
              </a>
            )}
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-gray-900">
          {loading && (
            <div className="h-full flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="animate-spin" size={24} />
              Carregando PDF…
            </div>
          )}
          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 gap-3">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && url && (
            <iframe title={title} src={url} className="w-full h-full border-0" />
          )}
        </div>
      </div>
    </div>
  )
}
