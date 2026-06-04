const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function toLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTimeBR(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '—'
  }
}

const TIME_24_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

/** Valida HH:mm em relógio de 24 horas */
export function isValidTime24(hhmm: string): boolean {
  return TIME_24_RE.test(hhmm.trim())
}

/**
 * Normaliza texto digitado para HH:mm (24h).
 * Aceita: 18:00, 18:0, 1800, 18 (vira 18:00 no blur).
 * Retorna '' se vazio; null se inválido.
 */
export function normalizeTime24(input: string): string | null {
  const raw = input.trim()
  if (!raw) return ''

  if (TIME_24_RE.test(raw)) return raw

  const withColon = raw.match(/^(\d{1,2}):(\d{1,2})$/)
  if (withColon) {
    const h = parseInt(withColon[1], 10)
    const m = parseInt(withColon[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    return null
  }

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 3 || digits.length === 4) {
    const m = parseInt(digits.slice(-2), 10)
    const h = parseInt(digits.slice(0, -2), 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    return null
  }

  if (/^\d{1,2}$/.test(digits)) {
    const h = parseInt(digits, 10)
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`
    return null
  }

  return null
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS_PT[month]} ${year}`
}

export { WEEKDAYS_PT, MONTHS_PT }

export type CalendarCell = {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  weekday: number
}

/** Grade do mês no calendário (domingo = primeira coluna) */
export function getMonthCalendarCells(year: number, month: number): CalendarCell[] {
  const today = toLocalYMD(new Date())
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const daysInMonth = last.getDate()

  const cells: CalendarCell[] = []

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1)
    const date = toLocalYMD(d)
    cells.push({
      date,
      day: d.getDate(),
      isCurrentMonth: false,
      isToday: date === today,
      weekday: d.getDay(),
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    const date = toLocalYMD(d)
    cells.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date === today,
      weekday: d.getDay(),
    })
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - startPad - daysInMonth + 1
    const d = new Date(year, month + 1, nextDay)
    const date = toLocalYMD(d)
    cells.push({
      date,
      day: d.getDate(),
      isCurrentMonth: false,
      isToday: date === today,
      weekday: d.getDay(),
    })
  }

  return cells
}

export function punchDayKey(userId: string, date: string): string {
  return `${userId}|${date}`
}

/** Converte data YYYY-MM-DD + hora HH:mm (horário local) para ISO */
export function combineDateTimeLocal(dateYMD: string, timeHHmm: string): string {
  const [hh, mm] = timeHHmm.split(':').map(s => parseInt(s, 10))
  const [y, mo, d] = dateYMD.split('-').map(s => parseInt(s, 10))
  if (!y || !mo || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error('Data ou hora inválida.')
  }
  return new Date(y, mo - 1, d, hh, mm, 0, 0).toISOString()
}

/** Extrai HH:mm (24h) de um ISO */
export function isoToTimeInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function nowTimeInput(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
