import type { DayPunch } from '../types/ponto'
import { WEEKDAYS_PT, formatTimeBR, getMonthCalendarCells, punchDayKey, type CalendarCell } from '../utils/calendar'

type MonthCalendarGridProps = {
  year: number
  month: number
  punches: DayPunch[]
  userId?: string
  onSelectDate?: (date: string) => void
  selectedDate?: string
  compact?: boolean
  /** Se definido, só este dia (YYYY-MM-DD) pode ser clicado para edição */
  editableDate?: string
}

function getPunchForCell(punches: DayPunch[], userId: string | undefined, date: string): DayPunch | undefined {
  if (userId) {
    return punches.find(p => p.userId === userId && p.date === date)
  }
  return punches.find(p => p.date === date)
}

function cellStatus(punch?: DayPunch): 'vazio' | 'entrada' | 'completo' | 'incompleto' {
  if (!punch?.entradaAt) return 'vazio'
  if (punch.entradaAt && punch.saidaAt) return 'completo'
  return 'entrada'
}

export function MonthCalendarGrid({
  year,
  month,
  punches,
  userId,
  onSelectDate,
  selectedDate,
  compact,
  editableDate,
}: MonthCalendarGridProps) {
  const cells = getMonthCalendarCells(year, month)

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {WEEKDAYS_PT.map(w => (
          <div key={w} className="text-center text-gray-500 text-[10px] sm:text-xs font-medium py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 -mx-0.5 sm:mx-0">
        {cells.map((cell: CalendarCell) => {
          const punch = userId
            ? getPunchForCell(punches, userId, cell.date)
            : punches.filter(p => p.date === cell.date)
          const single = userId ? (punch as DayPunch | undefined) : undefined
          const status = cellStatus(single)
          const isSelected = selectedDate === cell.date
          const canEdit = !editableDate || cell.date === editableDate
          const clickable = Boolean(onSelectDate && cell.isCurrentMonth && canEdit)

          return (
            <button
              key={punchDayKey(userId ?? 'all', cell.date)}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelectDate?.(cell.date)}
              className={`
                ${compact ? 'min-h-[52px] sm:min-h-[64px]' : 'min-h-[52px] sm:min-h-[72px] md:min-h-[88px]'}
                rounded-md sm:rounded-lg border p-1 sm:p-1.5 text-left transition-all active:scale-[0.98]
                ${!cell.isCurrentMonth ? 'opacity-35 border-transparent bg-gray-900/30' : ''}
                ${cell.isCurrentMonth ? 'bg-gray-900 border-gray-700' : ''}
                ${cell.isToday && cell.isCurrentMonth ? 'ring-2 ring-indigo-500/60' : ''}
                ${isSelected ? 'border-indigo-500 bg-indigo-900/30' : ''}
                ${status === 'completo' && cell.isCurrentMonth ? 'border-emerald-700/50 bg-emerald-950/30' : ''}
                ${status === 'entrada' && cell.isCurrentMonth ? 'border-amber-700/50 bg-amber-950/20' : ''}
                ${clickable ? 'hover:border-gray-500 cursor-pointer' : 'cursor-default'}
                ${cell.isCurrentMonth && !canEdit && editableDate ? 'opacity-60' : ''}
              `}
            >
              <span
                className={`text-xs font-semibold ${
                  cell.isToday ? 'text-indigo-300' : cell.isCurrentMonth ? 'text-white' : 'text-gray-600'
                }`}
              >
                {cell.day}
              </span>
              {userId && cell.isCurrentMonth && (
                <>
                  <div className="mt-0.5 sm:mt-1 hidden sm:block space-y-0.5">
                    <p className="text-[10px] text-gray-500 leading-tight">
                      E: <span className="text-gray-300">{formatTimeBR(single?.entradaAt)}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      S: <span className="text-gray-300">{formatTimeBR(single?.saidaAt)}</span>
                    </p>
                  </div>
                  <div className="mt-1 flex sm:hidden justify-center gap-0.5" aria-hidden>
                    {status === 'completo' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dia completo" />
                    )}
                    {status === 'entrada' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Falta saída" />
                    )}
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
