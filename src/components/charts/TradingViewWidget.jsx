import { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ symbol = 'NGX:GTCO', height = 420 }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize:            true,
      symbol:               symbol,
      interval:            'D',
      timezone:            'Africa/Lagos',
      theme:               'dark',
      style:               '1',
      locale:              'en',
      backgroundColor:     '#0F1628',
      gridColor:           'rgba(42, 58, 85, 0.4)',
      hide_top_toolbar:    false,
      hide_legend:         false,
      withdateranges:      true,
      range:               '3M',
      allow_symbol_change: true,
      save_image:          false,
      calendar:            false,
      support_host:        'https://www.tradingview.com',
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div style={{ height, width: '100%', borderRadius: 6, overflow: 'hidden', background: '#0F1628' }}>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '100%', width: '100%', background: '#0F1628' }}
      />
    </div>
  )
}

export default memo(TradingViewWidget)
