import { Link } from 'react-router-dom'
import { AlertTriangle, Boxes, Droplets, FlaskConical, Package, Scissors, Sparkles, Waves } from 'lucide-react'
import { useMemo } from 'react'
import type { InsumoCategoria } from '../../types/insumos'
import {
  buildInsumosDashboard,
  formatInsumoQty,
  type InsumoCardResumo,
} from '../../utils/dashboardInsumos'
import { analisarInsumos, piorNivelCategoria, type NivelAlertaInsumo } from '../../utils/insumoAlertas'
import type { InsumoItem } from '../../types/insumos'
import { alertaPorId } from '../../utils/insumoAlertas'
import { getTintaVisualColor } from '../../utils/tintaCorVisual'
import { tintaItemId } from '../../utils/tintaVariants'

type DashboardInsumosProps = {
  items: InsumoItem[]
  loading?: boolean
}

function categoriaIcon(cat: InsumoCategoria, className: string) {
  const size = 18
  switch (cat) {
    case 'cola':
      return <Droplets size={size} className={className} />
    case 'tinta':
      return <Package size={size} className={className} />
    case 'fita':
      return <Scissors size={size} className={className} />
    case 'emulsao':
      return <FlaskConical size={size} className={className} />
    case 'desgravador':
      return <Sparkles size={size} className={className} />
    case 'solvente':
      return <Waves size={size} className={className} />
  }
}

const CARD_STYLE: Record<InsumoCategoria, { border: string; icon: string }> = {
  cola: { border: 'border-amber-500/35', icon: 'text-amber-400' },
  tinta: { border: 'border-violet-500/35', icon: 'text-violet-400' },
  fita: { border: 'border-rose-500/35', icon: 'text-rose-400' },
  emulsao: { border: 'border-cyan-500/35', icon: 'text-cyan-400' },
  desgravador: { border: 'border-orange-500/35', icon: 'text-orange-400' },
  solvente: { border: 'border-sky-500/35', icon: 'text-sky-400' },
}

function nivelCardClass(nivel: NivelAlertaInsumo): string {
  if (nivel === 'zerado') return 'ring-1 ring-red-500/60'
  if (nivel === 'baixo') return 'ring-1 ring-amber-500/50'
  return ''
}

function nivelQtyClass(nivel: NivelAlertaInsumo): string {
  if (nivel === 'zerado') return 'text-red-400'
  if (nivel === 'baixo') return 'text-amber-400'
  return 'text-white'
}

function CorDot({ corId, label }: { corId: string; label: string }) {
  const fill = getTintaVisualColor(corId, label)
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-full shrink-0 border border-black/35 ring-1 ring-white/15 shadow-sm"
      style={{ backgroundColor: fill }}
      title={label}
    />
  )
}

function InsumoCard({
  card,
  loading,
  nivel,
}: {
  card: InsumoCardResumo
  loading?: boolean
  nivel: NivelAlertaInsumo
}) {
  const style = CARD_STYLE[card.categoria]

  return (
    <div
      className={`bg-gray-900/70 border rounded-xl p-3 ${style.border} ${nivelCardClass(nivel)}`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {categoriaIcon(card.categoria, style.icon)}
        <span className="text-white text-xs font-medium truncate">{card.label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${loading ? 'text-gray-500' : nivelQtyClass(nivel)}`}>
        {loading ? '…' : formatInsumoQty(card.total, card.unidade)}
      </p>
      <p className="text-gray-500 text-[10px] mt-0.5">{card.unidadeTexto}</p>
      {!loading && nivel !== 'ok' && (
        <p className="text-[10px] mt-1 text-amber-400/90">
          {nivel === 'zerado' ? 'Sem estoque' : 'Estoque baixo'}
        </p>
      )}
    </div>
  )
}

export function DashboardInsumos({ items, loading }: DashboardInsumosProps) {
  const { cards, tintasPorCor } = buildInsumosDashboard(items)
  const { zerados, baixos, alertas } = useMemo(() => analisarInsumos(items), [items])

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Boxes size={18} className="text-violet-400" />
            Insumos — estoque atual
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Vermelho = zerado · Amarelo = abaixo do mínimo
          </p>
        </div>
        <Link
          to="/estoque"
          className="text-indigo-400 text-xs hover:underline shrink-0 font-medium"
        >
          Atualizar insumos →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {cards.map(card => (
          <InsumoCard
            key={card.categoria}
            card={card}
            loading={loading}
            nivel={piorNivelCategoria(alertas, card.categoria)}
          />
        ))}
      </div>

      <div className="bg-gray-900/50 border border-gray-700/80 rounded-xl p-3 mb-3">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Tinta por cor (quilos)</p>
        {loading ? (
          <p className="text-gray-500 text-sm py-4 text-center">Carregando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[280px]">
              <thead>
                <tr className="text-gray-500 text-left text-xs border-b border-gray-700">
                  <th className="pb-2 pr-3 font-medium">Cor</th>
                  <th className="pb-2 pr-3 font-medium text-center">Gel</th>
                  <th className="pb-2 font-medium text-center">Relevo</th>
                </tr>
              </thead>
              <tbody>
                {tintasPorCor.map(row => {
                  const gelAlert = alertaPorId(alertas, tintaItemId(row.cor, 'gel'))
                  const relAlert = alertaPorId(alertas, tintaItemId(row.cor, 'relevo'))
                  return (
                    <tr key={row.cor} className="border-b border-gray-800 last:border-0">
                      <td className="py-2 pr-3 text-gray-200">
                        <span className="flex items-center gap-2">
                          <CorDot corId={row.cor} label={row.label} />
                          {row.label}
                        </span>
                      </td>
                      <td
                        className={`py-2 pr-3 text-center font-semibold tabular-nums ${
                          gelAlert ? nivelQtyClass(gelAlert.nivel) : 'text-white'
                        }`}
                      >
                        {formatInsumoQty(row.gel, 'kg')}
                      </td>
                      <td
                        className={`py-2 text-center font-semibold tabular-nums ${
                          relAlert ? nivelQtyClass(relAlert.nivel) : 'text-white'
                        }`}
                      >
                        {formatInsumoQty(row.relevo, 'kg')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (zerados.length > 0 || baixos.length > 0) && (
        <div className="space-y-2">
          {zerados.length > 0 && (
            <div className="flex gap-2 items-start bg-red-950/30 border border-red-800/40 rounded-xl p-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-200 text-xs font-medium">Acabou — repor urgente</p>
                <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                  {zerados.map(i => i.nome).join(' · ')}
                </p>
              </div>
            </div>
          )}
          {baixos.length > 0 && (
            <div className="flex gap-2 items-start bg-amber-950/30 border border-amber-700/40 rounded-xl p-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 text-xs font-medium">Estoque baixo — planejar compra</p>
                <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                  {baixos
                    .slice(0, 8)
                    .map(i => `${i.nome} (${formatInsumoQty(i.quantidade, i.unidade)} / mín. ${formatInsumoQty(i.minimo, i.unidade)})`)
                    .join(' · ')}
                  {baixos.length > 8 ? ` · +${baixos.length - 8}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
