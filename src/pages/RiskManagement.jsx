import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { ShieldAlert, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react'
import { portfoliosAPI, aiAPI } from '../utils/api'
import toast from 'react-hot-toast'

// ── Risk calculation helpers ──────────────────────────────────────────────────
function calcRiskMetrics(holdings) {
  if (!holdings || holdings.length === 0) return null

  const totalValue = holdings.reduce((s, h) => s + (h.current_value || 0), 0)
  if (!totalValue) return null

  // Concentration — largest single holding weight
  const maxWeight = Math.max(...holdings.map(h => h.weight || 0))

  // Sector concentration
  const sectorMap = {}
  holdings.forEach(h => {
    const sector = h.sector || 'Others'
    sectorMap[sector] = (sectorMap[sector] || 0) + (h.weight || 0)
  })
  const maxSectorWeight = Math.max(...Object.values(sectorMap))
  const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0]

  // Average P&L pct across holdings
  const avgPnlPct = holdings.reduce((s, h) => s + (h.pnl_pct || 0), 0) / holdings.length

  // Simple risk score based on concentration and P&L
  let riskLevel = 'LOW'
  if (maxSectorWeight > 60 || maxWeight > 40) riskLevel = 'HIGH'
  else if (maxSectorWeight > 40 || maxWeight > 25) riskLevel = 'MEDIUM'

  // Alerts
  const alerts = []
  if (maxSectorWeight > 50) alerts.push(`Sector concentration: ${topSector?.[0]} at ${topSector?.[1].toFixed(1)}%`)
  if (maxWeight > 35) {
    const topHolding = holdings.find(h => h.weight === maxWeight)
    alerts.push(`Single stock concentration: ${topHolding?.ticker} at ${maxWeight.toFixed(1)}%`)
  }
  if (avgPnlPct < -10) alerts.push(`Portfolio down ${Math.abs(avgPnlPct).toFixed(1)}% on average — review positions`)

  return {
    concentration:    maxWeight.toFixed(1),
    sectorConcentration: maxSectorWeight.toFixed(1),
    topSector:        topSector?.[0] || '—',
    holdings:         holdings.length,
    avgPnlPct:        avgPnlPct.toFixed(2),
    riskLevel,
    alerts,
  }
}

