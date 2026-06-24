import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import { TrendingUp, PieChart, Activity, BarChart3, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts'
import { portfoliosAPI, marketAPI, stocksAPI } from '../utils/api'

const SECTOR_COLORS = {
  'Banking': '#C9A84C', 'Industrial Goods': '#3498DB', 'ICT': '#2ECC71',
  'Consumer Goods': '#9B59B6', 'Oil & Gas': '#E67E22', 'Construction': '#1ABC9C', 'Others': '#5A6A88',
}

export default function Dashboard() {
  const [portfolios, setPortfolios]   = useState([])
  const [movers, setMovers]           = useState({ gainers: [], losers: [] })
  const [macro, setMacro]             = useState([])
  const [stocks, setStocks]           = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, mRes, macRes, sRes] = await Promise.allSettled([
          portfoliosAPI.list(),
          marketAPI.getMovers(),
          marketAPI.getMacro(),
          stocksAPI.list(),
        ])
        if (pRes.status === 'fulfilled')   setPortfolios(pRes.value.data)
        if (mRes.status === 'fulfilled')   setMovers(mRes.value.data)
        if (macRes.status === 'fulfilled') setMacro(macRes.value.data)
        if (sRes.status === 'fulfilled')   setStocks(sRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPortfolios = portfolios.length
  const usdNgn = macro.find(m => m.indicator?.toLowerCase().includes('usd'))?.value

  // Sector allocation from stocks
  const sectorMap = {}
  stocks.forEach(s => { sectorMap[s.sector || 'Others'] = (sectorMap[s.sector || 'Others'] || 0) + 1 })
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({
    name, value, color: SECTOR_COLORS[name] || SECTOR_COLORS['Others'],
  }))

  // Macro key indicators
  const keyMacro = [
    macro.find(m => m.indicator?.toLowerCase().includes('inflation')),
    macro.find(m => m.indicator?.toLowerCase().includes('t-bill') || m.indicator?.toLowerCase().includes('tbill')),
    macro.find(m => m.indicator?.toLowerCase().includes('mpr')),
    macro.find(m => m.indicator?.toLowerCase().includes('usd')),
  ].filter(Boolean)

  return (
    <PageWrapper title="Dashboard">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active Portfolios" value={loading ? '—' : totalPortfolios}        icon={BarChart3}  accent />
        <StatCard label="NGX Stocks Tracked" value={loading ? '—' : stocks.length}         icon={TrendingUp} />
        <StatCard label="Top Gainer Today"   value={movers.gainers?.[0] ? `${movers.gainers[0].ticker} +${movers.gainers[0].change}%` : '—'} icon={TrendingUp} />
        <StatCard label="Open Alerts"        value="0"                                      icon={AlertTriangle} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Movers chart */}
        <Card title="Today's Market Movers" subtitle="Top gainers and losers on NGX">
          {movers.gainers?.length === 0 && movers.losers?.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No price data yet — upload NGX market prices to see movers
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Gainers</p>
                {movers.gainers?.map(s => (
                  <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span>
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>▲ {s.change}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Losers</p>
                {movers.losers?.map(s => (
                  <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span>
                    <span style={{ fontSize: 12, color: 'var(--danger)' }}>▼ {Math.abs(s.change)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Sector allocation */}
        <Card title="Stocks by Sector">
          {sectorData.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sector data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <RechartsPie>
                  <Pie data={sectorData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                    {sectorData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
                {sectorData.map(s => (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Macro indicators */}
      {keyMacro.length > 0 && (
        <Card title="Macroeconomic Indicators" subtitle="Latest uploaded data" style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {keyMacro.map(m => (
              <div key={m.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.indicator}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>{m.value}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Portfolios list */}
      <Card title="Active Portfolios" subtitle="Click Portfolio page for full detail">
        {portfolios.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No portfolios yet — create one from the Portfolio page
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Portfolio Name</th>
                <th>Currency</th>
                <th>Inception</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td><span className="badge badge-gold">{p.currency}</span></td>
                  <td style={{ fontSize: 12 }}>{p.inception || '—'}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageWrapper>
  )
}
