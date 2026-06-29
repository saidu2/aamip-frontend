import { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ symbol = 'NGX:GTCO', height = 420 }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container'
    wrapper.style.height = '100%'
    wrapper.style.width = '100%'

    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    inner.style.height = 'calc(100% - 32px)'
    inner.style.width = '100%'
    wrapper.appendChild(inner)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize:            true,
      symbol,
      interval:            'D',
      timezone:            'Africa/Lagos',
      theme:               'dark',
      style:               '1',
      locale:              'en',
      backgroundColor:     '#0F1628',
      gridColor:           'rgba(42,58,85,0.4)',
      withdateranges:      true,
      range:               '3M',
      hide_side_toolbar:   false,
      allow_symbol_change: true,
      save_image:          false,
      calendar:            false,
      support_host:        'https://www.tradingview.com',
    })
    wrapper.appendChild(script)
    containerRef.current.appendChild(wrapper)

    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [symbol])

  return (
    <div ref={containerRef} style={{ height, width: '100%', borderRadius: 6, overflow: 'hidden' }} />
  )
}

export default memo(TradingViewWidget)
