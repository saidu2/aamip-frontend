import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileSpreadsheet, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import toast from 'react-hot-toast'

// ─── Expected column schemas per upload type ────────────────────────────────
const SCHEMAS = {
  market_prices: {
    label: 'NGX Market Prices',
    description: 'Daily stock prices from NGX website',
    required: ['ticker', 'close_price', 'date'],
    optional: ['open_price', 'high_price', 'low_price', 'volume', 'market_cap'],
    hints: { ticker: 'e.g. GTCO, DANGCEM', close_price: 'Closing price in NGN', date: 'Format: YYYY-MM-DD or DD/MM/YYYY' },
  },
  company_financials: {
    label: 'Company Financials',
    description: 'Annual report data — revenue, profit, EPS etc.',
    required: ['ticker', 'year', 'revenue', 'net_profit'],
    optional: ['eps', 'total_assets', 'total_equity', 'total_debt', 'dividends'],
    hints: { ticker: 'NGX ticker symbol', year: 'Financial year e.g. 2024', revenue: 'In NGN millions' },
  },
  fx_rates: {
    label: 'FX Rates',
    description: 'USD/NGN and other exchange rates from CBN',
    required: ['date', 'usd_ngn'],
    optional: ['gbp_ngn', 'eur_ngn'],
    hints: { date: 'Format: YYYY-MM-DD', usd_ngn: 'CBN official rate' },
  },
  macro_indicators: {
    label: 'Macro Indicators',
    description: 'Inflation, T-Bill rates, MPR from CBN/NBS',
    required: ['date', 'indicator', 'value'],
    optional: ['source', 'notes'],
    hints: { indicator: 'e.g. Inflation Rate, MPR, T-Bill 91-day', value: 'Numeric value' },
  },
  portfolio_holdings: {
    label: 'Portfolio Holdings',
    description: 'Current holdings — stocks and quantities',
    required: ['ticker', 'quantity', 'cost_price'],
    optional: ['portfolio_name', 'purchase_date', 'currency'],
    hints: { ticker: 'NGX ticker', quantity: 'Number of units', cost_price: 'Price paid per unit' },
  },
}

