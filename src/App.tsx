import { lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from './components/layout/Layout'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'

// Páginas carregadas sob demanda (code-splitting por rota)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pagamentos = lazy(() => import('./pages/transacoes/Pagamentos'))
const Med = lazy(() => import('./pages/transacoes/Med'))
const Reembolsos = lazy(() => import('./pages/transacoes/Reembolsos'))
const Sellers = lazy(() => import('./pages/sellers/Sellers'))
const Kyc = lazy(() => import('./pages/sellers/Kyc'))
const SellerDetalhe = lazy(() => import('./pages/sellers/SellerDetalhe'))
const Financeiro = lazy(() => import('./pages/financeiro/Financeiro'))
const Saques = lazy(() => import('./pages/financeiro/Saques'))
const Antecipacoes = lazy(() => import('./pages/financeiro/Antecipacoes'))
const Reservas = lazy(() => import('./pages/financeiro/Reservas'))
const Consolidacao = lazy(() => import('./pages/relatorios/Consolidacao'))
const Conciliacao = lazy(() => import('./pages/relatorios/Conciliacao'))
const Antifraude = lazy(() => import('./pages/risco/Antifraude'))
const Blocklist = lazy(() => import('./pages/risco/Blocklist'))
const Taxas = lazy(() => import('./pages/gateway/Taxas'))
const Adquirentes = lazy(() => import('./pages/gateway/Adquirentes'))
const Metodos = lazy(() => import('./pages/gateway/Metodos'))
const Webhooks = lazy(() => import('./pages/gateway/Webhooks'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const Atualizacoes = lazy(() => import('./pages/Atualizacoes'))
const Administradores = lazy(() => import('./pages/admin/Administradores'))
const Permissoes = lazy(() => import('./pages/admin/Permissoes'))
const Logs = lazy(() => import('./pages/admin/Logs'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />

        {/* Transações */}
        <Route path="/transacoes" element={<Pagamentos />} />
        <Route path="/transacoes/med" element={<Med />} />
        <Route path="/transacoes/reembolsos" element={<Reembolsos />} />

        {/* Sellers */}
        <Route path="/sellers" element={<Sellers />} />
        <Route path="/sellers/kyc" element={<Kyc />} />
        <Route path="/sellers/:id" element={<SellerDetalhe />} />

        {/* Financeiro */}
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/financeiro/saques" element={<Saques />} />
        <Route path="/financeiro/antecipacoes" element={<Antecipacoes />} />
        <Route path="/financeiro/reservas" element={<Reservas />} />

        {/* Relatórios */}
        <Route path="/relatorios/consolidacao" element={<Consolidacao />} />
        <Route path="/relatorios/conciliacao" element={<Conciliacao />} />

        {/* Risco */}
        <Route path="/risco/antifraude" element={<Antifraude />} />
        <Route path="/risco/blocklist" element={<Blocklist />} />

        {/* Gateway */}
        <Route path="/gateway/taxas" element={<Taxas />} />
        <Route path="/gateway/adquirentes" element={<Adquirentes />} />
        <Route path="/gateway/metodos" element={<Metodos />} />
        <Route path="/gateway/webhooks" element={<Webhooks />} />

        {/* Clientes / Marketplace */}
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/marketplace" element={<Marketplace />} />

        {/* Plataforma */}
        <Route path="/atualizacoes" element={<Atualizacoes />} />

        {/* Administração */}
        <Route path="/admin/usuarios" element={<Administradores />} />
        <Route path="/admin/permissoes" element={<Permissoes />} />
        <Route path="/admin/logs" element={<Logs />} />

        {/* Conta */}
        <Route path="/configuracoes" element={<Configuracoes />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
