import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, Layers, Package, Settings, Menu, X, LogOut, User, Clock, Boxes, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Layouts from './pages/Layouts'
import Producao from './pages/Producao'
import Administracao from './pages/Administracao'
import Ponto from './pages/Ponto'
import PontoAdmin from './pages/PontoAdmin'
import Estoque from './pages/Estoque'
import RelatorioFinanceiro from './pages/RelatorioFinanceiro'
import Login from './pages/Login'
import { APP_NAME } from './config/brand'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { RequireAuth } from './components/RequireAuth'
import { RequireAdmin } from './components/RequireAdmin'

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { session, isAdmin, isFuncionario, logout } = useAuth()

  const adminMenu = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/layouts', name: 'Layouts', icon: Layers },
    { path: '/producao', name: 'Produção', icon: Package },
    { path: '/estoque', name: 'Insumos', icon: Boxes },
    { path: '/financeiro', name: 'Financeiro', icon: Wallet },
    { path: '/ponto-admin', name: 'Ponto (equipe)', icon: Clock },
    { path: '/administracao', name: 'Administração', icon: Settings },
  ]

  const funcionarioMenu = [
    { path: '/layouts', name: 'Layouts', icon: Layers },
    { path: '/producao', name: 'Produção', icon: Package },
    { path: '/ponto', name: 'Meu ponto', icon: Clock },
  ]

  const menuItems = isAdmin ? adminMenu : funcionarioMenu
  const pageTitle =
    menuItems.find(item => item.path === location.pathname)?.name ?? APP_NAME

  useEffect(() => {
    if (!sidebarOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [sidebarOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const close = () => setSidebarOpen(false)
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  return (
    <div className="flex h-dvh min-h-dvh max-h-dvh bg-gray-900 overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-[min(18rem,85vw)] max-w-xs bg-gray-800 transition-transform duration-300 flex flex-col
        pt-[env(safe-area-inset-top,0px)]
        lg:relative lg:translate-x-0 lg:w-64 lg:max-w-none lg:shrink-0
      `}
      >
        <div className="p-4 flex justify-between items-start border-b border-gray-700 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-white font-bold text-xl">{APP_NAME}</span>
            {isFuncionario && (
              <p className="text-emerald-400 text-[10px] font-medium uppercase tracking-wide mt-2">
                Modo funcionário
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden p-2 hover:bg-gray-700 rounded-lg"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 min-h-[48px] rounded-lg transition-all active:scale-[0.98] ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="flex items-center gap-2 px-1 text-gray-400 text-sm">
            <User size={16} className="shrink-0" />
            <span className="truncate">{session?.nome}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout()
              setSidebarOpen(false)
            }}
            className="w-full flex items-center gap-2 p-3 min-h-[48px] rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white active:scale-[0.98]"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden">
        <header className="bg-gray-800 px-3 py-2 border-b border-gray-700 sticky top-0 z-40 lg:hidden shrink-0 flex items-center gap-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="touch-target text-white hover:bg-gray-700 rounded-lg shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-base truncate">{pageTitle}</p>
            <p className="text-gray-500 text-[10px] truncate">{session?.nome}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={isAdmin ? <Dashboard /> : <Navigate to="/layouts" replace />}
            />
            <Route path="/layouts" element={<Layouts />} />
            <Route path="/producao" element={<Producao />} />
            <Route path="/ponto" element={<Ponto />} />
            <Route
              path="/estoque"
              element={
                <RequireAdmin>
                  <Estoque />
                </RequireAdmin>
              }
            />
            <Route
              path="/financeiro"
              element={
                <RequireAdmin>
                  <RelatorioFinanceiro />
                </RequireAdmin>
              }
            />
            <Route
              path="/ponto-admin"
              element={
                <RequireAdmin>
                  <PontoAdmin />
                </RequireAdmin>
              }
            />
            <Route
              path="/administracao"
              element={
                <RequireAdmin>
                  <Administracao />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to={isAdmin ? '/' : '/layouts'} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