// ─── Parse CSV text into rows ────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  }).filter(row => Object.values(row).some(v => v !== ''))
  return { headers, rows }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CSVUploadModal({ open, onClose, defaultType, onUploadComplete }) {
  const [step, setStep]           = useState(1) // 1: select type & file, 2: map columns, 3: preview & confirm
  const [uploadType, setUploadType] = useState(defaultType || 'market_prices')
  const [file, setFile]           = useState(null)
  const [parsed, setParsed]       = useState(null) // { headers, rows }
  const [mapping, setMapping]     = useState({})   // { schemaField: csvColumn }
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const fileInputRef              = useRef()

  const schema = SCHEMAS[uploadType]

  const reset = () => {
    setStep(1); setFile(null); setParsed(null); setMapping({}); setLoading(false)
  }

  const handleClose = () => { reset(); onClose() }

  // ── File handling ──────────────────────────────────────────────────────────
  const processFile = useCallback((f) => {
    if (!f) return
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result)
      if (headers.length === 0) { toast.error('Could not parse file. Make sure it has a header row.'); return }
      setParsed({ headers, rows })

      // Auto-map columns where names match exactly (case-insensitive)
      const autoMap = {}
      const allFields = [...schema.required, ...schema.optional]
      allFields.forEach(field => {
        const match = headers.find(h => h.toLowerCase().replace(/[\s_-]/g, '') === field.toLowerCase().replace(/[\s_-]/g, ''))
        if (match) autoMap[field] = match
      })
      setMapping(autoMap)
      setStep(2)
    }
    reader.readAsText(f)
  }, [schema])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const handleFileInput = (e) => processFile(e.target.files[0])

  // ── Validation ─────────────────────────────────────────────────────────────
  const missingRequired = schema.required.filter(f => !mapping[f])

  // ── Confirm upload ─────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const { uploadsAPI } = await import('../../utils/api')
      const endpointMap = {
        market_prices:       () => uploadsAPI.marketPrices(formData),
        company_financials:  () => uploadsAPI.companyFinancials(formData),
        fx_rates:            () => uploadsAPI.fxRates(formData),
        macro_indicators:    () => uploadsAPI.macroIndicators(formData),
        portfolio_holdings:  () => { formData.append('portfolio_id', portfolioId || 1); return uploadsAPI.portfolioHoldings(formData) },
      }
      const call = endpointMap[uploadType]
      if (call) {
        const res = await call()
        toast.success(`${res.data.inserted || parsed.rows.length} records imported successfully`)
      }
      onUploadComplete?.({ type: uploadType, mapping, rowCount: parsed.rows.length, filename: file.name })
      handleClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const STEP_LABELS = ['Select Type & File', 'Map Columns', 'Preview & Confirm']

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Data"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="ghost" size="sm" onClick={step > 1 ? () => setStep(s => s - 1) : handleClose}>
            {step > 1 ? '← Back' : 'Cancel'}
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 2 && (
              <Button
                variant="primary" size="sm"
                disabled={missingRequired.length > 0}
                onClick={() => setStep(3)}
              >
                Preview Data →
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm}>
                Confirm Import ({parsed?.rows.length} rows)
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--gold-primary)' : 'var(--bg-elevated)',
                fontSize: 11, fontWeight: 700,
                color: step >= i + 1 ? '#0A0E1A' : 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)', margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Select type & upload file ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upload type selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What are you uploading?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(SCHEMAS).map(([key, s]) => (
                <div
                  key={key}
                  onClick={() => setUploadType(key)}
                  style={{
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${uploadType === key ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                    background: uploadType === key ? 'var(--gold-subtle)' : 'var(--bg-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: uploadType === key ? 'var(--gold-light)' : 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Required columns hint */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Required columns:</strong>{' '}
              {schema.required.map(f => <code key={f} style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3, marginRight: 4, fontSize: 10, color: 'var(--gold-light)' }}>{f}</code>)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Optional:</strong>{' '}
              {schema.optional.map(f => <code key={f} style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3, marginRight: 4, fontSize: 10, color: 'var(--text-muted)' }}>{f}</code>)}
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--gold-primary)' : 'var(--border-default)'}`,
              borderRadius: 8,
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--gold-subtle)' : 'var(--bg-secondary)',
              transition: 'all 0.15s',
            }}
          >
            <FileSpreadsheet size={28} style={{ color: 'var(--gold-primary)', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
              Drag & drop your file here, or <span style={{ color: 'var(--gold-light)', textDecoration: 'underline' }}>browse</span>
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports .csv, .xlsx, .xls</p>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFileInput} />
          </div>
        </div>
      )}

      {/* ── STEP 2: Map columns ── */}
      {step === 2 && parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--gold-primary)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{file.name}</strong> — {parsed.rows.length} rows, {parsed.headers.length} columns detected</span>
          </div>

          {missingRequired.length > 0 && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 6, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--warning)' }}>
                Map required fields: {missingRequired.join(', ')}
              </span>
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Match your file's columns to the expected fields. Green means auto-matched.
          </p>

          {/* Required fields */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Required Fields</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schema.required.map(field => (
                <ColumnMapper
                  key={field}
                  field={field}
                  hint={schema.hints?.[field]}
                  headers={parsed.headers}
                  value={mapping[field] || ''}
                  onChange={val => setMapping(p => ({ ...p, [field]: val }))}
                  required
                />
              ))}
            </div>
          </div>

          {/* Optional fields */}
          {schema.optional.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Optional Fields</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schema.optional.map(field => (
                  <ColumnMapper
                    key={field}
                    field={field}
                    hint={schema.hints?.[field]}
                    headers={parsed.headers}
                    value={mapping[field] || ''}
                    onChange={val => setMapping(p => ({ ...p, [field]: val }))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Preview & Confirm ── */}
      {step === 3 && parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>File</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Type</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{schema.label}</div>
            </div>
            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rows Ready</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>{parsed.rows.length}</div>
              </div>
            </div>
          </div>

          {/* Preview table — first 8 rows */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Preview (first 8 rows)</p>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <table className="data-table" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    {Object.values(mapping).filter(Boolean).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      {Object.values(mapping).filter(Boolean).map(col => (
                        <td key={col} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{row[col] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > 8 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                +{parsed.rows.length - 8} more rows not shown
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Column Mapper Row ───────────────────────────────────────────────────────
function ColumnMapper({ field, hint, headers, value, onChange, required }) {
  const matched = !!value
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center',
      padding: '8px 10px', borderRadius: 6,
      background: matched ? (required ? 'rgba(46,204,113,0.05)' : 'var(--bg-secondary)') : 'var(--bg-secondary)',
      border: `1px solid ${matched && required ? 'rgba(46,204,113,0.2)' : 'var(--border-subtle)'}`,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: matched ? (required ? 'var(--success)' : 'var(--text-secondary)') : 'var(--text-secondary)', fontWeight: 600 }}>{field}</span>
          {required && <span style={{ fontSize: 9, color: 'var(--danger)', textTransform: 'uppercase' }}>required</span>}
        </div>
        {hint && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{hint}</span>}
      </div>

      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>

      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '6px 28px 6px 10px',
            background: 'var(--bg-elevated)', border: `1px solid ${matched ? 'var(--border-default)' : 'var(--border-subtle)'}`,
            borderRadius: 5, color: value ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            appearance: 'none', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">— skip —</option>
          {headers.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}
