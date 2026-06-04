/** Pedido de funcionário que esqueceu de bater ponto — admin entra em contato. */
export type PontoAjudaSolicitacao = {
  id: string
  userId: string
  userNome: string
  /** Dia que não conseguiu registrar (YYYY-MM-DD), sempre anterior a hoje */
  date: string
  motivo?: string
  status: 'pendente' | 'resolvido'
  createdAt: string
  resolvedAt?: string
}
