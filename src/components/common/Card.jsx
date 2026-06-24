export default function Card({ children, title, subtitle, action, elevated = false, goldAccent = false, className = '', style = {} }) {
  return (
    <div
      className={elevated ? 'card-elevated' : 'card'}
      style={{
        borderLeft: goldAccent ? '3px solid var(--gold-primary)' : undefined,
        ...style,
      }}
    >
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            {title && <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={className} style={{ padding: title || action ? '16px 18px' : '16px 18px' }}>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ label, value, change, changeLabel, icon: Icon, accent = false }) {
  const positive = change > 0
  const negative = change < 0

  return (
    <div className="card" style={{ borderLeft: accent ? '3px solid var(--gold-primary)' : undefined, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</span>
        {Icon && (
          <span style={{ color: 'var(--gold-primary)', opacity: 0.8 }}><Icon size={16} /></span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>{value}</div>
      {change !== undefined && (
        <div style={{ marginTop: 6, fontSize: 11, color: positive ? 'var(--success)' : negative ? 'var(--danger)' : 'var(--text-muted)' }}>
          {positive ? '▲' : negative ? '▼' : '—'} {Math.abs(change).toFixed(2)}% {changeLabel || ''}
        </div>
      )}
    </div>
  )
}
