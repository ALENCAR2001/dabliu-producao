import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { AuthSession } from '../types/auth'
import { loginToAuthEmail, resolveAuthEmail } from '../utils/authEmail'
import type { SystemUser } from '../data/users'
import type { UserRole } from '../types/auth'

/** Modo nuvem ativo quando Supabase está configurado no `.env`. */
export function isCloudAuthEnabled(): boolean {
  return isSupabaseConfigured()
}

/** @deprecated Use `isCloudAuthEnabled` — nome antigo confundia o ESLint (rules-of-hooks). */
export function useCloudAuth(): boolean {
  return isCloudAuthEnabled()
}

type ProfileRow = {
  id: string
  legacy_id: string
  nome: string
  login: string
  role: UserRole
  active: boolean
}

type TeamLoginRow = {
  id: string
  nome: string
  login: string
}

export function profileToSession(row: ProfileRow): AuthSession {
  return {
    userId: row.legacy_id,
    authUserId: row.id,
    nome: row.nome,
    login: row.login,
    role: row.role,
    loggedAt: new Date().toISOString(),
  }
}

export function profileToSystemUser(row: ProfileRow, password?: string): SystemUser {
  return {
    id: row.legacy_id,
    authId: row.id,
    nome: row.nome,
    login: row.login,
    role: row.role,
    password,
  }
}

export async function fetchSessionFromAuth(): Promise<AuthSession | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, legacy_id, nome, login, role, active')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !profile || !profile.active) return null
  return profileToSession(profile as ProfileRow)
}

export async function signInWithCredentials(
  loginOrEmail: string,
  password: string,
  expectedRole?: UserRole
): Promise<{ ok: true; session: AuthSession } | { ok: false; message: string }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const roleGuess: UserRole =
    expectedRole ?? (loginOrEmail.trim().toLowerCase() === 'admin' ? 'admin' : 'funcionario')
  const email = resolveAuthEmail(loginOrEmail, roleGuess)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password.trim(),
  })

  if (error) {
    const msg =
      error.message.includes('Invalid login credentials') ||
      error.message.includes('invalid_credentials')
        ? expectedRole === 'funcionario'
          ? 'PIN incorreto. Tente de novo ou fale com o administrador.'
          : 'Usuário ou senha incorretos.'
        : error.message
    return { ok: false, message: msg }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, legacy_id, nome, login, role, active')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { ok: false, message: 'Perfil não encontrado. Execute o seed de usuários.' }
  }

  if (!profile.active) {
    await supabase.auth.signOut()
    return { ok: false, message: 'Conta desativada.' }
  }

  if (expectedRole && profile.role !== expectedRole) {
    await supabase.auth.signOut()
    return {
      ok: false,
      message:
        expectedRole === 'admin'
          ? 'Esta conta não é de administrador.'
          : 'Esta conta não é de funcionário.',
    }
  }

  return { ok: true, session: profileToSession(profile as ProfileRow) }
}

export async function signInFuncionarioByLegacyId(
  legacyId: string,
  pin: string
): Promise<{ ok: true; session: AuthSession } | { ok: false; message: string }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data: row, error } = await supabase
    .from('team_login')
    .select('id, login')
    .eq('id', legacyId)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, message: 'Funcionário não encontrado.' }
  }

  const email = loginToAuthEmail(row.login, 'funcionario')
  const { data, error: signError } = await supabase.auth.signInWithPassword({
    email,
    password: pin.trim(),
  })

  if (signError) {
    return {
      ok: false,
      message: 'PIN incorreto. Tente de novo ou fale com o administrador.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, legacy_id, nome, login, role, active')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile?.active) {
    await supabase.auth.signOut()
    return { ok: false, message: 'Conta desativada.' }
  }

  return { ok: true, session: profileToSession(profile as ProfileRow) }
}

export async function signOutCloud(): Promise<void> {
  const supabase = getSupabase()
  if (supabase) await supabase.auth.signOut()
}

export async function listTeamLoginCloud(): Promise<SystemUser[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase.from('team_login').select('id, nome, login')
  if (error || !data) return []

  return (data as TeamLoginRow[]).map(row => ({
    id: row.id,
    nome: row.nome,
    login: row.login,
    role: 'funcionario' as const,
  }))
}

export async function listAllProfilesCloud(): Promise<SystemUser[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, legacy_id, nome, login, role, active')
    .eq('active', true)
    .order('role')
    .order('nome')

  if (error || !data) return []

  return (data as ProfileRow[]).map(row => profileToSystemUser(row))
}

export async function adminUpdatePasswordCloud(
  targetAuthId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: 'Supabase não configurado.' }
  }

  const { data, error } = await supabase.functions.invoke('admin-update-password', {
    body: { targetAuthId, newPassword },
  })

  if (error) {
    const hint = error.message?.includes('Failed to send')
      ? ' Função admin-update-password não publicada — veja docs/AUTH-SUPABASE.md'
      : ''
    return { ok: false, message: (error.message || 'Erro ao alterar PIN') + hint }
  }

  if (data?.error) {
    return { ok: false, message: String(data.error) }
  }

  return { ok: true }
}
