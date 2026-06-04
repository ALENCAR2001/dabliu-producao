/** Escapa célula para CSV (Excel em pt-BR) */
function escapeCell(value: string | number): string {
  const s = String(value)
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const sep = ';'
  const lines = [
    headers.map(escapeCell).join(sep),
    ...rows.map(row => row.map(escapeCell).join(sep)),
  ]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function filterEntriesByMonth<T extends { createdAt: string }>(
  entries: T[],
  year: number,
  month: number
): T[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return entries.filter(e => {
    try {
      const d = new Date(e.createdAt)
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return ymd.startsWith(prefix) || e.createdAt.startsWith(prefix)
    } catch {
      return e.createdAt.startsWith(prefix)
    }
  })
}

export function filterPontoByMonth(punches: { date: string }[], year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return punches.filter(p => p.date.startsWith(prefix))
}
