import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/layout/Sidebar'
import { Menu } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MarketIntelligence from './pages/MarketIntelligence'
import StockResearch from './pages/StockResearch'
import Portfolio from './pages/Portfolio'
import RiskManagement from './pages/RiskManagement'
import Reports from './pages/Reports'
import ResearchRepository from './pages/ResearchRepository'
import Compliance from './pages/Compliance'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg className="animate-spin" style={{ width: 28, height: 28, color: 'var(--gold-primary)', margin: '0 auto 12px' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading AAMIP...</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function MobileMenuButton() {
  const { toggleSidebar } = useApp()
  return (
    <button
      onClick={toggleSidebar}
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 100,
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--gold-primary)', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,168,76,0.4)',
      }}
      className="mobile-menu-btn"
    >
      <Menu size={20} color="#0A0E1A" />
    </button>
  )
}

function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Routes>
          <Route path="/"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/market"     element={<MarketIntelligence />} />
          <Route path="/research"   element={<StockResearch />} />
          <Route path="/portfolio"  element={<Portfolio />} />
          <Route path="/risk"       element={<RiskManagement />} />
          <Route path="/reports"    element={<Reports />} />
          <Route path="/repository" element={<ResearchRepository />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <MobileMenuButton />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*"     element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
