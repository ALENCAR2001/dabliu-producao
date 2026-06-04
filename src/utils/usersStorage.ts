import { DEFAULT_SYSTEM_USERS, type SystemUser } from '../data/users'
import { safeSetItem } from './safeStorage'

const USERS_KEY = 'dabliu-system-users-v1'
const SEEDED_KEY = 'dabliu-system-users-seeded'
const ROSTER_CACHE_KEY = 'dabliu-funcionarios-roster-cache'

/** Inclui funcionários novos do código sem apagar PINs já alterados no navegador. */
function mergeDefaultUsers(stored: SystemUser[]): SystemUser[] {
  const ids = new Set(stored.map(u => u.id))
  const additions = DEFAULT_SYSTEM_USERS.filter(d => !ids.has(d.id))
  if (additions.length === 0) return stored
  return [...stored, ...additions]
}

export function loadUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) {
      if (!localStorage.getItem(SEEDED_KEY)) {
        saveUsers(DEFAULT_SYSTEM_USERS)
        localStorage.setItem(SEEDED_KEY, '1')
        return DEFAULT_SYSTEM_USERS
      }
      return []
    }
    const stored = JSON.parse(raw) as SystemUser[]
    const merged = mergeDefaultUsers(stored)
    if (merged.length !== stored.length) {
      saveUsers(merged)
      localStorage.removeItem(ROSTER_CACHE_KEY)
    }
    return merged
  } catch {
    return DEFAULT_SYSTEM_USERS
  }
}

export function saveUsers(users: SystemUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const LAST_FUNCIONARIO_KEY = 'dabliu-last-funcionario-id'

export function getLastFuncionarioId(): string | null {
  return localStorage.getItem(LAST_FUNCIONARIO_KEY)
}

export function setLastFuncionarioId(userId: string): void {
  localStorage.setItem(LAST_FUNCIONARIO_KEY, userId)
}

export function cacheFuncionariosRoster(funcionarios: SystemUser[]): void {
  const slim = funcionarios.map(f => ({
    id: f.id,
    nome: f.nome,
    role: f.role,
    login: f.login,
    password: f.password,
  }))
  safeSetItem(ROSTER_CACHE_KEY, JSON.stringify(slim))
}

export function loadCachedFuncionariosRoster(): SystemUser[] {
  try {
    const raw = localStorage.getItem(ROSTER_CACHE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SystemUser[]
  } catch {
    return []
  }
}
