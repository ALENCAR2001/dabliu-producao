import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

function copyBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes)
}

async function renderPdfToContainer(
  container: HTMLDivElement,
  bytes: Uint8Array,
  signal: AbortSignal,
): Promise<void> {
  container.replaceChildren()
  const loading = document.createElement('p')
  loading.className = 'text-gray-400 text-sm text-center py-8'
  loading.textContent = 'Renderizando PDF…'
  container.appendChild(loading)

  let pdf: PDFDocumentProxy | null = null
  try {
    pdf = await getDocument({ data: copyBytes(bytes) }).promise
    if (signal.aborted) return

    container.replaceChildren()
    const containerWidth = Math.max(container.clientWidth - 8, 280)

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (signal.aborted) return
      const page = await pdf.getPage(pageNum)
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = Math.min(Math.max(containerWidth / baseViewport.width, 0.75), 2.5)
      const viewport = page.getViewport({ scale })

      const wrap = document.createElement('div')
      wrap.className = 'flex justify-center mb-3 last:mb-0'

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.className = 'max-w-full h-auto rounded-lg shadow-lg bg-white'

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas não disponível')

      wrap.appendChild(canvas)
      container.appendChild(wrap)

      await page.render({ canvasContext: ctx, viewport }).promise
    }
  } finally {
    await pdf?.destroy()
  }
}

export { renderPdfToContainer, copyBytes }
