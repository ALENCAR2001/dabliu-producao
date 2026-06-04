import { useState } from 'react'
import { Save, SlidersHorizontal } from 'lucide-react'
import {
  loadInsumoMinimos,
  saveInsumoMinimos,
} from '../../data/insumoMinimos'

const CAMPOS: { key: string; label: string; step?: string }[] = [
  { key: 'cola', label: 'Cola (tubos mín.)', step: '1' },
  { key: 'fita', label: 'Fita (unidades mín.)', step: '1' },
  { key: 'emulsao', label: 'Emulsão (litros mín.)', step: '0.5' },
  { key: 'desgravador', label: 'Desgravador (un. mín.)', step: '1' },
  { key: 'solvente', label: 'Solvente (latas mín.)', step: '1' },
  { key: 'tinta-default', label: 'Tinta — padrão (kg mín.)', step: '0.5' },
  { key: 'tinta-preta-gel', label: 'Preto gel (kg mín.)', step: '0.5' },
  { key: 'tinta-preta-relevo', label: 'Preto relevo (kg mín.)', step: '0.5' },
]

export function MinimosInsumosSection() {
  const [valores, setValores] = useState<Record<string, number>>(() => loadInsumoMinimos())
  const [saved, setSaved] = useState(false)

  const salvar = () => {
    saveInsumoMinimos(valores)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal size={20} className="text-amber-400" />
        <h3 className="text-white font-semibold">Estoque mínimo (alertas)</h3>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Quando a quantidade ficar abaixo desses valores, o dashboard e Insumos mostram alerta amarelo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {CAMPOS.map(c => (
          <label key={c.key} className="block">
            <span className="text-gray-400 text-xs">{c.label}</span>
            <input
              type="number"
              min={0}
              step={c.step ?? '1'}
              value={valores[c.key] ?? 0}
              onChange={e =>
                setValores(v => ({
                  ...v,
                  [c.key]: Math.max(0, Number(e.target.value.replace(',', '.')) || 0),
                }))
              }
              className="mt-1 w-full bg-gray-950 text-white rounded-lg px-3 py-2 border border-gray-700 outline-none focus:border-amber-500"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={salvar}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        <Save size={16} />
        {saved ? 'Salvo!' : 'Salvar mínimos'}
      </button>
    </div>
  )
}
