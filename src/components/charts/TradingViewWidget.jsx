import { useEffect, useRef, memo } from 'react'

/**
 * TradingView Chart Widget
 * Free embeddable chart — works for NGX stocks using format "NGX:TICKER"
 * No API key required.
 */
function TradingViewWidget({ symbol = 'NGX:GTCO', height = 400, theme = 'dark' }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize:           true,
      symbol,
      interval:           'D',
      timezone:           'Africa/Lagos',
      theme,
      style:              '1',
      locale:             'en',
      backgroundColor:    theme === 'dark' ? '#0F1628' : '#ffffff',
      gridColor:          theme === 'dark' ? 'rgba(42,58,85,0.4)' : 'rgba(200,200,200,0.4)',
      withdateranges:     true,
      range:              '3M',
      hide_side_toolbar:  false,
      allow_symbol_change:true,
      save_image:         false,
      calendar:           false,
      support_host:       'https://www.tradingview.com',
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [symbol, theme, height])

  return (
    <div style={{ height, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

export default memo(TradingViewWidget)
