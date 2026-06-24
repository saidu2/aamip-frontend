import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Search, Archive, RefreshCw, Sparkles } from 'lucide-react'
import { stocksAPI } from '../utils/api'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function ResearchRepository() {
  const [stocks, setStocks]       = useState([])
  const [research, setResearch]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [viewOpen, setViewOpen]   = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const stockRes = await stocksAPI.list()
      const stocks   = stockRes.data

      // Load research for all stocks in parallel
      const researchResults = await Promise.allSettled(
        stocks.map(s => stocksAPI.getResearch(s.ticker).then(r => r.data.map(item => ({
          ...item,
          stock_name: s.name,
          sector:     s.sector,
        }))))
      )

      const allResearch = researchResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setStocks(stocks)
      setResearch(allResearch)
    } catch {
      toast.error('Failed to load research repository')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const filtered = research.filter(r =>
    r.ticker.toLowerCase().includes(search.toLowerCase()) ||
    (r.stock_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.sector || '').toLowerCase().includes(search.toLowerCase())
  )

  const openView = (item) => { setSelected(item); setViewOpen(true) }

  return (
    <>
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Research — ${selected?.stock_name} (${selected?.ticker})`}
        size="lg"
        footer={<Button variant="secondary" size="sm" onClick={() => setViewOpen(false)}>Close</Button>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Ticker',     value: selected?.ticker },
            { label: 'Sector',     value: selected?.sector || '—' },
            { label: 'Date',       value: formatDate(selected?.created_at) },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
          <pre style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {selected?.analysis_text}
          </pre>
        </div>
      </Modal>

      <PageWrapper
        title="Research Repository"
        actions={<Button variant="ghost" size="sm" onClick={loadAll}><RefreshCw size={13} /></Button>}
      >
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Research Notes', value: research.length },
            { label: 'Stocks Covered',        value: [...new Set(research.map(r => r.ticker))].length },
            { label: 'Stocks in Database',    value: stocks.length },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '16px 18px', borderLeft: '3px solid var(--gold-primary)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Search by ticker, company or sector..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-default)'}
          />
        </div>

        <Card title="AI Research Notes" subtitle={`${filtered.length} records`}>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading research...</div>
          ) : research.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Sparkles size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>No research notes yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Go to Stock Research → click Analyse on any stock to generate AI research</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Date</th>
                  <th>Model</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{r.ticker}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{r.stock_name || '—'}</td>
                    <td><span className="badge badge-muted">{r.sector || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</td>
                    <td style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{r.model_used || 'gemini'}</td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => openView(r)}>
                        <Archive size={12} /> View
                      </Button>
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
