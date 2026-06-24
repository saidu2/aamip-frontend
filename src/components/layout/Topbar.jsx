import { Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../data/constants'
import { initials } from '../../utils/helpers'
import { useState } from 'react'

export default function Topbar({ title }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      height: 56,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      {/* Page title */}
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '0.01em',
      }}>
        {title}
      </h1>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Notifications */}
        <button style={{
          width: 34, height: 34, borderRadius: 6,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={15} />
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 6px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#0A0E1A',
            }}>
              {initials(user?.full_name || user?.email)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user?.full_name || 'User'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 8, padding: 6, minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200,
            }}>
              <button
                onClick={() => { setMenuOpen(false) }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 5,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 12,
                }}
              >
                <User size={13} /> Profile
              </button>
              <div className="gold-divider" style={{ margin: '4px 0' }} />
              <button
                onClick={() => { setMenuOpen(false); logout() }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 5,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--danger)', fontSize: 12,
                }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
