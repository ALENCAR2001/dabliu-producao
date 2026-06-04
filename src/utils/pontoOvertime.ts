import type { DayPunch } from '../types/ponto'

/** Limite convencional: trabalho **a partir desta hora local** conta como extra (mantém igual ao dia do registro). */
export const PONTO_LIMITE_EXTRA_HORA = 18 as const

/**
 * Minutos de hora extra em um único dia, considerando o intervalo trabalhado
 * **[max(entrada, limite 18:00) → saída]** quando há entrada e saída válidas no mesmo período.
 */
export function overtimeMinutesDay(
  punch: DayPunch,
  limitHour: number = PONTO_LIMITE_EXTRA_HORA
): number {
  if (!punch.entradaAt || !punch.saidaAt) return 0

  const entrada = new Date(punch.entradaAt).getTime()
  const saida = new Date(punch.saidaAt).getTime()
  if (saida <= entrada) return 0

  const [y, mo, d] = punch.date.split('-').map(s => parseInt(s, 10))
  if (!y || !mo || !d) return 0
  const lim = new Date(y, mo - 1, d, limitHour, 0, 0, 0).getTime()

  const trabalhoExtraInicio = Math.max(entrada, lim)
  return Math.max(0, Math.floor((saida - trabalhoExtraInicio) / 60_000))
}

export function totalOvertimeMinutes(punches: DayPunch[]): number {
  return punches.reduce((acc, p) => acc + overtimeMinutesDay(p), 0)
}

/** Ex.: `"7 h 35 min"` ou `"0 min"`. */
export function formatDuracaoHumana(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
