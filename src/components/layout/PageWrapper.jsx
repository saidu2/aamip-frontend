import Topbar from './Topbar'

export default function PageWrapper({ title, children, actions }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <Topbar title={title} />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        background: 'var(--bg-primary)',
      }}>
        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {actions}
          </div>
        )}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
