import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Search, PieChart, ShieldAlert,
  FileText, Archive, ClipboardCheck, Settings, ChevronLeft, ChevronRight,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { NAV_ITEMS } from '../../data/constants'

const ICON_MAP = {
  LayoutDashboard, TrendingUp, Search, PieChart, ShieldAlert,
  FileText, Archive, ClipboardCheck, Settings,
}

export default function Sidebar() {
  const { user } = useAuth()
  const { sidebarOpen, toggleSidebar } = useApp()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role))

  return (
    <aside style={{
      width: sidebarOpen ? 'var(--sidebar-width)' : 64,
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 64,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BarChart3 size={16} color="#0A0E1A" strokeWidth={2.5} />
        </div>
        {sidebarOpen && (
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

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map(item => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                background: isActive ? 'var(--gold-subtle)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold-primary)' : '2px solid transparent',
                transition: 'all 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('gold-subtle'))
                  e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('gold-subtle'))
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {sidebarOpen && (
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle button */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={toggleSidebar}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6,
            background: 'var(--bg-hover)', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-end' : 'center', gap: 6,
            transition: 'color 0.15s',
          }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Collapse</span><ChevronLeft size={14} /></>
            : <ChevronRight size={14} />
          }
        </button>
      </div>
    </aside>
  )
}
