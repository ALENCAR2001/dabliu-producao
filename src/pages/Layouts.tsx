import { Plus, Search } from 'lucide-react'

function Layouts() {
  return (
    <div>
      <header className="bg-gray-800 p-4 border-b border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Layouts</h1>
            <p className="text-gray-400 text-xs mt-0.5">Gerencie seus layouts</p>
          </div>
          <button className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-700">
            <Plus size={20} />
          </button>
        </div>
      </header>
      
      <div className="p-4">
        <div className="bg-gray-800 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar layout..." 
              className="bg-transparent text-white flex-1 outline-none"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold">Camisa Polo Verão</h3>
            <p className="text-gray-400 text-sm mt-1">Código: POL-001</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">P: 50</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">M: 80</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">G: 60</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">GG: 40</span>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold">Regata Treino</h3>
            <p className="text-gray-400 text-sm mt-1">Código: REG-002</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">P: 30</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">M: 45</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">G: 35</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">GG: 20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layouts