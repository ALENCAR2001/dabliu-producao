import { DEFAULT_SYSTEM_USERS, type SystemUser } from '../data/users'
import {
  adminUpdatePasswordCloud,
  listAllProfilesCloud,
  listTeamLoginCloud,
  isCloudAuthEnabled,
} from './authService'
import { loadUsers, saveUsers } from '../utils/usersStorage'

export function isCloudUserMode(): boolean {
  return isCloudAuthEnabled()
}

export function listAllUsers(): SystemUser[] {
  return loadUsers()
}

export function listFuncionarios(): SystemUser[] {
  return loadUsers().filter(u => u.role === 'funcionario')
}

export async function listAllUsersAsync(): Promise<SystemUser[]> {
  if (isCloudAuthEnabled()) return listAllProfilesCloud()
  return listAllUsers()
}

export async function listFuncionariosAsync(): Promise<SystemUser[]> {
  if (isCloudAuthEnabled()) return listTeamLoginCloud()
  return listFuncionarios()
}

export function findUserByLogin(login: string): SystemUser | undefined {
  const q = login.trim().toLowerCase()
  return loadUsers().find(u => u.login.toLowerCase() === q)
}

export function findUserById(id: string): SystemUser | undefined {
  return loadUsers().find(u => u.id === id)
}

export function verifyUser(userId: string, password: string): SystemUser | null {
  const user = findUserById(userId)
  if (!user || user.password !== password.trim()) return null
  return user
}

export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<SystemUser | { ok: false; message: string }> {
  if (isCloudAuthEnabled()) {
    const users = await listAllProfilesCloud()
    const user = users.find(u => u.id === userId)
    if (!user?.authId) {
      return { ok: false, message: 'Usuário não encontrado na nuvem.' }
    }
    const result = await adminUpdatePasswordCloud(user.authId, newPassword.trim())
    if (!result.ok) return result
    return { ...user, password: newPassword.trim() }
  }

  const users = loadUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx < 0) throw new Error('Usuário não encontrado')
  const next = { ...users[idx], password: newPassword.trim() }
  users[idx] = next
  saveUsers(users)
  return next
}

export function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function resetFuncionarioToDefaultPin(
  userId: string
): Promise<SystemUser | { ok: false; message: string }> {
  const def = DEFAULT_SYSTEM_USERS.find(u => u.id === userId)
  if (!def?.password) throw new Error('Usuário não encontrado nos padrões')
  return updateUserPassword(userId, def.password)
}

export function upsertUser(user: SystemUser): void {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) users[idx] = user
  else users.push(user)
  saveUsers(users)
}

export function getLoginHint(user: SystemUser): string {
  if (user.role === 'admin') return 'Usuário: admin'
  return 'PIN de 4 dígitos'
}

export function getDefaultPin(userId: string): string | undefined {
  return DEFAULT_SYSTEM_USERS.find(u => u.id === userId)?.password
}
