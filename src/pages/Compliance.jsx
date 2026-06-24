import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { marketAPI } from '../utils/api'
import { formatDateTime } from '../utils/helpers'
import Button from '../components/common/Button'

export default function Compliance() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await marketAPI.getAuditLog(100)
      setLogs(res.data)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLogs() }, [])

  const todayLogs = logs.filter(l => {
    const today = new Date().toISOString().split('T')[0]
    return l.created_at?.startsWith(today)
  })

  const uniqueUsers = [...new Set(logs.map(l => l.user_email))].length

  return (
    <PageWrapper
      title="Compliance & Audit"
      actions={<Button variant="ghost" size="sm" onClick={loadLogs}><RefreshCw size={13} /></Button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Audit Events Today" value={todayLogs.length}  icon={ClipboardCheck} accent />
        <StatCard label="Total Events"        value={logs.length} />
        <StatCard label="Active Users"         value={logs.filter((l, i, a) => a.findIndex(x => x.user_name === l.user_name) === i).length} />
      </div>

      <Card title="Audit Log" subtitle="All user actions logged for SEC Nigeria compliance">
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading audit log...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No audit entries yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Action</th><th>Target</th><th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.user_name}</td>
                  <td><span className="badge badge-muted">{log.user_role}</span></td>
                  <td>{log.action}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--gold-light)' }}>{log.target || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageWrapper>
  )
}
