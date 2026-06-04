import { isValidTime24 } from './calendar'

export function validateTimesBeforeSave(entrada: string, saida: string): string | null {
  if (entrada && !isValidTime24(entrada)) return 'Hora de entrada inválida. Use 24h (ex: 08:00).'
  if (saida && !isValidTime24(saida)) return 'Hora de saída inválida. Use 24h (ex: 18:00).'
  if (entrada && saida && entrada >= saida) return 'A saída deve ser depois da entrada.'
  return null
}
