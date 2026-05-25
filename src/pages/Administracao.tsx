function Administracao() {
  return (
    <div>
      <header className="bg-gray-800 p-4 border-b border-gray-700 sticky top-0 z-40">
        <h1 className="text-white text-xl font-bold">Administração</h1>
        <p className="text-gray-400 text-xs mt-0.5">Configurações do sistema</p>
      </header>
      
      <div className="p-4 space-y-3">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold">Funcionários</h3>
          <p className="text-gray-400 text-sm">Gerenciar acesso dos funcionários</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold">Categorias</h3>
          <p className="text-gray-400 text-sm">Gerenciar categorias dos layouts</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold">Backup</h3>
          <p className="text-gray-400 text-sm">Exportar dados do sistema</p>
        </div>
      </div>
    </div>
  )
}

export default Administracao