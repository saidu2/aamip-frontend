export default function Input({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {LeftIcon && (
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <LeftIcon size={15} />
          </span>
        )}
        <input
          style={{
            width: '100%',
            background: 'var(--bg-secondary)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`,
            borderRadius: 6,
            padding: `9px ${RightIcon ? 36 : 12}px 9px ${LeftIcon ? 34 : 12}px`,
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
          onBlur={e  => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-default)'}
          className={className}
          {...props}
        />
        {RightIcon && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <RightIcon size={15} />
          </span>
        )}
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: 11 }}>{error}</span>}
      {hint && !error && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{hint}</span>}
    </div>
  )
}
