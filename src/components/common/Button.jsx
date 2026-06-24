export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-sm',
  }

  const variants = {
    primary:  'bg-[var(--gold-primary)] text-[#0A0E1A] hover:bg-[var(--gold-light)] active:bg-[var(--gold-dim)]',
    secondary:'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--gold-primary)] hover:text-[var(--gold-light)]',
    danger:   'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white',
    ghost:    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    outline:  'border border-[var(--gold-primary)] text-[var(--gold-primary)] hover:bg-[var(--gold-subtle)]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
