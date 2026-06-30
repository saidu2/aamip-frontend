import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const getInitial = () => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  }

  const [sidebarOpen, setSidebarOpen] = useState(getInitial)
  const [theme, setTheme] = useState('dark')

  const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), [])

  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
