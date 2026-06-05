import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { DayPunch } from '../types/ponto'
import { combineDateTimeLocal, isValidTime24, punchDayKey, toLocalYMD } from '../utils/calendar'
import { isPontoDiaEditavelFuncionario, mensagemDiaNaoEditavel } from '../utils/pontoRules'
import { loadPonto, savePonto, upsertPonto } from '../utils/pontoStorage'

type TimePunchRow = {
  id: string
  user_id: string
  user_nome: string
  punch_date: string
  entrada_at: string | null
  saida_at: string | null
}

function rowToPunch(row: TimePunchRow): DayPunch {
  return {
    id: row.id,
    userId: row.user_id,
    userNome: row.user_nome,
    date: row.punch_date,
    entradaAt: row.entrada_at ?? undefined,
    saidaAt: row.saida_at ?? undefined,
  }
}

function filterByMonth(entries: DayPunch[], year: number, month: number): DayPunch[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return entries.filter(e => e.date.startsWith(prefix))
}

/** Mantém cache local alinhado com o que veio da nuvem (meses fora do filtro permanecem). */
function mergeCloudIntoLocalCache(cloudMonth: DayPunch[], year: number, month: number): void {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const rest = loadPonto().filter(e => !e.date.startsWith(prefix))
  savePonto([...rest, ...cloudMonth], { silent: true })
}

export function getStorageMode(): 'database' | 'local' {
  return isSupabaseConfigured() ? 'database' : 'local'
}

export async function listPontoMonth(year: number, month: number, userId?: string): Promise<DayPunch[]> {
  const supabase = getSupabase()
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  if (supabase) {
    let q = supabase
      .from('time_punches')
      .select('*')
      .gte('punch_date', monthStart)
      .lte('punch_date', monthEnd)
      .order('punch_date', { ascending: true })

    if (userId) q = q.eq('user_id', userId)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    const punches = (data as TimePunchRow[]).map(rowToPunch)
    mergeCloudIntoLocalCache(punches, year, month)
    return punches
  }

  let all = loadPonto()
  all = filterByMonth(all, year, month)
  if (userId) all = all.filter(e => e.userId === userId)
  return all
}

async function savePunch(punch: DayPunch): Promise<DayPunch> {
  const supabase = getSupabase()

  if (supabase) {
    const { data, error } = await supabase
      .from('time_punches')
      .upsert(
        {
          user_id: punch.userId,
          user_nome: punch.userNome,
          punch_date: punch.date,
          entrada_at: punch.entradaAt ?? null,
          saida_at: punch.saidaAt ?? null,
        },
        { onConflict: 'user_id,punch_date' }
      )
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    const saved = rowToPunch(data as TimePunchRow)
    upsertPonto(saved)
    return saved
  }

  upsertPonto(punch)
  return punch
}

/** Envia registros antigos do navegador para o Supabase (PC/celular com dados locais). */
export async function migrateLocalPontoToDatabase(): Promise<number> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase não configurado')

  const local = loadPonto()
  if (local.length === 0) return 0

  let count = 0
  for (const p of local) {
    await savePunch(p)
    count += 1
  }
  return count
}

export async function getPunchForDay(userId: string, date: string): Promise<DayPunch | null> {
  const y = parseInt(date.slice(0, 4), 10)
  const m = parseInt(date.slice(5, 7), 10) - 1
  const list = await listPontoMonth(y, m, userId)
  return list.find(e => e.date === date) ?? null
}

export type SalvarPontoOptions = {
  /** Admin pode corrigir qualquer dia; funcionário não. */
  permitirQualquerDia?: boolean
}

/** Salva ou atualiza horários digitados (HH:mm) para um dia */
export async function salvarPontoDoDia(
  userId: string,
  userNome: string,
  date: string,
  entradaHora?: string,
  saidaHora?: string,
  options?: SalvarPontoOptions
): Promise<DayPunch> {
  const hoje = toLocalYMD(new Date())
  if (!options?.permitirQualquerDia && !isPontoDiaEditavelFuncionario(date, hoje)) {
    throw new Error(mensagemDiaNaoEditavel(date, hoje))
  }

  const entrada = entradaHora?.trim()
  const saida = saidaHora?.trim()

  if (!entrada && !saida) {
    throw new Error('Digite a hora de entrada e/ou de saída.')
  }
  if (entrada && !isValidTime24(entrada)) {
    throw new Error('Hora de entrada inválida. Use formato 24h (ex: 08:00).')
  }
  if (saida && !isValidTime24(saida)) {
    throw new Error('Hora de saída inválida. Use formato 24h (ex: 18:00).')
  }

  const existing = (await getPunchForDay(userId, date)) ?? {
    id: punchDayKey(userId, date),
    userId,
    userNome,
    date,
  }

  let entradaAt = existing.entradaAt
  let saidaAt = existing.saidaAt

  if (entrada) entradaAt = combineDateTimeLocal(date, entrada)
  if (saida) saidaAt = combineDateTimeLocal(date, saida)

  if (saida && !entradaAt) {
    throw new Error('Informe a hora de entrada antes da saída.')
  }

  if (entradaAt && saidaAt && new Date(saidaAt).getTime() <= new Date(entradaAt).getTime()) {
    throw new Error('A saída deve ser depois da entrada.')
  }

  return savePunch({
    ...existing,
    userNome,
    entradaAt,
    saidaAt,
  })
}

