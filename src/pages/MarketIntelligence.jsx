import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Card, { StatCard } from '../components/common/Card'
import Button from '../components/common/Button'
import CSVUploadModal from '../components/common/CSVUploadModal'
import TradingViewWidget from '../components/charts/TradingViewWidget'
import { Upload, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import { marketAPI, stocksAPI } from '../utils/api'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const NGX_STOCKS = [
  { ticker: 'NGX:GTCO',     label: 'GTCO' },
  { ticker: 'NGX:ZENITH',   label: 'Zenith Bank' },
  { ticker: 'NGX:MTNN',     label: 'MTN Nigeria' },
  { ticker: 'NGX:DANGCEM',  label: 'Dangote Cement' },
  { ticker: 'NGX:FBNH',     label: 'FBN Holdings' },
  { ticker: 'NGX:UBA',      label: 'UBA' },
  { ticker: 'NGX:ACCESS',   label: 'Access Holdings' },
  { ticker: 'NGX:SEPLAT',   label: 'Seplat Energy' },
  { ticker: 'NGX:AIRTELAF', label: 'Airtel Africa' },
  { ticker: 'NGX:NESTLE',   label: 'Nestle Nigeria' },
  { ticker: 'NGX:BUAFOOD',  label: 'BUA Foods' },
  { ticker: 'NGX:STANBIC',  label: 'Stanbic IBTC' },
]

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
)

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
  const [chartSymbol, setChartSymbol]     = useState('NGX:GTCO')
  const [selectedTicker, setSelectedTicker] = useState(null)
  const [priceHistory, setPriceHistory]   = useState([])
  const [useTradingView, setUseTradingView] = useState(!isLocalhost)

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
    setChartSymbol('NGX:' + ticker)
    try {
      const res = await stocksAPI.getPrices(ticker, 30)
      const sorted = [...res.data].reverse()
      setPriceHistory(sorted.map(p => ({ date: p.date ? p.date.slice(5) : '', price: p.close_price })))
    } catch { setPriceHistory([]) }
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
        {/* Scraper status */}
        {scraperStatus && (
          <div style={{
            marginBottom: 20, padding: '10px 16px',
            background: scraperStatus.is_current ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: '1px solid ' + (scraperStatus.is_current ? 'var(--success)' : 'var(--warning)'),
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: scraperStatus.is_current ? 'var(--success)' : 'var(--warning)' }}>
              {scraperStatus.is_current
                ? '✓ Database prices current — updated today (' + scraperStatus.total_price_records + ' records)'
                : '⚠ Database last updated: ' + (scraperStatus.last_price_date || 'never') + ' — upload real NGX prices CSV'}
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

        {/* Chart card with toggle */}
        <Card
          title={useTradingView ? 'Live NGX Chart (TradingView)' : 'Price History (Database)'}
          subtitle={useTradingView ? 'May not show data for all NGX tickers — limited free tier coverage' : '30-day closing prices from your uploaded data'}
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {useTradingView && (
                <select value={chartSymbol} onChange={e => setChartSymbol(e.target.value)}
                  style={{ padding: '5px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 5, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer' }}>
                  {NGX_STOCKS.map(s => <option key={s.ticker} value={s.ticker}>{s.label}</option>)}
                </select>
              )}
              <button
                onClick={() => setUseTradingView(p => !p)}
                style={{ padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 5, color: 'var(--gold-light)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                {useTradingView ? '📊 Use Database Chart' : '📈 Use TradingView'}
              </button>
            </div>
          }
          style={{ marginBottom: 24 }}
        >
          {useTradingView ? (
            <TradingViewWidget symbol={chartSymbol} height={420} />
          ) : (
            priceHistory.length === 0 ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Click a stock in Top Gainers/Losers below to view its chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '₦' + v} />
                  <Tooltip {...tooltipStyle} formatter={v => ['₦' + fmt(v), selectedTicker + ' Close Price']} />
                  <Area type="monotone" dataKey="price" stroke="#C9A84C" strokeWidth={2} fill="url(#priceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )
          )}
        </Card>

        {/* USD/NGN history — always Recharts since it's our own data */}
        <Card title="USD/NGN Rate History" subtitle="30-day CBN exchange rate trend" style={{ marginBottom: 24 }}>
          {fxHistory.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No FX data — upload FX rates CSV</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
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
                    <tr key={s.ticker} style={{ cursor: 'pointer' }} onClick={() => { setUseTradingView(false); loadPriceHistory(s.ticker) }}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span></td>
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
                    <tr key={s.ticker} style={{ cursor: 'pointer' }} onClick={() => { setUseTradingView(false); loadPriceHistory(s.ticker) }}>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{s.ticker}</span></td>
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
        <Card title="Macroeconomic Indicators" subtitle="CBN / NBS — upload CSV for real data">
          {macro.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No macro data</p>
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
