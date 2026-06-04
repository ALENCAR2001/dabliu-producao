/** Registro de ponto de um funcionário em um dia (YYYY-MM-DD) */
export type DayPunch = {
  id: string
  userId: string
  userNome: string
  /** Data local YYYY-MM-DD */
  date: string
  entradaAt?: string
  saidaAt?: string
}
