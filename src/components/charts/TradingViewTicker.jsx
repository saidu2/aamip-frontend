import { useEffect, useRef, memo } from 'react'

/**
 * TradingView Ticker Tape — scrolling price strip for top of Market Intelligence
 * Shows real-time NGX stock prices for free
 */
function TradingViewTicker() {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'NGX:GTCO',    title: 'GTCO' },
        { proName: 'NGX:ZENITH',  title: 'Zenith Bank' },
        { proName: 'NGX:MTNN',    title: 'MTN Nigeria' },
        { proName: 'NGX:DANGCEM', title: 'Dangote Cement' },
        { proName: 'NGX:FBNH',    title: 'FBN Holdings' },
        { proName: 'NGX:UBA',     title: 'UBA' },
        { proName: 'NGX:ACCESS',  title: 'Access Holdings' },
        { proName: 'NGX:SEPLAT',  title: 'Seplat Energy' },
        { proName: 'NGX:NESTLE',  title: 'Nestle Nigeria' },
        { proName: 'NGX:AIRTELAF',title: 'Airtel Africa' },
        { proName: 'NGX:BUAFOOD', title: 'BUA Foods' },
        { proName: 'NGX:NB',      title: 'Nigerian Breweries' },
        { proName: 'NGX:STANBIC', title: 'Stanbic IBTC' },
        { proName: 'NGX:TRANSCORP',title: 'Transcorp' },
      ],
      showSymbolLogo:    true,
      isTransparent:     true,
      displayMode:       'adaptive',
      colorTheme:        'dark',
      locale:            'en',
    })

    containerRef.current.appendChild(script)
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])

  return (
    <div style={{ width: '100%', height: 56, overflow: 'hidden', borderRadius: 6, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default memo(TradingViewTicker)
