import { useMemo, useState } from 'react'
import { AlertCircle, HelpCircle, Send } from 'lucide-react'
import { solicitarPontoAjuda } from '../../services/pontoAjudaService'
import { toLocalYMD } from '../../utils/calendar'

type PontoAjudaFuncionarioProps = {
  userId: string
  userNome: string
}

export function PontoAjudaFuncionario({ userId, userNome }: PontoAjudaFuncionarioProps) {
  const hoje = toLocalYMD(new Date())
  const [aberto, setAberto] = useState(false)
  const [dataBR, setDataBR] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const maxData = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return toLocalYMD(d)
  })()

  const dataYMD = useMemo(() => {
    const m = dataBR.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!m) return null
    const dd = parseInt(m[1], 10)
    const mm = parseInt(m[2], 10)
    const yyyy = parseInt(m[3], 10)
    if (yyyy < 2000 || yyyy > 2100) return null
    if (mm < 1 || mm > 12) return null
    if (dd < 1 || dd > 31) return null
    const ymd = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    // valida data real (ex.: 31/02 invalida)
    const dt = new Date(`${ymd}T12:00:00`)
    if (Number.isNaN(dt.getTime())) return null
    const round = toLocalYMD(dt)
    if (round !== ymd) return null
    return ymd
  }, [dataBR])

  const setDataMask = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8) // ddmmaaaa
    const dd = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const yyyy = digits.slice(4, 8)
    const out = [dd, mm, yyyy].filter(Boolean).join('/')
    setDataBR(out)
  }

  const enviar = async () => {
    setErrMsg(null)
    if (!dataYMD) return setErrMsg('Informe a data no formato DD/MM/AAAA.')
    if (dataYMD > maxData) return setErrMsg('Só é possível pedir ajuda para dias que já passaram (até ontem).')
    if (!userId) return setErrMsg('Usuário não identificado. Saia e entre novamente.')
    setLoading(true)
    setOkMsg(null)
    try {
      await solicitarPontoAjuda(userId, userNome, dataYMD, motivo)
      setOkMsg('Pedido enviado. O administrador verá o pedido dentro do sistema.')
      setDataBR('')
      setMotivo('')
      // Mantém aberto para a confirmação ficar óbvia
      setAberto(true)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Erro ao enviar pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-950/25 border border-amber-700/40 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-amber-100 text-sm font-medium">Esqueceu de anotar em outro dia?</p>
          <p className="text-gray-400 text-xs mt-1">
            O ponto só pode ser registrado <strong className="text-gray-300">no dia de hoje</strong> (
            {new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR')}). Não é possível preencher dias
            anteriores no sistema.
          </p>
          {!aberto ? (
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-200 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-600/50 px-3 py-2 rounded-lg"
            >
              <HelpCircle size={16} />
              Preciso de ajuda
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-gray-400">
                Qual dia você esqueceu? (DD/MM/AAAA)
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex.: 27/05/2026"
                  value={dataBR}
                  onChange={e => setDataMask(e.target.value)}
                  className="mt-1 w-full bg-gray-950 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                />
              </label>
              {dataYMD && (
                <p className="text-gray-500 text-xs">
                  Data selecionada: <span className="text-gray-300">{new Date(dataYMD + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </p>
              )}
              <label className="block text-xs text-gray-400">
                Observação (opcional)
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ex.: esqueci de bater saída"
                  className="mt-1 w-full bg-gray-950 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void enviar()}
                  className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg"
                >
                  <Send size={16} />
                  {loading ? 'Enviando…' : 'Enviar para o administrador'}
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="text-gray-400 text-sm px-3 py-2 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
              {errMsg && (
                <div className="text-xs text-red-200 bg-red-950/40 border border-red-700/50 rounded-lg py-2 px-3">
                  {errMsg}
                </div>
              )}
            </div>
          )}
          {okMsg && (
            <div className="mt-3 text-xs text-emerald-200 bg-emerald-900/20 border border-emerald-700/40 rounded-lg py-2 px-3">
              {okMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
