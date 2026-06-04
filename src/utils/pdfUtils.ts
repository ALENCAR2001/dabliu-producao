import { PDFDocument } from 'pdf-lib'

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function getPdfPageCount(pdfBytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes)
  return doc.getPageCount()
}

/** Extrai uma única página (índice começa em 0) como PDF novo */
export async function extractPdfPage(pdfBytes: Uint8Array, pageIndex: number): Promise<Uint8Array> {
  const source = await PDFDocument.load(pdfBytes)
  const pageCount = source.getPageCount()
  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Página inválida: ${pageIndex + 1} de ${pageCount}`)
  }
  const target = await PDFDocument.create()
  const [page] = await target.copyPages(source, [pageIndex])
  target.addPage(page)
  return target.save()
}

export function pdfBytesToBlobUrl(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes)
  const blob = new Blob([copy], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
