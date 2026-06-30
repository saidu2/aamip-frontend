import { useEffect, useRef, memo } from 'react'

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

function TradingViewTicker() {
  const containerRef = useRef()

  useEffect(() => {
    if (isLocalhost || !containerRef.current) return
    containerRef.current.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'NGX:GTCO',      title: 'GTCO' },
        { proName: 'NGX:ZENITH',    title: 'Zenith' },
        { proName: 'NGX:MTNN',      title: 'MTN Nigeria' },
        { proName: 'NGX:DANGCEM',   title: 'Dangote Cement' },
        { proName: 'NGX:FBNH',      title: 'FBN Holdings' },
        { proName: 'NGX:UBA',       title: 'UBA' },
        { proName: 'NGX:ACCESS',    title: 'Access' },
        { proName: 'NGX:SEPLAT',    title: 'Seplat' },
        { proName: 'NGX:NESTLE',    title: 'Nestle' },
        { proName: 'NGX:AIRTELAF',  title: 'Airtel Africa' },
        { proName: 'NGX:BUAFOOD',   title: 'BUA Foods' },
        { proName: 'NGX:STANBIC',   title: 'Stanbic IBTC' },
        { proName: 'NGX:DANGSUGAR', title: 'Dangote Sugar' },
        { proName: 'NGX:NB',        title: 'Nigerian Breweries' },
        { proName: 'NGX:WAPCO',     title: 'Lafarge' },
        { proName: 'NGX:BUACEMENT', title: 'BUA Cement' },
      ],
      showSymbolLogo: true,
      isTransparent:  true,
      displayMode:    'adaptive',
      colorTheme:     'dark',
      locale:         'en',
    })
    containerRef.current.appendChild(script)
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])

  if (isLocalhost) return null
  return <div ref={containerRef} className="tradingview-widget-container" style={{ width: '100%', height: 46, overflow: 'hidden' }} />
}

export default memo(TradingViewTicker)
