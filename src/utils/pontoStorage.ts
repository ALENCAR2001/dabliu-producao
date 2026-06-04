import type { DayPunch } from '../types/ponto'
import { punchDayKey } from './calendar'
import { safeSetItem } from './safeStorage'

const PONTO_KEY = 'dabliu-ponto-v1'

export function loadPonto(): DayPunch[] {
  try {
    const raw = localStorage.getItem(PONTO_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DayPunch[]
  } catch {
    return []
  }
}

export function savePonto(entries: DayPunch[]): boolean {
  const result = safeSetItem(PONTO_KEY, JSON.stringify(entries))
  if (!result.ok) {
    window.alert(result.message)
    return false
  }
  return true
}

export function upsertPonto(entry: DayPunch): DayPunch[] {
  const all = loadPonto()
  const key = punchDayKey(entry.userId, entry.date)
  const idx = all.findIndex(e => punchDayKey(e.userId, e.date) === key)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...entry, id: all[idx].id }
  } else {
    all.push(entry)
  }
  savePonto(all)
  return all
}
