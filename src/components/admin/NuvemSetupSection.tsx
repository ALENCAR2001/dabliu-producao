import { Cloud, ExternalLink } from 'lucide-react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getInsumosStorageMode } from '../../services/insumosService'
import { getStorageMode as getPontoMode } from '../../services/pontoService'
import { getStorageMode as getProducaoMode } from '../../services/productionService'

export function NuvemSetupSection() {
  const ok = isSupabaseConfigured()
  const tudoNuvem =
    ok &&
    getProducaoMode() === 'database' &&
    getPontoMode() === 'database' &&
    getInsumosStorageMode() === 'database'

  return (
    <div
      className={`p-4 rounded-xl border ${
        tudoNuvem ? 'bg-emerald-900/20 border-emerald-600/40' : 'bg-indigo-900/20 border-indigo-600/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Cloud size={20} className={tudoNuvem ? 'text-emerald-400' : 'text-indigo-300'} />
        <h3 className="text-white font-semibold">Nuvem (Fase 1)</h3>
      </div>
      {tudoNuvem ? (
        <p className="text-gray-300 text-sm">
          Dados de produção, ponto e insumos estão na nuvem. O time pode usar em mais de um aparelho.
        </p>
      ) : ok ? (
        <p className="text-gray-300 text-sm">
          Supabase configurado no <code className="text-indigo-200">.env</code>, mas ainda há dados só neste
          navegador. Rode <code className="text-indigo-200">npm run setup:cloud</code> e migre se necessário.
        </p>
      ) : (
        <p className="text-gray-300 text-sm">
          Sem nuvem, cada computador/celular guarda seus próprios números. Para crescer com a equipe, configure o
          Supabase (cerca de 5 minutos).
        </p>
      )}
      <p className="text-gray-500 text-xs mt-3">
        Passo a passo no arquivo <strong className="text-gray-400">docs/SETUP-RAPIDO.md</strong> na pasta do projeto.
      </p>
      <p className="text-gray-500 text-xs mt-1">
        Comandos: <code className="text-gray-400">npm run setup:cloud</code> ·{' '}
        <code className="text-gray-400">npm run configurar</code>
      </p>
      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-indigo-400 text-xs mt-3 hover:underline"
      >
        Abrir painel Supabase
        <ExternalLink size={12} />
      </a>
    </div>
  )
}
