import { Link } from 'react-router-dom'
import { Shield, User, Layers, Package, LayoutDashboard, Settings, Clock, Boxes, Wallet } from 'lucide-react'
import { MinimosInsumosSection } from '../components/admin/MinimosInsumosSection'
import { PontoAjudaAdminPanel } from '../components/admin/PontoAjudaAdminPanel'
import { RelatoriosSection } from '../components/admin/RelatoriosSection'
import { NuvemSetupSection } from '../components/admin/NuvemSetupSection'
import { UsuariosAdminSection } from '../components/admin/UsuariosAdminSection'
import { useAuth } from '../hooks/useAuth'

function Administracao() {
  const { session } = useAuth()

  return (
    <div>
      <header className="page-header">
        <h1 className="text-white text-xl font-bold">Administração</h1>
        <p className="text-gray-400 text-xs mt-0.5">Portaria do sistema e configurações</p>
      </header>

      <div className="page-body space-y-4 max-w-3xl">
        <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-indigo-300 mb-2">
            <Shield size={20} />
            <h2 className="text-white font-semibold">Você está como administrador</h2>
          </div>
          <p className="text-gray-300 text-sm">
            Logado como <span className="text-white font-medium">{session?.nome}</span>. Acesso completo: layouts,
            produção, dashboard e esta área.
          </p>
        </div>

        <PontoAjudaAdminPanel />

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold mb-3">Portaria — quem vê o quê</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <User size={18} />
                <span className="font-semibold text-white">Funcionário</span>
              </div>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Layers size={14} /> Layouts (consulta + PDF)
                </li>
                <li className="flex items-center gap-2">
                  <Package size={14} /> Produção (contagem + histórico)
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={14} /> Meu ponto (entrada e saída)
                </li>
              </ul>
              <p className="text-gray-500 text-xs mt-3">Não cadastra nem edita layouts.</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Shield size={18} />
                <span className="font-semibold text-white">Administrador</span>
              </div>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <LayoutDashboard size={14} /> Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Layers size={14} /> Layouts (cadastro completo)
                </li>
                <li className="flex items-center gap-2">
                  <Package size={14} /> Produção + banco de dados
                </li>
                <li className="flex items-center gap-2">
                  <Boxes size={14} /> Insumos (cola, tinta, fita, emulsão…)
                </li>
                <li className="flex items-center gap-2">
                  <Wallet size={14} /> Relatório financeiro
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={14} /> Ponto de toda a equipe
                </li>
                <li className="flex items-center gap-2">
                  <Settings size={14} /> Administração
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Link
          to="/estoque"
          className="block bg-violet-900/25 border border-violet-600/40 rounded-xl p-4 hover:bg-violet-900/40 transition-colors mb-3"
        >
          <div className="flex items-center gap-2 text-violet-300">
            <Boxes size={20} />
            <span className="text-white font-semibold">Controle de insumos</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Cola, tinta, fita, emulsão, desgravador e solvente
          </p>
        </Link>

        <Link
          to="/financeiro"
          className="block bg-emerald-900/25 border border-emerald-600/40 rounded-xl p-4 hover:bg-emerald-900/40 transition-colors mb-3"
        >
          <div className="flex items-center gap-2 text-emerald-300">
            <Wallet size={20} />
            <span className="text-white font-semibold">Relatório financeiro</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Entradas, saídas, lucro e gastos por insumo no mês
          </p>
        </Link>

        <Link
          to="/ponto-admin"
          className="block bg-indigo-900/30 border border-indigo-600/40 rounded-xl p-4 hover:bg-indigo-900/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-indigo-300">
            <Clock size={20} />
            <span className="text-white font-semibold">Ver ponto de todos os funcionários</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Calendário mensal e tabela por funcionário</p>
        </Link>

        <NuvemSetupSection />

        <UsuariosAdminSection />

        <RelatoriosSection />

        <MinimosInsumosSection />
      </div>
    </div>
  )
}

export default Administracao
