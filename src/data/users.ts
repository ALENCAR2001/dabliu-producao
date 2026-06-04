import type { UserRole } from '../types/auth'

export type SystemUser = {
  /** ID legado (func-1) — usado no ponto e no app */
  id: string
  /** UUID Supabase Auth (somente modo nuvem) */
  authId?: string
  nome: string
  login: string
  /** Somente modo local; na nuvem o PIN não é legível */
  password?: string
  role: UserRole
}

/**
 * Usuários iniciais — senha dos funcionários = PIN de 4 dígitos.
 * O admin altera em Administração → Acessos da equipe.
 */
export const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'admin-1',
    nome: 'Administrador',
    login: 'admin',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'func-1',
    nome: 'Michael Jackson',
    login: 'michael',
    password: '1001',
    role: 'funcionario',
  },
  {
    id: 'func-2',
    nome: 'Hamilton Santos',
    login: 'hamilton',
    password: '1002',
    role: 'funcionario',
  },
  {
    id: 'func-3',
    nome: 'Iuri',
    login: 'iuri',
    password: '1003',
    role: 'funcionario',
  },
  {
    id: 'func-4',
    nome: 'Gabriel Alencar',
    login: 'gabriel',
    password: '1004',
    role: 'funcionario',
  },
  {
    id: 'func-5',
    nome: 'Christian Nascimento',
    login: 'christian',
    password: '1005',
    role: 'funcionario',
  },
  {
    id: 'func-6',
    nome: 'Bruno Brasil',
    login: 'bruno',
    password: '1006',
    role: 'funcionario',
  },
  {
    id: 'func-7',
    nome: 'Kaique Gomes',
    login: 'kaique',
    password: '1007',
    role: 'funcionario',
  },
  {
    id: 'func-8',
    nome: 'David Oliveira',
    login: 'david',
    password: '1008',
    role: 'funcionario',
  },
]

/** @deprecated use userService.listFuncionarios */
export function listFuncionarios(): SystemUser[] {
  return DEFAULT_SYSTEM_USERS.filter(u => u.role === 'funcionario')
}

/** @deprecated use userService.findUserByLogin */
export function findUserByLogin(login: string): SystemUser | undefined {
  const q = login.trim().toLowerCase()
  return DEFAULT_SYSTEM_USERS.find(u => u.login.toLowerCase() === q)
}
