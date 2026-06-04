import type { Layout } from '../types/layout'

export const LAYOUT_STATUS_ORDER: Layout['status'][] = ['ativo', 'producao', 'finalizado']

export function getLayoutStatusLabel(status: Layout['status']): string {
  switch (status) {
    case 'ativo':
      return 'Ativo'
    case 'producao':
      return 'Em produção'
    case 'finalizado':
      return 'Finalizado'
    default:
      return status
  }
}

export function getLayoutStatusBadgeClass(status: Layout['status']): string {
  switch (status) {
    case 'ativo':
      return 'bg-emerald-600/90 text-white'
    case 'producao':
      return 'bg-amber-500/90 text-gray-900'
    case 'finalizado':
      return 'bg-indigo-600/90 text-white'
    default:
      return 'bg-gray-600 text-white'
  }
}

export function getLayoutStatusAccent(status: Layout['status']): string {
  switch (status) {
    case 'ativo':
      return 'text-emerald-400 border-emerald-500/40'
    case 'producao':
      return 'text-amber-400 border-amber-500/40'
    case 'finalizado':
      return 'text-indigo-400 border-indigo-500/40'
    default:
      return 'text-gray-400 border-gray-500/40'
  }
}

export const LAYOUT_STATUS_CHART_COLORS: Record<Layout['status'], string> = {
  ativo: '#34d399',
  producao: '#fbbf24',
  finalizado: '#818cf8',
}
