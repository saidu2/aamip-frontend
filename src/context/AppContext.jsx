import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme]             = useState('dark') // 'dark' | 'light' — Phase 2

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
