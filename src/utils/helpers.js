import { format, formatDistanceToNow } from 'date-fns'

export const formatCurrency = (amount, currency = 'NGN') => {
  if (amount === null || amount === undefined) return '—'
  const symbol = currency === 'USD' ? '$' : '₦'
  return `${symbol}${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '—'
  return Number(num).toLocaleString('en-NG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(decimals)}%`
}

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export const timeAgo = (date) => {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const getChangeColor = (value) => {
  if (value > 0)  return 'var(--success)'
  if (value < 0)  return 'var(--danger)'
  return 'var(--text-muted)'
}

export const getChangeBadge = (value) => {
  if (value > 0)  return 'badge-success'
  if (value < 0)  return 'badge-danger'
  return 'badge-muted'
}

export const getRiskBadge = (level) => {
  const map = { LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger' }
  return map[level] || 'badge-muted'
}

export const getRecommendationBadge = (rec) => {
  const map = { BUY: 'badge-success', HOLD: 'badge-warning', SELL: 'badge-danger' }
  return map[rec] || 'badge-muted'
}

export const truncate = (str, len = 60) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export const initials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
