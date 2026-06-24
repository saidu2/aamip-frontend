import Topbar from './Topbar'

export default function PageWrapper({ title, children, actions }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <Topbar title={title} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-primary)' }}>
        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, gap: 8 }}>
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
