export const ROLES = {
  ADMIN:     'admin',
  ANALYST:   'analyst',
  PORTFOLIO_MANAGER: 'portfolio_manager',
  COMPLIANCE: 'compliance',
  EXECUTIVE: 'executive',
}

export const ROLE_LABELS = {
  admin:              'System Administrator',
  analyst:            'Investment Analyst',
  portfolio_manager:  'Portfolio Manager',
  compliance:         'Compliance Officer',
  executive:          'Executive',
}

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'analyst', 'portfolio_manager', 'compliance', 'executive'],
  },
  {
    label: 'Market Intelligence',
    path: '/market',
    icon: 'TrendingUp',
    roles: ['admin', 'analyst', 'portfolio_manager', 'executive'],
  },
  {
    label: 'Stock Research',
    path: '/research',
    icon: 'Search',
    roles: ['admin', 'analyst', 'portfolio_manager'],
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    icon: 'PieChart',
    roles: ['admin', 'analyst', 'portfolio_manager', 'executive'],
  },
  {
    label: 'Risk Management',
    path: '/risk',
    icon: 'ShieldAlert',
    roles: ['admin', 'analyst', 'portfolio_manager', 'compliance'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'FileText',
    roles: ['admin', 'analyst', 'portfolio_manager', 'compliance', 'executive'],
  },
  {
    label: 'Research Repository',
    path: '/repository',
    icon: 'Archive',
    roles: ['admin', 'analyst', 'portfolio_manager'],
  },
  {
    label: 'Compliance & Audit',
    path: '/compliance',
    icon: 'ClipboardCheck',
    roles: ['admin', 'compliance'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    roles: ['admin'],
  },
]

export const STOCK_RECOMMENDATION = {
  BUY:  'BUY',
  HOLD: 'HOLD',
  SELL: 'SELL',
}

export const RISK_LEVEL = {
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
}

export const REPORT_TYPE = {
  PORTFOLIO_SUMMARY: 'portfolio_summary',
  INVESTMENT_MEMO:   'investment_memo',
  MARKET_OUTLOOK:    'market_outlook',
  RISK_REPORT:       'risk_report',
  EXECUTIVE_SUMMARY: 'executive_summary',
}

export const SECTORS = [
  'Banking',
  'Insurance',
  'Oil & Gas',
  'Consumer Goods',
  'Industrial Goods',
  'Healthcare',
  'ICT',
  'Real Estate',
  'Agriculture',
  'Conglomerates',
  'Services',
  'Utilities',
]

export const CURRENCIES = ['NGN', 'USD']

export const NGX_INDICES = ['NGX All-Share', 'NGX 30', 'NGX Banking', 'NGX Insurance', 'NGX Oil & Gas', 'NGX Consumer Goods']
