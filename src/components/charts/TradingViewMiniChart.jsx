import { useEffect, useRef, memo } from 'react'

/**
 * TradingView Mini Chart — compact sparkline-style chart
 * Used in Stock Research detail and Dashboard
 */
function TradingViewMiniChart({ symbol = 'NGX:GTCO', height = 150 }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol,
      width:           '100%',
      height,
      locale:          'en',
      dateRange:       '3M',
      colorTheme:      'dark',
      isTransparent:   true,
      autosize:        true,
      largeChartUrl:   '',
      noTimeScale:     false,
    })

    containerRef.current.appendChild(script)
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [symbol])

  return (
    <div style={{ height, width: '100%', overflow: 'hidden' }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

export default memo(TradingViewMiniChart)
