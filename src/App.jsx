import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/layout/Sidebar'
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

function ProtectedRoute({ children, roles }) {
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
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/market"      element={<MarketIntelligence />} />
          <Route path="/research"    element={<StockResearch />} />
          <Route path="/portfolio"   element={<Portfolio />} />
          <Route path="/risk"        element={<RiskManagement />} />
          <Route path="/reports"     element={<Reports />} />
          <Route path="/repository"  element={<ResearchRepository />} />
          <Route path="/compliance"  element={<Compliance roles={['admin', 'compliance']} />} />
          <Route path="/settings"    element={<Settings />} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
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
