import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { monthLabel } from '../../utils/calendar'
import { filterEntriesByMonth } from '../../utils/exportCsv'
import { exportInsumosCsv, exportPontoCsv, exportProducaoCsv } from '../../utils/exportRelatorios'
import { listInsumos } from '../../services/insumosService'
import { listProducaoEntries } from '../../services/productionService'
import { listPontoMonth } from '../../services/pontoService'

export function RelatoriosSection() {
  const [loading, setLoading] = useState<string | null>(null)
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const titulo = monthLabel(y, m)

  const run = async (key: string, fn: () => Promise<void>) => {
    setLoading(key)
    try {
      await fn()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao exportar')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet size={20} className="text-emerald-400" />
        <h3 className="text-white font-semibold">Relatórios (Excel / CSV)</h3>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Baixe planilhas do mês atual ({titulo}) para conferência, RH ou arquivo.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={() =>
            void run('prod', async () => {
              const all = await listProducaoEntries()
              const mes = filterEntriesByMonth(all, y, m)
              exportProducaoCsv(mes, titulo)
            })
          }
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <Download size={16} />
          {loading === 'prod' ? 'Gerando…' : 'Produção do mês'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() =>
            void run('ponto', async () => {
              const punches = await listPontoMonth(y, m)
              exportPontoCsv(punches, titulo)
            })
          }
          className="flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <Download size={16} />
          {loading === 'ponto' ? 'Gerando…' : 'Ponto do mês'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() =>
            void run('ins', async () => {
              const items = await listInsumos()
              exportInsumosCsv(items)
            })
          }
          className="flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <Download size={16} />
          {loading === 'ins' ? 'Gerando…' : 'Insumos agora'}
        </button>
      </div>
    </div>
  )
}