export default function RiskManagement() {
  const [portfolios, setPortfolios]   = useState([])
  const [riskData, setRiskData]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [aiOpen, setAiOpen]           = useState(false)
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiResult, setAiResult]       = useState('')
  const [aiError, setAiError]         = useState('')
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const pRes = await portfoliosAPI.list()
      const portfolios = pRes.data
      setPortfolios(portfolios)

      // Load holdings for each portfolio and calculate risk
      const riskResults = await Promise.allSettled(
        portfolios.map(async p => {
          const hRes    = await portfoliosAPI.getHoldings(p.id)
          const metrics = calcRiskMetrics(hRes.data)
          return { portfolio: p.name, portfolio_id: p.id, currency: p.currency, ...metrics }
        })
      )

      setRiskData(
        riskResults
          .filter(r => r.status === 'fulfilled' && r.value.riskLevel)
          .map(r => r.value)
      )
    } catch {
      toast.error('Failed to load risk data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const allAlerts = riskData.flatMap(r => r.alerts?.map(a => ({ alert: a, portfolio: r.portfolio })) || [])
  const highRisk  = riskData.filter(r => r.riskLevel === 'HIGH').length
  const medRisk   = riskData.filter(r => r.riskLevel === 'MEDIUM').length

  const openAI = (row) => {
    setSelectedPortfolio(row)
    setAiResult('')
    setAiError('')
    setAiOpen(true)
  }

  const runAI = async () => {
    setAiLoading(true); setAiResult(''); setAiError('')
    try {
      const res = await aiAPI.analyzePortfolio(selectedPortfolio.portfolio_id, {
        sharpe:       '—',
        volatility:   selectedPortfolio.sectorConcentration,
        max_drawdown: selectedPortfolio.avgPnlPct,
        concentration: selectedPortfolio.concentration,
        risk_level:   selectedPortfolio.riskLevel,
      })
      setAiResult(res.data.analysis)
      toast.success('Risk analysis complete')
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI analysis failed'
      setAiError(msg); toast.error(msg)
    } finally { setAiLoading(false) }
  }

  return (
    <>
      <Modal open={aiOpen} onClose={() => setAiOpen(false)}
        title={`AI Risk Report — ${selectedPortfolio?.portfolio}`} size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAiOpen(false)}>Close</Button>
            <Button variant="primary"   size="sm" loading={aiLoading} onClick={runAI}>
              <Sparkles size={13} /> Run AI Risk Report
            </Button>
          </>
        }
      >
        {/* Risk snapshot */}
        {selectedPortfolio && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Risk Level',          value: selectedPortfolio.riskLevel },
              { label: 'Top Sector Weight',   value: `${selectedPortfolio.sectorConcentration}%` },
              { label: 'Top Stock Weight',    value: `${selectedPortfolio.concentration}%` },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 16, minHeight: 160 }}>
          {aiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '30px 0' }}>
              <svg className="animate-spin" style={{ width: 22, height: 22, color: 'var(--gold-primary)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generating risk assessment...</span>
            </div>
          )}
          {!aiLoading && aiError && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{aiError}</p>}
          {!aiLoading && !aiError && !aiResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0', textAlign: 'center' }}>
              <Sparkles size={24} style={{ color: 'var(--gold-primary)', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Click <strong style={{ color: 'var(--gold-light)' }}>Run AI Risk Report</strong> to generate a risk assessment.</p>
            </div>
          )}
          {!aiLoading && aiResult && (
            <pre style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{aiResult}</pre>
          )}
        </div>
      </Modal>

      <PageWrapper
        title="Risk Management"
        actions={<Button variant="ghost" size="sm" onClick={loadData}><RefreshCw size={13} /></Button>}
      >
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Active Alerts"      value={allAlerts.length} icon={ShieldAlert} accent />
          <StatCard label="High Risk Portfolios" value={highRisk} />
          <StatCard label="Medium Risk"         value={medRisk} />
          <StatCard label="Portfolios Analysed" value={riskData.length} />
        </div>

        {/* Alert banners */}
        {allAlerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {allAlerts.map((a, i) => (
              <div key={i} style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--warning)' }}>
                  <strong>{a.portfolio}:</strong> {a.alert}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Risk table */}
        <Card title="Portfolio Risk Metrics" subtitle="Calculated from live holdings data">
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Calculating risk metrics...</div>
          ) : riskData.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No portfolios with holdings yet — create a portfolio and add holdings first
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Currency</th>
                  <th style={{ textAlign: 'right' }}>Holdings</th>
                  <th style={{ textAlign: 'right' }}>Top Stock Wt.</th>
                  <th style={{ textAlign: 'right' }}>Top Sector Wt.</th>
                  <th>Top Sector</th>
                  <th style={{ textAlign: 'right' }}>Avg P&L</th>
                  <th style={{ textAlign: 'center' }}>Risk Level</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {riskData.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.portfolio}</td>
                    <td><span className="badge badge-gold">{r.currency}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.holdings}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: r.concentration > 35 ? 'var(--warning)' : 'inherit' }}>{r.concentration}%</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: r.sectorConcentration > 50 ? 'var(--warning)' : 'inherit' }}>{r.sectorConcentration}%</td>
                    <td><span className="badge badge-muted">{r.topSector}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: r.avgPnlPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {r.avgPnlPct >= 0 ? '+' : ''}{r.avgPnlPct}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${r.riskLevel === 'LOW' ? 'badge-success' : r.riskLevel === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>{r.riskLevel}</span>
                    </td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => openAI(r)}>
                        <Sparkles size={12} /> AI Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Note on metrics */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Note on metrics:</strong> Risk scores are currently calculated from holdings concentration data.
            Sharpe ratio, volatility, and max drawdown calculations require historical price series — these will be computed automatically as you upload more NGX price data over time.
          </p>
        </div>
      </PageWrapper>
    </>
  )
}
