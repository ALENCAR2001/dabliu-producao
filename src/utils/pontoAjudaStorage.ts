import type { PontoAjudaSolicitacao } from '../types/pontoAjuda'

const KEY = 'dabliu-ponto-ajuda-v1'
export const PONTO_AJUDA_CHANGED_EVENT = 'dabliu:ponto-ajuda-changed'

export function loadPontoAjuda(): PontoAjudaSolicitacao[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as PontoAjudaSolicitacao[]
  } catch {
    return []
  }
}

export function savePontoAjuda(list: PontoAjudaSolicitacao[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
  // No mesmo navegador/aba, o evento `storage` NÃO dispara.
  // Disparamos um evento interno para atualizar o painel do admin imediatamente.
  window.dispatchEvent(new CustomEvent(PONTO_AJUDA_CHANGED_EVENT))
}
