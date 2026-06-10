import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

function copyBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes)
}

/** Android Chrome não exibe PDF no iframe; demais dispositivos usam visualizador nativo. */
export function shouldUseNativePdfViewer(): boolean {
  return !/Android/i.test(navigator.userAgent)
}

function getOutputScale(): number {
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
}

function measureContainerWidth(container: HTMLDivElement): number {
  const w = container.clientWidth
  if (w > 0) return Math.max(w - 16, 200)
  return Math.min(Math.max(window.innerWidth - 48, 280), 960)
}

/**
 * Renderiza PDF no canvas preservando proporção original (sem esticar).
 * Escala só para caber na largura — nunca amplia além do tamanho do PDF.
 */
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
    const outputScale = getOutputScale()

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (signal.aborted) return
      const page = await pdf.getPage(pageNum)
      const baseViewport = page.getViewport({ scale: 1 })

      // Proporção original: só reduz se não couber; nunca estica/amplia
      const fitScale = Math.min(containerWidth / baseViewport.width, 1)
      const viewport = page.getViewport({ scale: fitScale })
      const cssWidth = Math.floor(viewport.width)
      const cssHeight = Math.floor(viewport.height)

      const wrap = document.createElement('div')
      wrap.className = 'flex justify-center mb-3 last:mb-0 w-full overflow-x-auto'

      const canvas = document.createElement('canvas')
      canvas.className = 'rounded-lg shadow-lg bg-white'
      canvas.width = Math.floor(cssWidth * outputScale)
      canvas.height = Math.floor(cssHeight * outputScale)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      canvas.style.display = 'block'

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('Canvas não disponível')

      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0)

      wrap.appendChild(canvas)
      container.appendChild(wrap)

      await page.render({
        canvasContext: ctx,
        viewport,
        intent: 'display',
      }).promise
    }
  } finally {
    await pdf?.destroy()
  }
}

export { renderPdfToContainer, copyBytes }
