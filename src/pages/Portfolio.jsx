import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import CSVUploadModal from '../components/common/CSVUploadModal'
import { Plus, ArrowLeft, Sparkles, Upload, TrendingUp, PieChart, ShieldCheck, BarChart3, AlertTriangle, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts'
import { portfoliosAPI, stocksAPI, aiAPI } from '../utils/api'
import toast from 'react-hot-toast'

const SECTOR_COLORS = {
  'Banking': '#C9A84C', 'Industrial Goods': '#3498DB', 'ICT': '#2ECC71',
  'Consumer Goods': '#9B59B6', 'Oil & Gas': '#E67E22', 'Construction': '#1ABC9C', 'Others': '#5A6A88',
}

const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function getSectorAllocation(rows) {
  const map = {}
  rows.forEach(r => { map[r.sector || 'Others'] = (map[r.sector || 'Others'] || 0) + (r.current_value || 0) })
  const total = Object.values(map).reduce((a, b) => a + b, 0)
  return Object.entries(map).map(([name, value]) => ({
    name, value: +((value / total) * 100).toFixed(1), color: SECTOR_COLORS[name] || SECTOR_COLORS['Others'],
  }))
}

export default function Portfolio() {
  const [view, setView]               = useState('list')
  const [portfolios, setPortfolios]   = useState([])
  const [selected, setSelected]       = useState(null)
  const [holdings, setHoldings]       = useState([])
  const [stocksList, setStocksList]   = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Modals
  const [aiOpen, setAiOpen]                   = useState(false)
  const [aiLoading, setAiLoading]             = useState(false)
  const [aiResult, setAiResult]               = useState('')
  const [aiError, setAiError]                 = useState('')
  const [uploadOpen, setUploadOpen]           = useState(false)
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false)
  const [addHoldingOpen, setAddHoldingOpen]   = useState(false)
  const [addingHolding, setAddingHolding]     = useState(false)

  // Forms
  const [newForm, setNewForm]       = useState({ name: '', currency: 'NGN', description: '' })
  const [holdingForm, setHoldingForm] = useState({ ticker: '', quantity: '', cost_price: '', purchase_date: '' })

  const loadPortfolios = async () => {
    setLoadingList(true)
    try {
      const res = await portfoliosAPI.list()
      setPortfolios(res.data)
    } catch { toast.error('Failed to load portfolios') }
    finally { setLoadingList(false) }
  }

  const loadStocksList = async () => {
    if (stocksList.length > 0) return
    try {
      const res = await stocksAPI.list()
      setStocksList(res.data)
    } catch {}
  }

  useEffect(() => { loadPortfolios() }, [])

  const openDetail = async (p) => {
    setSelected(p); setView('detail'); setHoldings([])
    setAiResult(''); setAiError('')
    setLoadingDetail(true)
    try {
      const res = await portfoliosAPI.getHoldings(p.id)
      setHoldings(res.data)
    } catch { toast.error('Failed to load holdings') }
    finally { setLoadingDetail(false) }
  }

  const reloadHoldings = async () => {
    if (!selected) return
    try {
      const res = await portfoliosAPI.getHoldings(selected.id)
      setHoldings(res.data)
    } catch {}
  }

  const backToList = () => { setSelected(null); setView('list'); setHoldings([]) }

  const createPortfolio = async () => {
    if (!newForm.name) { toast.error('Portfolio name is required'); return }
    try {
      await portfoliosAPI.create(newForm)
      toast.success('Portfolio created')
      setNewPortfolioOpen(false)
      setNewForm({ name: '', currency: 'NGN', description: '' })
      loadPortfolios()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create portfolio')
    }
  }

  const submitHolding = async () => {
    if (!holdingForm.ticker || !holdingForm.quantity || !holdingForm.cost_price) {
      toast.error('Ticker, quantity and cost price are required')
      return
    }
    setAddingHolding(true)
    try {
      await portfoliosAPI.addHolding(selected.id, {
        portfolio_id:  selected.id,
        ticker:        holdingForm.ticker.toUpperCase(),
        quantity:      parseFloat(holdingForm.quantity),
        cost_price:    parseFloat(holdingForm.cost_price),
        purchase_date: holdingForm.purchase_date || null,
        currency:      selected.currency,
      })
      toast.success(`${holdingForm.ticker.toUpperCase()} added to portfolio`)
      setAddHoldingOpen(false)
      setHoldingForm({ ticker: '', quantity: '', cost_price: '', purchase_date: '' })
      reloadHoldings()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add holding')
    } finally { setAddingHolding(false) }
  }

  const deleteHolding = async (holdingId, ticker) => {
    if (!window.confirm(`Remove ${ticker} from this portfolio?`)) return
    try {
      await portfoliosAPI.deleteHolding(selected.id, holdingId)
      toast.success(`${ticker} removed`)
      reloadHoldings()
    } catch { toast.error('Failed to remove holding') }
  }

  const runAI = async () => {
    setAiLoading(true); setAiResult(''); setAiError('')
    try {
      const totalValue = holdings.reduce((s, h) => s + (h.current_value || 0), 0)
      const totalCost  = holdings.reduce((s, h) => s + (h.cost_value   || 0), 0)
      const ytd        = totalCost ? (((totalValue - totalCost) / totalCost) * 100).toFixed(2) : 0
      const res = await aiAPI.analyzePortfolio(selected.id, { ytd, sharpe: '—', volatility: '—', max_drawdown: '—' })
      setAiResult(res.data.analysis)
      toast.success('Portfolio analysis complete')
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI analysis failed'
      setAiError(msg); toast.error(msg)
    } finally { setAiLoading(false) }
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <>
        <CSVUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} defaultType="portfolio_holdings"
          onUploadComplete={() => { setUploadOpen(false); loadPortfolios() }} />

        {/* New Portfolio Modal */}
        <Modal open={newPortfolioOpen} onClose={() => setNewPortfolioOpen(false)} title="Create New Portfolio" size="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setNewPortfolioOpen(false)}>Cancel</Button>
              <Button variant="primary"   size="sm" onClick={createPortfolio}>Create Portfolio</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Portfolio Name *', key: 'name',        type: 'text', placeholder: 'e.g. Prime Capital Flagship Fund' },
              { label: 'Description',      key: 'description', type: 'text', placeholder: 'Optional description' },
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
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Currency</label>
              <select value={newForm.currency} onChange={e => setNewForm(p => ({ ...p, currency: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>
          </div>
        </Modal>

        <PageWrapper title="Portfolio Management"
          actions={
            <>
              <Button variant="ghost"     size="sm" onClick={loadPortfolios}><RefreshCw size={13} /></Button>
              <Button variant="secondary" size="sm" onClick={() => setUploadOpen(true)}><Upload size={13} /> Upload Holdings</Button>
              <Button variant="primary"   size="sm" onClick={() => setNewPortfolioOpen(true)}><Plus size={13} /> New Portfolio</Button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Portfolios" value={portfolios.length}                                  icon={PieChart}    accent />
            <StatCard label="NGN Portfolios"   value={portfolios.filter(p => p.currency === 'NGN').length} icon={TrendingUp} />
            <StatCard label="USD Portfolios"   value={portfolios.filter(p => p.currency === 'USD').length} icon={TrendingUp} />
          </div>

          {loadingList ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading portfolios...</div>
          ) : portfolios.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <PieChart size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>No portfolios yet</p>
              <Button variant="primary" size="sm" onClick={() => setNewPortfolioOpen(true)}><Plus size={13} /> Create First Portfolio</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {portfolios.map(p => (
                <div key={p.id} className="card" onClick={() => openDetail(p)}
                  style={{ padding: 18, cursor: 'pointer', borderLeft: '3px solid var(--gold-primary)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderLeftColor = 'var(--gold-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderLeftColor = 'var(--gold-primary)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</h3>
                    <span className="badge badge-gold">{p.currency}</span>
                  </div>
                  {p.description && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inception: {p.inception || '—'}</span>
                    <span style={{ fontSize: 11, color: 'var(--gold-primary)' }}>View details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageWrapper>
      </>
    )
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  const totalValue  = holdings.reduce((s, h) => s + (h.current_value || 0), 0)
  const totalCost   = holdings.reduce((s, h) => s + (h.cost_value   || 0), 0)
  const totalPnL    = totalValue - totalCost
  const totalPnLPct = totalCost ? ((totalPnL / totalCost) * 100).toFixed(2) : 0
  const allocation  = getSectorAllocation(holdings)

  return (
    <>
      {/* Add Holding Modal */}
      <Modal open={addHoldingOpen} onClose={() => setAddHoldingOpen(false)} title="Add Holding" size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddHoldingOpen(false)}>Cancel</Button>
            <Button variant="primary"   size="sm" loading={addingHolding} onClick={submitHolding}>Add Holding</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Ticker dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stock *</label>
            <select
              value={holdingForm.ticker}
              onChange={e => setHoldingForm(p => ({ ...p, ticker: e.target.value }))}
              onClick={loadStocksList}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, color: holdingForm.ticker ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
              onFocus={e => { loadStocksList(); e.target.style.borderColor = 'var(--gold-primary)' }}
              onBlur={e  => e.target.style.borderColor = 'var(--border-default)'}
            >
              <option value="">— Select a stock —</option>
              {stocksList.map(s => (
                <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
              ))}
            </select>
          </div>

          {/* Quantity, Cost Price, Date */}
          {[
            { label: 'Quantity (units) *',      key: 'quantity',      type: 'number', placeholder: 'e.g. 500000' },
            { label: 'Cost Price per unit *',   key: 'cost_price',    type: 'number', placeholder: 'e.g. 32.50' },
            { label: 'Purchase Date',            key: 'purchase_date', type: 'date',   placeholder: '' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={holdingForm[f.key]}
                onChange={e => setHoldingForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>
          ))}

          {/* Total cost preview */}
          {holdingForm.ticker && holdingForm.quantity && holdingForm.cost_price && (
            <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Cost: </span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                ₦{fmt(parseFloat(holdingForm.quantity || 0) * parseFloat(holdingForm.cost_price || 0))}
              </strong>
            </div>
          )}
        </div>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title={`AI Portfolio Analysis — ${selected?.name}`} size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAiOpen(false)}>Close</Button>
            <Button variant="primary"   size="sm" loading={aiLoading} onClick={runAI}><Sparkles size={13} /> Run AI Analysis</Button>
          </>
        }
      >
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 16, minHeight: 160 }}>
          {aiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '30px 0' }}>
              <svg className="animate-spin" style={{ width: 22, height: 22, color: 'var(--gold-primary)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generating portfolio analysis...</span>
            </div>
          )}
          {!aiLoading && aiError && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{aiError}</p>}
          {!aiLoading && !aiError && !aiResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0', textAlign: 'center' }}>
              <Sparkles size={24} style={{ color: 'var(--gold-primary)', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click <strong style={{ color: 'var(--gold-light)' }}>Run AI Analysis</strong> to generate an AI-powered portfolio assessment.</p>
            </div>
          )}
          {!aiLoading && aiResult && (
            <pre style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{aiResult}</pre>
          )}
        </div>
      </Modal>

      <PageWrapper title={selected?.name}
        actions={
          <>
            <Button variant="ghost"     size="sm" onClick={backToList}><ArrowLeft size={13} /> All Portfolios</Button>
            <Button variant="secondary" size="sm" onClick={() => { loadStocksList(); setHoldingForm({ ticker: '', quantity: '', cost_price: '', purchase_date: '' }); setAddHoldingOpen(true) }}><Plus size={13} /> Add Holding</Button>
            <Button variant="secondary" size="sm" onClick={() => { setAiOpen(true); setAiResult(''); setAiError('') }}><Sparkles size={13} /> AI Analysis</Button>
            <Button variant="primary"   size="sm"><BarChart3 size={13} /> Export Report</Button>
          </>
        }
      >
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Value"  value={`₦${fmt(totalValue)}`}  icon={BarChart3}    accent />
          <StatCard label="Total Cost"   value={`₦${fmt(totalCost)}`}   icon={BarChart3} />
          <StatCard label="Total P&L"    value={`₦${fmt(totalPnL)}`}    change={+totalPnLPct} changeLabel="vs cost" icon={TrendingUp} />
          <StatCard label="Holdings"     value={holdings.length}          icon={PieChart} />
          <StatCard label="Currency"     value={selected?.currency}       icon={ShieldCheck} />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card title="P&L Summary">
            {holdings.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  {loadingDetail ? 'Loading holdings...' : 'No holdings yet'}
                </p>
                {!loadingDetail && (
                  <Button variant="primary" size="sm" onClick={() => { loadStocksList(); setAddHoldingOpen(true) }}>
                    <Plus size={13} /> Add First Holding
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Total Value', value: `₦${fmt(totalValue)}`, color: 'var(--text-primary)' },
                  { label: 'Total Cost',  value: `₦${fmt(totalCost)}`,  color: 'var(--text-secondary)' },
                  { label: 'Total P&L',   value: `₦${fmt(totalPnL)}`,   color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Sector Allocation">
            {allocation.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={110}>
                  <RechartsPie>
                    <Pie data={allocation} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2} dataKey="value">
                      {allocation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {allocation.map(s => (
                    <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color }} />
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Holdings table */}
        <Card title="Holdings" subtitle={`${holdings.length} positions`}
          action={
            <Button size="sm" variant="secondary" onClick={() => { loadStocksList(); setHoldingForm({ ticker: '', quantity: '', cost_price: '', purchase_date: '' }); setAddHoldingOpen(true) }}>
              <Plus size={12} /> Add Holding
            </Button>
          }
        >
          {loadingDetail ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading holdings...</div>
          ) : holdings.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No holdings yet — click "Add Holding" to add your first stock position
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Cost Price</th>
                  <th style={{ textAlign: 'right' }}>Current Price</th>
                  <th style={{ textAlign: 'right' }}>Current Value</th>
                  <th style={{ textAlign: 'right' }}>P&L</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{h.ticker}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{Number(h.quantity).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>₦{fmt(h.cost_price)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>₦{fmt(h.current_price)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>₦{fmt(h.current_value)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: h.pnl >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {h.pnl >= 0 ? '+' : ''}₦{fmt(h.pnl)}<br />
                        <span style={{ fontSize: 10 }}>({h.pnl >= 0 ? '+' : ''}{h.pnl_pct}%)</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{h.weight}%</td>
                    <td>
                      <button onClick={() => deleteHolding(h.id, h.ticker)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: '2px 6px' }}
                        title="Remove holding">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-default)' }}>
                  <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', padding: '12px 14px' }}>₦{fmt(totalValue)}</td>
                  <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                      {totalPnL >= 0 ? '+' : ''}₦{fmt(totalPnL)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, padding: '12px 14px' }}>100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
