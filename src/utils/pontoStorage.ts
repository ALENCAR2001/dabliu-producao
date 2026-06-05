import type { DayPunch } from '../types/ponto'
import { punchDayKey } from './calendar'
import { safeSetItem } from './safeStorage'

export const PONTO_STORAGE_KEY = 'dabliu-ponto-v1'
const PONTO_KEY = PONTO_STORAGE_KEY

export const PONTO_CHANGED_EVENT = 'dabliu:ponto-changed'

export function loadPonto(): DayPunch[] {
  try {
    const raw = localStorage.getItem(PONTO_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DayPunch[]
  } catch {
    return []
  }
}

export function savePonto(entries: DayPunch[], options?: { silent?: boolean }): boolean {
  const result = safeSetItem(PONTO_KEY, JSON.stringify(entries))
  if (!result.ok) {
    window.alert(result.message)
    return false
  }
  if (!options?.silent) {
    window.dispatchEvent(new CustomEvent(PONTO_CHANGED_EVENT))
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
