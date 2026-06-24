import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Users, Key, Building2, Plus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { ROLE_LABELS } from '../data/constants'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [newUserOpen, setNewUserOpen] = useState(false)
  const [geminiStatus, setGeminiStatus] = useState('checking')
  const [newForm, setNewForm]       = useState({ full_name: '', email: '', password: '', role: 'analyst' })
  const [creating, setCreating]     = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await authAPI.listUsers()
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const checkGemini = async () => {
    setGeminiStatus('checking')
    const key = import.meta.env.VITE_GEMINI_API_KEY
    if (!key || key === 'your_gemini_api_key_here') {
      setGeminiStatus('not_configured')
      return
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      )
      setGeminiStatus(res.ok ? 'connected' : 'error')
    } catch {
      setGeminiStatus('error')
    }
  }

  useEffect(() => { loadUsers(); checkGemini() }, [])

  const createUser = async () => {
    if (!newForm.full_name || !newForm.email || !newForm.password) {
      toast.error('All fields are required')
      return
    }
    setCreating(true)
    try {
      await authAPI.createUser(newForm)
      toast.success('User created successfully')
      setNewUserOpen(false)
      setNewForm({ full_name: '', email: '', password: '', role: 'analyst' })
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user')
    } finally { setCreating(false) }
  }

  const geminiBadge = {
    checking:       { label: 'Checking...',    cls: 'badge-muted' },
    connected:      { label: 'Connected ✓',    cls: 'badge-success' },
    not_configured: { label: 'Not Configured', cls: 'badge-warning' },
    error:          { label: 'Error',          cls: 'badge-danger' },
  }[geminiStatus]

  return (
    <>
      <Modal open={newUserOpen} onClose={() => setNewUserOpen(false)} title="Add Staff User" size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNewUserOpen(false)}>Cancel</Button>
            <Button variant="primary"   size="sm" loading={creating} onClick={createUser}>Create User</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', key: 'full_name', type: 'text',     placeholder: 'e.g. Ibrahim Musa' },
            { label: 'Email',     key: 'email',     type: 'email',    placeholder: 'user@yourfirm.com' },
            { label: 'Password',  key: 'password',  type: 'password', placeholder: 'Minimum 8 characters' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={newForm[f.key]}
                onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
            <select value={newForm.role} onChange={e => setNewForm(p => ({ ...p, role: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
              <option value="analyst">Investment Analyst</option>
              <option value="portfolio_manager">Portfolio Manager</option>
              <option value="compliance">Compliance Officer</option>
              <option value="executive">Executive</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
        </div>
      </Modal>

      <PageWrapper title="Settings">
        {/* Firm Info */}
        <Card title="Firm Information" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Firm Name',    value: 'Prime Capital & Investment Ltd' },
              { label: 'Regulator',    value: 'Securities and Exchange Commission, Nigeria' },
              { label: 'Platform',     value: 'AAMIP v1.0' },
              { label: 'Environment',  value: 'Local Development' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Config */}
        <Card title="AI Configuration" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Key size={14} style={{ color: 'var(--gold-primary)' }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Gemini API Key</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                  {import.meta.env.VITE_GEMINI_API_KEY
                    ? `${import.meta.env.VITE_GEMINI_API_KEY.slice(0, 8)}••••••••••••`
                    : 'Not set — add VITE_GEMINI_API_KEY to .env'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${geminiBadge.cls}`}>{geminiBadge.label}</span>
              <Button variant="ghost" size="sm" onClick={checkGemini}><RefreshCw size={12} /></Button>
            </div>
          </div>
          {geminiStatus === 'not_configured' && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--warning-bg)', borderRadius: 6, fontSize: 12, color: 'var(--warning)' }}>
              Add <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>VITE_GEMINI_API_KEY=your_key</code> to your <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>aamip-frontend/.env</code> file and restart the dev server.
            </div>
          )}
          {geminiStatus === 'connected' && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--success-bg)', borderRadius: 6, fontSize: 12, color: 'var(--success)' }}>
              Gemini API is connected and ready. AI analysis buttons are active.
            </div>
          )}
        </Card>

        {/* Users */}
        <Card
          title="Staff Users"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost"    onClick={loadUsers}><RefreshCw size={12} /></Button>
              <Button size="sm" variant="primary"  onClick={() => setNewUserOpen(true)}><Plus size={13} /> Add User</Button>
            </div>
          }
        >
          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading users...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th style={{ textAlign: 'center' }}>Status</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{u.email}</td>
                    <td><span className="badge badge-gold">{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
