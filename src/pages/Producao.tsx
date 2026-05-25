function Producao() {
  return (
    <div>
      <header className="bg-gray-800 p-4 border-b border-gray-700 sticky top-0 z-40">
        <h1 className="text-white text-xl font-bold">Produção</h1>
        <p className="text-gray-400 text-xs mt-0.5">Registre a produção do dia</p>
      </header>
      
      <div className="p-4">
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Camisa Polo Verão</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tamanho P</span>
              <div className="flex items-center gap-3">
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">-</button>
                <span className="text-white text-xl font-bold w-12 text-center">0</span>
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">+</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tamanho M</span>
              <div className="flex items-center gap-3">
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">-</button>
                <span className="text-white text-xl font-bold w-12 text-center">0</span>
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">+</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tamanho G</span>
              <div className="flex items-center gap-3">
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">-</button>
                <span className="text-white text-xl font-bold w-12 text-center">0</span>
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">+</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tamanho GG</span>
              <div className="flex items-center gap-3">
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">-</button>
                <span className="text-white text-xl font-bold w-12 text-center">0</span>
                <button className="bg-gray-700 w-8 h-8 rounded-lg text-white text-xl">+</button>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-white text-2xl font-bold">0</span>
              </div>
            </div>
            
            <button className="w-full bg-indigo-600 py-3 rounded-lg text-white font-semibold mt-4">
              Salvar Contagem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Producao