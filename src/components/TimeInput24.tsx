import { useState } from 'react'
import { normalizeTime24 } from '../utils/calendar'

type TimeInput24Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  label: string
  borderClass?: string
  focusClass?: string
}

export function TimeInput24({
  id,
  value,
  onChange,
  label,
  borderClass = 'border-gray-600',
  focusClass = 'focus:border-emerald-400',
}: TimeInput24Props) {
  const [error, setError] = useState<string | null>(null)

  const handleBlur = () => {
    const normalized = normalizeTime24(value)
    if (normalized === null) {
      setError('Use formato 24h, ex: 18:00 (hora de 00 a 23)')
      return
    }
    setError(null)
    if (normalized !== value) onChange(normalized)
  }

  const handleChange = (text: string) => {
    setError(null)
    const cleaned = text.replace(/[^\d:]/g, '').slice(0, 5)
    onChange(cleaned)
  }

  return (
    <div>
      <label htmlFor={id} className="text-gray-300 text-sm block mb-2 font-medium">
        {label}
        <span className="text-gray-500 font-normal ml-1">(24h)</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        lang="pt-BR"
        placeholder="18:00"
        maxLength={5}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-full bg-gray-950 text-white text-xl rounded-xl p-4 min-h-[48px] border font-mono tracking-wider ${borderClass} ${focusClass} outline-none`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <p className="text-gray-500 text-xs mt-1.5">Digite em 24 horas — ex: 08:00, 12:30, 18:00</p>
      {error && (
        <p id={`${id}-err`} className="text-red-400 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
