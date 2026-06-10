import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

function copyBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes)
}

/** Limita memória em telas 3x sem perder nitidez perceptível. */
function getRenderPixelRatio(): number {
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5)
}

function measureContainerWidth(container: HTMLDivElement): number {
  const w = container.clientWidth
  if (w > 0) return w - 16
  // Fallback se ainda não mediu (modal abrindo)
  return Math.min(Math.max(window.innerWidth - 48, 320), 1200)
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
    const containerWidth = measureContainerWidth(container)
    const pixelRatio = getRenderPixelRatio()

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (signal.aborted) return
      const page = await pdf.getPage(pageNum)
      const baseViewport = page.getViewport({ scale: 1 })
      const cssScale = Math.max(containerWidth / baseViewport.width, 1)
      const viewport = page.getViewport({ scale: cssScale })

      const wrap = document.createElement('div')
      wrap.className = 'flex justify-center mb-3 last:mb-0'

      const canvas = document.createElement('canvas')
      canvas.className = 'max-w-full h-auto rounded-lg shadow-lg bg-white'
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      canvas.width = Math.floor(viewport.width * pixelRatio)
      canvas.height = Math.floor(viewport.height * pixelRatio)

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('Canvas não disponível')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      wrap.appendChild(canvas)
      container.appendChild(wrap)

      await page.render({ canvasContext: ctx, viewport }).promise
    }
  } finally {
    await pdf?.destroy()
  }
}

export { renderPdfToContainer, copyBytes }
