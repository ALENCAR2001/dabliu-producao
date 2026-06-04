import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Layout } from '../../types/layout'
import { getTipoModeloLabel } from '../../types/layout'

type LayoutStatusListProps = {
  title: string
  subtitle: string
  layouts: Layout[]
  emptyText: string
  hideFooter?: boolean
}

export function LayoutStatusList({
  title,
  subtitle,
  layouts,
  emptyText,
  hideFooter,
}: LayoutStatusListProps) {
  return (
    <div className="flex flex-col">
      {title ? (
        <div className="mb-3">
          <h3 className="text-white font-semibold">{title}</h3>
          {subtitle ? <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p> : null}
        </div>
      ) : null}

      {layouts.length === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {layouts.map(l => (
            <li
              key={l.id}
              className="bg-gray-900/60 rounded-xl px-3 py-2.5 border border-gray-700/80"
            >
              <p className="text-white text-sm font-medium truncate">{l.nome}</p>
              <p className="text-gray-500 text-xs truncate">
                {l.marca} · {l.codigo} · {getTipoModeloLabel(l.tipoModelo)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!hideFooter && (
        <Link
          to="/layouts"
          className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 justify-end"
        >
          Ver todos
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
