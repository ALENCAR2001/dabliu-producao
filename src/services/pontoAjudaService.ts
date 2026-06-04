import type { PontoAjudaSolicitacao } from '../types/pontoAjuda'
import { toLocalYMD } from '../utils/calendar'
import { getSupabase } from '../lib/supabase'
import { loadPontoAjuda, savePontoAjuda } from '../utils/pontoAjudaStorage'

function newId(): string {
  return `ajuda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type PontoAjudaRow = {
  id: string
  user_id: string
  user_nome: string
  help_date: string
  motivo: string | null
  status: 'pendente' | 'resolvido'
  created_at: string
  resolved_at: string | null
}

function rowToAjuda(r: PontoAjudaRow): PontoAjudaSolicitacao {
  return {
    id: r.id,
    userId: r.user_id,
    userNome: r.user_nome,
    date: r.help_date,
    motivo: r.motivo ?? undefined,
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at ?? undefined,
  }
}

export async function listPontoAjuda(status?: PontoAjudaSolicitacao['status']): Promise<PontoAjudaSolicitacao[]> {
  const supabase = getSupabase()
  if (supabase) {
    let q = supabase.from('ponto_help_requests').select('*').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return ((data ?? []) as PontoAjudaRow[]).map(rowToAjuda)
  }

  let all = loadPontoAjuda()
  if (status) all = all.filter(a => a.status === status)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listPontoAjudaPendentesUsuario(userId: string): Promise<PontoAjudaSolicitacao[]> {
  return (await listPontoAjuda('pendente')).filter(a => a.userId === userId)
}

export async function solicitarPontoAjuda(
  userId: string,
  userNome: string,
  date: string,
  motivo?: string
): Promise<PontoAjudaSolicitacao> {
  const hoje = toLocalYMD(new Date())
  if (date >= hoje) {
    throw new Error('Só é possível pedir ajuda para dias que já passaram.')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Data inválida.')
  }

  const supabase = getSupabase()
  if (supabase) {
    // evita duplicado pendente para o mesmo dia/usuário
    const { data: existing, error: exErr } = await supabase
      .from('ponto_help_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('help_date', date)
      .eq('status', 'pendente')
      .maybeSingle()
    if (exErr) throw new Error(exErr.message)
    if (existing?.id) {
      throw new Error('Já existe um pedido pendente para este dia. Aguarde o administrador.')
    }

    const entry: PontoAjudaSolicitacao = {
      id: newId(),
      userId,
      userNome,
      date,
      motivo: motivo?.trim() || undefined,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.from('ponto_help_requests').insert({
      id: entry.id,
      user_id: entry.userId,
      user_nome: entry.userNome,
      help_date: entry.date,
      motivo: entry.motivo ?? null,
      status: entry.status,
      created_at: entry.createdAt,
      resolved_at: null,
    })
    if (error) throw new Error(error.message)
    return entry
  }

  const all = loadPontoAjuda()
  const dup = all.find(a => a.userId === userId && a.date === date && a.status === 'pendente')
  if (dup) {
    throw new Error('Já existe um pedido pendente para este dia. Aguarde o administrador.')
  }

  const entry: PontoAjudaSolicitacao = {
    id: newId(),
    userId,
    userNome,
    date,
    motivo: motivo?.trim() || undefined,
    status: 'pendente',
    createdAt: new Date().toISOString(),
  }
  all.push(entry)
  savePontoAjuda(all)
  return entry
}

export async function resolverPontoAjuda(id: string): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase
      .from('ponto_help_requests')
      .update({ status: 'resolvido', resolved_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return
  }

  const all = loadPontoAjuda()
  const idx = all.findIndex(a => a.id === id)
  if (idx < 0) throw new Error('Pedido não encontrado.')
  all[idx] = {
    ...all[idx],
    status: 'resolvido',
    resolvedAt: new Date().toISOString(),
  }
  savePontoAjuda(all)
}
