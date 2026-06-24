import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import CSVUploadModal from '../components/common/CSVUploadModal'
import { Search, Sparkles, Upload, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { stocksAPI, aiAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function StockResearch() {
  const [stocks, setStocks]             = useState([])
  const [fundamentals, setFundamentals] = useState({})
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState(null)
  const [selectedFund, setSelectedFund] = useState(null)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiResult, setAiResult]         = useState('')
  const [aiError, setAiError]           = useState('')
  const [updatedSignals, setUpdatedSignals] = useState(null)
  const [history, setHistory]           = useState([])
  const [uploadOpen, setUploadOpen]     = useState(false)
  const [uploadType, setUploadType]     = useState('company_financials')

  const loadStocks = async () => {
    setLoading(true)
    try {
      const res = await stocksAPI.list()
      setStocks(res.data)
      // Load fundamentals (P/E etc) in bulk
      try {
        const fundRes = await stocksAPI.getAllFundamentals()
        const map = {}
        fundRes.data.forEach(f => { map[f.ticker] = f })
        setFundamentals(map)
      } catch {}
    } catch {
      toast.error('Failed to load stocks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStocks() }, [])

  const openAnalysis = async (stock) => {
    setSelected(stock)
    setSelectedFund(fundamentals[stock.ticker] || null)
    setAiResult('')
    setAiError('')
    setUpdatedSignals(null)
    setAnalysisOpen(true)
    try {
      const res = await stocksAPI.getResearch(stock.ticker)
      setHistory(res.data)
    } catch { setHistory([]) }
  }

  const runAIAnalysis = async () => {
    setAiLoading(true)
    setAiResult('')
    setAiError('')
    setUpdatedSignals(null)
    try {
      const res = await aiAPI.analyzeStock(selected.ticker)
      setAiResult(res.data.analysis)

      if (res.data.fundamentals_used) {
        setSelectedFund(prev => ({ ...prev, ...res.data.fundamentals_used, ticker: selected.ticker }))
      }

      if (res.data.signals_updated) {
        setUpdatedSignals({
          recommendation: res.data.recommendation,
          risk_level:     res.data.risk_level,
        })
        setStocks(prev => prev.map(s =>
          s.ticker === selected.ticker
            ? { ...s, recommendation: res.data.recommendation || s.recommendation, risk_level: res.data.risk_level || s.risk_level }
            : s
        ))
        setSelected(prev => ({
          ...prev,
          recommendation: res.data.recommendation || prev.recommendation,
          risk_level:     res.data.risk_level     || prev.risk_level,
        }))
      }

      toast.success('AI analysis complete — grounded in real fundamentals')
      const hRes = await stocksAPI.getResearch(selected.ticker)
      setHistory(hRes.data)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI analysis failed'
      setAiError(msg)
      toast.error(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = stocks.filter(s =>
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.sector || '').toLowerCase().includes(search.toLowerCase())
  )

  const fmtPE = (pe) => pe ? `${pe}x` : '—'

  return (
    <>
      <CSVUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultType={uploadType}
        onUploadComplete={() => { setUploadOpen(false); loadStocks() }}
      />

      <PageWrapper
        title="Stock Research"
        actions={
          <>
            <Button variant="ghost"     size="sm" onClick={loadStocks}><RefreshCw size={13} /></Button>
            <Button variant="secondary" size="sm" onClick={() => { setUploadType('market_prices'); setUploadOpen(true) }}><Upload size={13} /> Prices</Button>
            <Button variant="primary"   size="sm" onClick={() => { setUploadType('company_financials'); setUploadOpen(true) }}><Upload size={13} /> Financials</Button>
          </>
        }
      >
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

        <Card title="NGX Listed Companies" subtitle={filtered.length + ' stocks · P/E auto-calculated from uploaded price + EPS data'}>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading stocks...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Company</th><th>Sector</th>
                  <th style={{ textAlign: 'right' }}>P/E Ratio</th>
                  <th style={{ textAlign: 'center' }}>Signal</th>
                  <th style={{ textAlign: 'center' }}>Risk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const f = fundamentals[s.ticker]
                  return (
                    <tr key={s.ticker}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span></td>
                      <td style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                      <td><span className="badge badge-muted">{s.sector || '—'}</span></td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: f && f.pe_ratio ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {f ? fmtPE(f.pe_ratio) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${s.recommendation === 'BUY' ? 'badge-success' : s.recommendation === 'SELL' ? 'badge-danger' : 'badge-warning'}`}>
                          {s.recommendation}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${s.risk_level === 'LOW' ? 'badge-success' : s.risk_level === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => openAnalysis(s)}>
                          <Sparkles size={12} /> Analyse
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* AI Analysis Modal */}
        <Modal
          open={analysisOpen}
          onClose={() => setAnalysisOpen(false)}
          title={'AI Research — ' + selected?.name + ' (' + selected?.ticker + ')'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setAnalysisOpen(false)}>Close</Button>
              <Button variant="primary" size="sm" loading={aiLoading} onClick={runAIAnalysis}>
                <Sparkles size={13} /> {aiResult ? 'Re-run Analysis' : 'Run AI Analysis'}
              </Button>
            </>
          }
        >
          {/* Fundamentals snapshot — the actual numbers backing the recommendation */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Fundamentals used in analysis
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Price',  value: selectedFund?.price ? `₦${selectedFund.price}` : '—' },
                { label: 'EPS',    value: selectedFund?.eps ?? '—' },
                { label: 'P/E Ratio', value: selectedFund?.pe_ratio ? `${selectedFund.pe_ratio}x` : 'No data' },
                { label: 'ROE',    value: selectedFund?.roe ? `${selectedFund.roe}%` : '—' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
            {(!selectedFund?.pe_ratio) && (
              <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 8 }}>
                ⚠ No P/E data yet — upload Financials (EPS) and Prices for this stock to enable fact-grounded valuation.
              </p>
            )}
          </div>

          {/* Updated signals banner */}
          {updatedSignals && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--success)' }}>
                Signals updated from AI analysis —
                {updatedSignals.recommendation && <strong> Recommendation: {updatedSignals.recommendation}</strong>}
                {updatedSignals.recommendation && updatedSignals.risk_level && ' · '}
                {updatedSignals.risk_level && <strong> Risk: {updatedSignals.risk_level}</strong>}
              </span>
            </div>
          )}

          {/* AI Result area */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 16, minHeight: 200 }}>
            {aiLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '30px 0' }}>
                <svg className="animate-spin" style={{ width: 22, height: 22, color: 'var(--gold-primary)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generating fact-grounded research note...</span>
              </div>
            )}
            {!aiLoading && aiError && (
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>AI analysis failed</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{aiError}</p>
                </div>
              </div>
            )}
            {!aiLoading && !aiError && !aiResult && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '30px 0', textAlign: 'center' }}>
                <Sparkles size={24} style={{ color: 'var(--gold-primary)', opacity: 0.6 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Click <strong style={{ color: 'var(--gold-light)' }}>Run AI Analysis</strong> for a BUY/HOLD/SELL call grounded in P/E, EPS and ROE for <strong style={{ color: 'var(--text-secondary)' }}>{selected?.ticker}</strong>
                </p>
                {history.length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{history.length} previous {history.length === 1 ? 'analysis' : 'analyses'} saved in Research Repository</p>
                )}
              </div>
            )}
            {!aiLoading && aiResult && (
              <pre style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{aiResult}</pre>
            )}
          </div>
        </Modal>
      </PageWrapper>
    </>
  )
}
