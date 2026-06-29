import { useEffect, useRef, memo } from 'react'

function TradingViewTicker() {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container'
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'

    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    wrapper.appendChild(inner)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'NGX:GTCO',     title: 'GTCO' },
        { proName: 'NGX:ZENITH',   title: 'Zenith' },
        { proName: 'NGX:MTNN',     title: 'MTN Nigeria' },
        { proName: 'NGX:DANGCEM',  title: 'Dangote Cement' },
        { proName: 'NGX:FBNH',     title: 'FBN Holdings' },
        { proName: 'NGX:UBA',      title: 'UBA' },
        { proName: 'NGX:ACCESS',   title: 'Access' },
        { proName: 'NGX:SEPLAT',   title: 'Seplat' },
        { proName: 'NGX:NESTLE',   title: 'Nestle' },
        { proName: 'NGX:AIRTELAF', title: 'Airtel Africa' },
        { proName: 'NGX:BUAFOOD',  title: 'BUA Foods' },
        { proName: 'NGX:STANBIC',  title: 'Stanbic IBTC' },
        { proName: 'NGX:DANGSUGAR',title: 'Dangote Sugar' },
        { proName: 'NGX:NB',       title: 'Nigerian Breweries' },
      ],
      showSymbolLogo: true,
      isTransparent:  true,
      displayMode:    'adaptive',
      colorTheme:     'dark',
      locale:         'en',
    })
    wrapper.appendChild(script)
    containerRef.current.appendChild(wrapper)

    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: 56, overflow: 'hidden', borderRadius: 6, border: '1px solid var(--border-subtle)', marginBottom: 20 }} />
  )
}

export default memo(TradingViewTicker)
