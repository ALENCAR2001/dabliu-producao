import type { Layout } from '../types/layout'
import { getLayoutStatusBadgeClass, getLayoutStatusLabel, LAYOUT_STATUS_ORDER } from '../utils/layoutStatus'

type LayoutStatusQuickPickerProps = {
  status: Layout['status']
  onChange: (status: Layout['status']) => void
  disabled?: boolean
}

/** Ativo / Em produção / Finalizado — toque no status desejado */
export function LayoutStatusQuickPicker({ status, onChange, disabled }: LayoutStatusQuickPickerProps) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Status do modelo">
      {LAYOUT_STATUS_ORDER.map(s => {
        const active = status === s
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`text-xs px-2.5 py-1 min-h-[32px] rounded-full font-medium transition-opacity ${
              active
                ? getLayoutStatusBadgeClass(s)
                : 'bg-gray-900/80 text-gray-500 border border-gray-600 hover:text-gray-300 hover:border-gray-500'
            } disabled:opacity-50`}
          >
            {getLayoutStatusLabel(s)}
          </button>
        )
      })}
    </div>
  )
}
