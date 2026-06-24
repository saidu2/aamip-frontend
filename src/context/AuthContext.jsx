import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// ─── Mock users for development (remove when backend is live) ───────────────
const MOCK_USERS = {
  'admin@aamip.com':      { id: 1, full_name: 'System Admin',      email: 'admin@aamip.com',      role: 'admin',             firm: 'Prime Capital & Investment Ltd' },
  'analyst@aamip.com':    { id: 2, full_name: 'Ibrahim Musa',       email: 'analyst@aamip.com',    role: 'analyst',           firm: 'Prime Capital & Investment Ltd' },
  'pm@aamip.com':         { id: 3, full_name: 'Aisha Bello',        email: 'pm@aamip.com',         role: 'portfolio_manager', firm: 'Prime Capital & Investment Ltd' },
  'compliance@aamip.com': { id: 4, full_name: 'Compliance Officer', email: 'compliance@aamip.com', role: 'compliance',        firm: 'Prime Capital & Investment Ltd' },
  'exec@aamip.com':       { id: 5, full_name: 'Executive User',     email: 'exec@aamip.com',       role: 'executive',         firm: 'Prime Capital & Investment Ltd' },
}
const MOCK_PASSWORD = 'aamip2025'
// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('aamip-token')
    const saved = sessionStorage.getItem('aamip-user')
    if (token && saved) {
      try {
        setUser(JSON.parse(saved))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        sessionStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    // ── Try real backend first ──────────────────────────────────────────────
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = res.data
      sessionStorage.setItem('aamip-token', access_token)
      sessionStorage.setItem('aamip-user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setUser(userData)
      return userData
    } catch (err) {
      // If backend is unreachable (network error), fall through to mock login
      // If it's a 401/403 (wrong credentials), throw the error as-is
      const isNetworkError = !err.response
      if (!isNetworkError) throw err
    }

    // ── Mock login fallback (backend not running) ────────────────────────────
    const mockUser = MOCK_USERS[email.toLowerCase()]
    if (!mockUser || password !== MOCK_PASSWORD) {
      throw { response: { data: { detail: 'Invalid credentials. Use a mock account (see hint below).' } } }
    }
    const mockToken = `mock-token-${mockUser.role}-${Date.now()}`
    sessionStorage.setItem('aamip-token', mockToken)
    sessionStorage.setItem('aamip-user', JSON.stringify(mockUser))
    setUser(mockUser)
    toast('Running in demo mode — backend not connected', { icon: '⚠️' })
    return mockUser
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('aamip-token')
    sessionStorage.removeItem('aamip-user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Signed out successfully')
  }, [])

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
