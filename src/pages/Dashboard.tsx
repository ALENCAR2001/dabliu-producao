import { Layers, TrendingUp, CheckCircle } from 'lucide-react'

function Dashboard() {
  return (
    <div>
      <header className="bg-gray-800 p-4 border-b border-gray-700 sticky top-0 z-40">
        <h1 className="text-white text-xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-xs mt-0.5">Visão geral da produção</p>
      </header>
      
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm">Layouts Ativos</h3>
              <Layers className="text-indigo-400" size={24} />
            </div>
            <p className="text-white text-3xl font-bold mt-2">24</p>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm">Produção Hoje</h3>
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
            <p className="text-white text-3xl font-bold mt-2">1.247</p>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-400 text-sm">Finalizados</h3>
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <p className="text-white text-3xl font-bold mt-2">47</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard