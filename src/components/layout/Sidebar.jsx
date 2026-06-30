import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, Search, PieChart, ShieldAlert,
  FileText, Archive, ClipboardCheck, Settings, ChevronLeft, ChevronRight, BarChart3, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { NAV_ITEMS } from '../../data/constants'

const ICON_MAP = {
  LayoutDashboard, TrendingUp, Search, PieChart, ShieldAlert,
  FileText, Archive, ClipboardCheck, Settings,
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

export default function Sidebar() {
  const { user } = useAuth()
  const { sidebarOpen, toggleSidebar } = useApp()
  const isMobile = useIsMobile()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role))

  // On mobile: closed by default look — sidebar slides in as overlay when sidebarOpen is true
  const mobileOpen = isMobile && sidebarOpen
  const desktopWidth = sidebarOpen ? 260 : 64

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={toggleSidebar}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90 }}
        />
      )}

      <aside style={{
        width: isMobile ? 260 : desktopWidth,
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile ? 'transform 0.25s ease' : 'width 0.25s ease',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 95,
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, minHeight: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BarChart3 size={16} color="#0A0E1A" strokeWidth={2.5} />
            </div>
            {(sidebarOpen || isMobile) && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: 'var(--gold-light)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                  AAMIP
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Intelligence Platform
                </div>
              </div>
            )}
          </div>
          {isMobile && (
            <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleItems.map(item => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isMobile ? toggleSidebar : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6, marginBottom: 2,
                  textDecoration: 'none',
                  color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--gold-subtle)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--gold-primary)' : '2px solid transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                })}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {(sidebarOpen || isMobile) && <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Toggle button — desktop only */}
        {!isMobile && (
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={toggleSidebar}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 6,
                background: 'var(--bg-hover)', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-end' : 'center', gap: 6,
              }}
            >
              {sidebarOpen
                ? <><span style={{ fontSize: 11 }}>Collapse</span><ChevronLeft size={14} /></>
                : <ChevronRight size={14} />}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
