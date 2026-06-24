import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('aamip-token')
      sessionStorage.removeItem('aamip-user')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (error.response?.status >= 500) {
      toast.error('A server error occurred. Please try again.')
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:       (data)         => api.post('/auth/login', data),
  me:          ()             => api.get('/auth/me'),
  listUsers:   ()             => api.get('/auth/users'),
  createUser:  (data)         => api.post('/auth/users', data),
  updateUser:  (id, data)     => api.put(`/auth/users/${id}`, data),
}

// ── Stocks ────────────────────────────────────────────────────────────────────
export const stocksAPI = {
  list:              ()            => api.get('/stocks'),
  create:            (data)        => api.post('/stocks', data),
  getPrices:         (ticker, limit=60) => api.get(`/stocks/${ticker}/prices?limit=${limit}`),
  getFinancials:     (ticker)      => api.get(`/stocks/${ticker}/financials`),
  getResearch:       (ticker)      => api.get(`/stocks/${ticker}/research`),
  getFundamentals:   (ticker)      => api.get(`/stocks/${ticker}/fundamentals`),
  getAllFundamentals:()            => api.get('/stocks/fundamentals/all'),
}

// ── Portfolios ────────────────────────────────────────────────────────────────
export const portfoliosAPI = {
  list:          ()            => api.get('/portfolios'),
  create:        (data)        => api.post('/portfolios', data),
  get:           (id)          => api.get(`/portfolios/${id}`),
  getHoldings:   (id)          => api.get(`/portfolios/${id}/holdings`),
  addHolding:    (id, data)    => api.post(`/portfolios/${id}/holdings`, data),
  updateHolding: (pid, hid, data) => api.put(`/portfolios/${pid}/holdings/${hid}`, data),
  deleteHolding: (pid, hid)    => api.delete(`/portfolios/${pid}/holdings/${hid}`),
}

// ── Market ────────────────────────────────────────────────────────────────────
export const marketAPI = {
  getFXRates:   (limit=30)     => api.get(`/market/fx-rates?limit=${limit}`),
  getLatestFX:  ()             => api.get('/market/fx-rates/latest'),
  getMacro:     ()             => api.get('/market/macro'),
  getMovers:    ()             => api.get('/market/prices/movers'),
  getAuditLog:  (limit=100)    => api.get(`/market/audit-log?limit=${limit}`),
}

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadsAPI = {
  marketPrices:       (formData) => api.post('/uploads/market-prices', formData),
  companyFinancials:  (formData) => api.post('/uploads/company-financials', formData),
  fxRates:            (formData) => api.post('/uploads/fx-rates', formData),
  macroIndicators:    (formData) => api.post('/uploads/macro-indicators', formData),
  portfolioHoldings:  (formData) => api.post('/uploads/portfolio-holdings', formData),
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  analyzeStock:     (ticker)        => api.post('/ai/analyze-stock', { ticker }),
  analyzePortfolio: (portfolio_id, metrics) => api.post('/ai/analyze-portfolio', { portfolio_id, metrics }),
}

export default api
