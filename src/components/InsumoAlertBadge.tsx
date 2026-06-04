import type { NivelAlertaInsumo } from '../utils/insumoAlertas'

export function InsumoAlertBadge({ nivel }: { nivel: NivelAlertaInsumo }) {
  if (nivel === 'ok') return null
  if (nivel === 'zerado') {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wide text-red-300 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-full">
        Acabou
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-full">
      Baixo
    </span>
  )
}
