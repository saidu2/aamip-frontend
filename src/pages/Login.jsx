import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BarChart3, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(26,38,64,0.8) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 32px var(--gold-glow)',
          }}>
            <BarChart3 size={24} color="#0A0E1A" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--gold-light)', letterSpacing: '0.04em' }}>
            AAMIP
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Asset Management Intelligence Platform
          </p>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: '32px 28px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Sign in to your account</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>Authorised staff only. All access is logged.</p>

          <div className="gold-divider" style={{ marginBottom: 24 }} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="analyst@yourfirm.com"
                  style={{
                    width: '100%', padding: '10px 12px 10px 34px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                    borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 36px 10px 34px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                    borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2,
                }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '11px 0',
                background: loading ? 'var(--gold-dim)' : 'var(--gold-primary)',
                color: '#0A0E1A', fontWeight: 700, fontSize: 13,
                border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <svg className="animate-spin" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Dev hint — ONLY shown on localhost, hidden on production */}
        {isLocalhost && (
          <div style={{ marginTop: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--gold-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Dev Mode — Mock Accounts (localhost only)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['admin@aamip.com',      'Admin'],
                ['analyst@aamip.com',    'Analyst'],
                ['pm@aamip.com',         'Portfolio Manager'],
                ['compliance@aamip.com', 'Compliance'],
                ['exec@aamip.com',       'Executive'],
              ].map(([email, role]) => (
                <div key={email}
                  onClick={() => setForm({ email, password: 'aamip2025' })}
                  style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '3px 0' }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{email}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{role}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              Password: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>aamip2025</span>
              {' '}· Click any email to autofill
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Regulated by the Securities and Exchange Commission, Nigeria
        </p>
      </div>
    </div>
  )
}
