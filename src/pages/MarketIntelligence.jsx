import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import Button from '../components/common/Button'
import CSVUploadModal from '../components/common/CSVUploadModal'
import { Upload, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import { marketAPI, stocksAPI } from '../utils/api'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function MarketIntelligence() {
  const [movers, setMovers]               = useState({ gainers: [], losers: [] })
  const [macro, setMacro]                 = useState([])
  const [fx, setFx]                       = useState(null)
  const [fxHistory, setFxHistory]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [scraping, setScraping]           = useState(false)
  const [scraperStatus, setScraperStatus] = useState(null)
  const [uploadOpen, setUploadOpen]       = useState(false)
  const [uploadType, setUploadType]       = useState('market_prices')
  const [selectedTicker, setSelectedTicker] = useState(null)
  const [priceHistory, setPriceHistory]   = useState([])
  const [loadingChart, setLoadingChart]   = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [mRes, macRes, fxRes, statusRes, fxHistRes] = await Promise.allSettled([
        marketAPI.getMovers(),
        marketAPI.getMacro(),
        marketAPI.getLatestFX(),
        api.get('/scraper/status'),
        marketAPI.getFXRates(30),
      ])
      if (mRes.status === 'fulfilled')      setMovers(mRes.value.data)
      if (macRes.status === 'fulfilled')    setMacro(macRes.value.data)
      if (fxRes.status === 'fulfilled')     setFx(fxRes.value.data)
      if (statusRes.status === 'fulfilled') setScraperStatus(statusRes.value.data)
      if (fxHistRes.status === 'fulfilled') {
        const sorted = [...fxHistRes.value.data].reverse()
        setFxHistory(sorted.map(r => ({ date: r.date ? r.date.slice(5) : '', usd: r.usd_ngn })))
      }
    } finally { setLoading(false) }
  }

  const loadPriceHistory = async (ticker) => {
    setSelectedTicker(ticker)
    setLoadingChart(true)
    try {
      const res = await stocksAPI.getPrices(ticker, 30)
      const sorted = [...res.data].reverse()
      setPriceHistory(sorted.map(p => ({ date: p.date ? p.date.slice(5) : '', price: p.close_price })))
    } catch { setPriceHistory([]) }
    finally { setLoadingChart(false) }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (movers.gainers && movers.gainers.length > 0 && !selectedTicker) {
      loadPriceHistory(movers.gainers[0].ticker)
    }
  }, [movers])

  const openUpload = (type) => { setUploadType(type); setUploadOpen(true) }

  const runScraper = async () => {
    setScraping(true)
    try {
      await api.post('/scraper/run')
      toast.success('NGX scraper started — data will update in ~30 seconds')
      setTimeout(() => { loadData(); setScraping(false) }, 30000)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scraper failed')
      setScraping(false)
    }
  }

  const fmt = (v) => v ? Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '—'

  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12 },
    labelStyle:   { color: 'var(--text-secondary)' },
    itemStyle:    { color: 'var(--gold-light)' },
  }

  return (
    <>
      <CSVUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultType={uploadType}
        onUploadComplete={() => { setUploadOpen(false); loadData(); toast.success('Data uploaded successfully') }}
      />

      <PageWrapper
        title="Market Intelligence"
        actions={
          <>
            <Button variant="ghost"     size="sm" onClick={loadData}><RefreshCw size={13} /></Button>
            <Button variant="secondary" size="sm" loading={scraping} onClick={runScraper}><Zap size={13} /> Auto-Fetch NGX</Button>
            <Button variant="secondary" size="sm" onClick={() => openUpload('fx_rates')}><Upload size={13} /> FX Rates</Button>
            <Button variant="secondary" size="sm" onClick={() => openUpload('macro_indicators')}><Upload size={13} /> Macro Data</Button>
            <Button variant="primary"   size="sm" onClick={() => openUpload('market_prices')}><Upload size={13} /> Market Prices</Button>
          </>
        }
      >
        {/* Scraper / data status */}
        {scraperStatus && (
          <div style={{
            marginBottom: 20, padding: '10px 16px',
            background: scraperStatus.is_current ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: '1px solid ' + (scraperStatus.is_current ? 'var(--success)' : 'var(--warning)'),
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 12, color: scraperStatus.is_current ? 'var(--success)' : 'var(--warning)' }}>
              {scraperStatus.is_current
                ? '✓ Database updated today (' + scraperStatus.total_price_records + ' price records)'
                : '⚠ Last update: ' + (scraperStatus.last_price_date || 'never') + ' — download from ngxgroup.com/exchange/data/equities-price-list/ and upload via Market Prices button for accurate data'}
            </span>
          </div>
        )}

        {/* FX Rate cards */}
        {fx && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            {fx.usd_ngn && <StatCard label="USD/NGN (CBN)" value={'₦' + fmt(fx.usd_ngn)} icon={TrendingUp} accent />}
            {fx.gbp_ngn && <StatCard label="GBP/NGN"       value={'₦' + fmt(fx.gbp_ngn)} icon={TrendingUp} />}
            {fx.eur_ngn && <StatCard label="EUR/NGN"       value={'₦' + fmt(fx.eur_ngn)} icon={TrendingUp} />}
          </div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card
            title={selectedTicker ? 'Price History — ' + selectedTicker : 'Price History'}
            subtitle="30-day closing prices — click a stock below to view"
          >
            {priceHistory.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {loadingChart ? 'Loading chart...' : 'No price data — upload NGX market prices CSV'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '₦' + v} />
                  <Tooltip {...tooltipStyle} formatter={v => ['₦' + fmt(v), 'Close Price']} />
                  <Area type="monotone" dataKey="price" stroke="#C9A84C" strokeWidth={2} fill="url(#priceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="USD/NGN Rate History" subtitle="30-day CBN exchange rate trend">
            {fxHistory.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No FX data — upload FX rates CSV
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={fxHistory}>
                  <defs>
                    <linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3498DB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={v => ['₦' + fmt(v), 'USD/NGN']} />
                  <Area type="monotone" dataKey="usd" stroke="#3498DB" strokeWidth={2} fill="url(#fxGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Gainers / Losers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card title="Top Gainers" subtitle="Click to view chart" goldAccent>
            {movers.gainers && movers.gainers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No price data — upload NGX market prices CSV</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Ticker</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Change</th></tr></thead>
                <tbody>
                  {movers.gainers && movers.gainers.map(s => (
                    <tr key={s.ticker} style={{ cursor: 'pointer' }} onClick={() => loadPriceHistory(s.ticker)}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: selectedTicker === s.ticker ? 'var(--gold-primary)' : 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span></td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>₦{fmt(s.price)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontSize: 12 }}>▲ {s.change}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Top Losers" subtitle="Click to view chart">
            {movers.losers && movers.losers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No price data — upload NGX market prices CSV</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Ticker</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Change</th></tr></thead>
                <tbody>
                  {movers.losers && movers.losers.map(s => (
                    <tr key={s.ticker} style={{ cursor: 'pointer' }} onClick={() => loadPriceHistory(s.ticker)}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: selectedTicker === s.ticker ? 'var(--gold-primary)' : 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span></td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>₦{fmt(s.price)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)', fontSize: 12 }}>▼ {Math.abs(s.change)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Macro indicators */}
        <Card title="Macroeconomic Indicators" subtitle="CBN / NBS — upload CSV from cbn.gov.ng for accurate data">
          {macro.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No macro data — upload a macro indicators CSV</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {macro.map(m => (
                <div key={m.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.indicator}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {m.indicator.toLowerCase().includes('usd') ? '₦' + fmt(m.value) : m.value + '%'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{m.source} · {m.date}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
