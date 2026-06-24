/**
 * AI Service — Gemini free tier
 * Swap provider later by changing this file only.
 */

// URL built inside function so env var is always fresh
const GEMINI_MODEL = 'gemini-2.0-flash'

// Debug helper — call this from browser console to see what models your key supports:
// import { listAvailableModels } from './aiService'; listAvailableModels()
export async function listAvailableModels() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`)
  const data = await res.json()
  console.log('Available models:', data?.models?.map(m => m.name))
  return data
}

async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('NO_API_KEY')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      }),
    })
  } catch (networkErr) {
    console.error('Gemini network error:', networkErr)
    throw new Error('Network error — check your internet connection')
  }

  if (!res.ok) {
    let errMsg = 'Gemini request failed'
    try {
      const err = await res.json()
      errMsg = err?.error?.message || errMsg
      console.error('Gemini API error:', err)
    } catch {}
    throw new Error(errMsg)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('Gemini empty response:', data)
    throw new Error('Empty response from Gemini')
  }
  return text
}

// ── Stock Analysis ────────────────────────────────────────────────────────────
export async function analyzeStock(stock) {
  const prompt = `
You are a senior investment analyst at a Nigerian SEC-regulated asset management firm.
Analyze the following NGX-listed stock and provide a concise institutional research note.

Stock: ${stock.name} (${stock.ticker})
Sector: ${stock.sector}
Current Price: ${stock.price}
P/E Ratio: ${stock.pe}x
Current Signal: ${stock.recommendation}
Risk Level: ${stock.risk}

Provide your analysis in this exact format:

COMPANY OVERVIEW
[2-3 sentences about what the company does and its market position in Nigeria]

FINANCIAL HEALTH
[Assessment of profitability, revenue trend, and balance sheet strength based on P/E and sector context]

VALUATION
[Is the stock cheap or expensive relative to its sector and the broader NGX market?]

KEY RISKS
• [Risk 1]
• [Risk 2]  
• [Risk 3]

RECOMMENDATION: ${stock.recommendation}
[One clear sentence explaining why]

RISK SCORE: ${stock.risk}
[One sentence on the main risk driver]

Keep the tone professional and institutional. Reference Nigerian market context where relevant.
`
  return callGemini(prompt)
}

// ── Portfolio Analysis ────────────────────────────────────────────────────────
export async function analyzePortfolio(portfolio) {
  const holdingsSummary = portfolio.holdings.map(h =>
    `${h.ticker} (${h.sector}) — ${h.weight?.toFixed(1) || 'N/A'}% weight, P&L: ${h.pnlPct?.toFixed(1) || 'N/A'}%`
  ).join('\n')

  const prompt = `
You are a senior portfolio manager at a Nigerian SEC-regulated asset management firm.
Provide an institutional portfolio assessment for the following fund.

Portfolio: ${portfolio.name}
Manager: ${portfolio.manager}
Currency: ${portfolio.currency}
YTD Return: ${portfolio.ytd}%
Sharpe Ratio: ${portfolio.sharpe}
Volatility: ${portfolio.volatility}%
Max Drawdown: ${portfolio.maxDrawdown}%

Holdings:
${holdingsSummary}

Provide your assessment in this exact format:

PORTFOLIO OVERVIEW
[2-3 sentences summarising the portfolio's strategy, size, and overall performance]

DIVERSIFICATION ASSESSMENT
[Analysis of sector concentration, number of positions, and whether the portfolio is well-diversified for a Nigerian market fund]

PERFORMANCE COMMENTARY
[Commentary on the YTD return, Sharpe ratio, and volatility — is the risk-adjusted return acceptable?]

KEY RISKS
• [Risk 1 — be specific to the actual holdings]
• [Risk 2]
• [Risk 3]

REBALANCING SUGGESTIONS
[Specific, actionable suggestions based on the actual holdings and weights. If well-balanced, say so.]

Keep the tone professional. Reference SEC Nigeria regulations and NGX market context where appropriate.
`
  return callGemini(prompt)
}

// ── Market Commentary ─────────────────────────────────────────────────────────
export async function generateMarketCommentary(marketData) {
  const prompt = `
You are a market analyst covering the Nigerian Exchange Group (NGX).
Write a concise institutional market commentary based on the following data.

NGX All-Share Index: ${marketData.allShare}
Top Gainers: ${marketData.gainers?.map(g => `${g.ticker} (+${g.change}%)`).join(', ')}
Top Losers: ${marketData.losers?.map(l => `${l.ticker} (${l.change}%)`).join(', ')}
USD/NGN Rate: ${marketData.usdNgn || 'N/A'}
Inflation Rate: ${marketData.inflation || 'N/A'}

Write in this format:

MARKET SUMMARY
[2-3 sentences on the overall market direction and key drivers today]

SECTOR HIGHLIGHTS
[Which sectors are leading/lagging and why]

NOTABLE MOVERS
[Brief commentary on the top gainers and losers]

SHORT-TERM OUTLOOK
[1-2 sentences on what to watch in the near term]

Professional, factual tone. Keep it under 300 words total.
`
  return callGemini(prompt)
}

// ── Risk Analysis ─────────────────────────────────────────────────────────────
export async function analyzeRisk(portfolio) {
  const prompt = `
You are a risk officer at a Nigerian SEC-regulated asset management firm.
Assess the following portfolio risk metrics and provide a risk narrative.

Portfolio: ${portfolio.portfolio}
Sharpe Ratio: ${portfolio.sharpe}
Volatility: ${portfolio.volatility}
Max Drawdown: ${portfolio.maxDrawdown}
Sector Concentration: ${portfolio.concentration}
Risk Level: ${portfolio.level}

Provide your risk assessment in this format:

RISK SUMMARY
[Overall risk assessment in 2 sentences]

CONCENTRATION RISK
[Assessment of sector/stock concentration and whether it breaches acceptable thresholds for a Nigerian asset manager]

VOLATILITY ASSESSMENT
[Is the volatility level acceptable? How does the Sharpe ratio reflect risk-adjusted returns?]

DRAWDOWN ANALYSIS
[Commentary on the max drawdown — is it within acceptable limits?]

RECOMMENDED ACTIONS
• [Action 1]
• [Action 2]
• [Action 3]

Reference SEC Nigeria risk management guidelines where relevant.
`
  return callGemini(prompt)
}
