import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Layers, Package, Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Layouts from './pages/Layouts'
import Producao from './pages/Producao'
import Administracao from './pages/Administracao'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/layouts', name: 'Layouts', icon: Layers },
    { path: '/producao', name: 'Produção', icon: Package },
    { path: '/administracao', name: 'Administração', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-900">
      {/* SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 z-50 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-64 bg-gray-800 transition-transform duration-300
        lg:relative lg:translate-x-0
      `}>
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <span className="text-white font-bold text-xl">DABLIU</span>
          <button onClick={() => setSidebarOpen(false)} className="text-white lg:hidden">
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 w-full lg:w-auto overflow-auto">
        <header className="bg-gray-800 p-3 border-b border-gray-700 sticky top-0 z-40">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="text-white p-2 hover:bg-gray-700 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>
        </header>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/layouts" element={<Layouts />} />
          <Route path="/producao" element={<Producao />} />
          <Route path="/administracao" element={<Administracao />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App