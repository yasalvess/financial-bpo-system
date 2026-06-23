// Componentes de UI compartilhados

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ----- Icon set (inline SVG, small set) -----
function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 2 }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round'
  };
  const paths = {
    home: <><path d="M3 12 12 3l9 9" /><path d="M5 10v10h14V10" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    filter: <><path d="M3 5h18M6 12h12M10 19h4" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
    arrowLeft: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14M19 12l-7 7-7-7" /></>,
    check: <><path d="M5 12l5 5L20 7" /></>,
    x: <><path d="M18 6 6 18M6 6l12 12" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
    more: <><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" /></>,
    pie: <><path d="M21 12a9 9 0 1 1-9-9v9z" /><path d="M21 12A9 9 0 0 0 12 3v9z" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    bank: <><path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7" /></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-1V3z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>,
    chevronDown: <><path d="m6 9 6 6 6-6" /></>,
    chevronUp: <><path d="m18 15-6-6-6 6" /></>,
    chevronRight: <><path d="m9 6 6 6-6 6" /></>,
    alert: <><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5" /></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></>,
    creditCard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
}

// ----- Buttons -----
function Btn({ variant = 'primary', size = 'md', icon, children, onClick, disabled, type = 'button', style = {}, title }) {
  const pad = size === 'sm' ? '6px 10px' : size === 'lg' ? '12px 20px' : '8px 14px';
  const fs = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;
  const variants = {
    primary: { background: 'var(--c-primary)', color: '#fff', border: '1px solid var(--c-primary)' },
    secondary: { background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border)' },
    ghost: { background: 'transparent', color: 'var(--c-text-muted)', border: '1px solid transparent' },
    danger: { background: 'var(--c-surface)', color: '#dc2626', border: '1px solid var(--c-red-bg)' },
    success: { background: '#16a34a', color: '#fff', border: '1px solid #16a34a' },
    dark: { background: 'var(--c-text)', color: '#fff', border: '1px solid var(--c-text)' },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} title={title}
      style={{
        ...variants[variant],
        padding: pad, fontSize: fs, fontWeight: 500,
        borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        fontFamily: 'inherit', lineHeight: 1.2,
        ...style
      }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

// ----- Badge -----
function Badge({ status, children, dot = true }) {
  const c = statusColor(status) || { bg: 'var(--c-bg)', fg: 'var(--c-text-muted)', dot: '#94a3b8', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.fg,
      fontSize: 12, fontWeight: 600
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: 99, background: c.dot }} />}
      {children || c.label}
    </span>
  );
}

// ----- Card -----
function Card({ children, style = {}, padding = 20, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--c-surface)', borderRadius: 12, padding,
      border: '1px solid var(--c-border)',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}>
      {children}
    </div>
  );
}

// ----- KPI Card -----
function KPI({ label, value, delta, deltaLabel, icon, color = 'var(--c-text)', sub }) {
  return (
    <Card padding={18}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {icon && <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}14`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Icon name={icon} size={16} /></div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      {(delta != null || sub) && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta != null && (
            <span style={{ color: delta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <Icon name={delta >= 0 ? 'arrowUp' : 'arrowDown'} size={12} />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub || deltaLabel}
        </div>
      )}
    </Card>
  );
}

// ----- Modal -----
function Modal({ open, onClose, title, children, width = 560, footer }) {
  useEffect(() => {
    function esc(e) { if (e.key === 'Escape' && open) onClose(); }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
      backdropFilter: 'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--c-surface)', borderRadius: 12, width: '100%', maxWidth: width, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4 }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ padding: 22, overflow: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ----- Form fields -----
function Field({ label, children, hint, required, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{hint}</span>}
    </div>
  );
}

const inputStyle = {
  padding: '8px 12px', fontSize: 14,
  border: '1px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)',
  fontFamily: 'inherit', outline: 'none', color: 'var(--c-text)', width: '100%',
  boxSizing: 'border-box',
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function CustomSelect({ value, onChange, options, placeholder = 'Selecionar', style = {}, disabled = false, size = 'md' }) {
  const { useState, useEffect, useRef } = React;
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = opts.find(o => o.value === value);

  const heights = { sm: 32, md: 38, lg: 44 };
  const fontSizes = { sm: 12, md: 13, lg: 14 };

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function select(val) {
    if (onChange) onChange({ target: { value: val } });
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        className="custom-select-btn"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          height: heights[size],
          padding: '0 34px 0 12px',
          background: open ? 'var(--c-surface)' : 'var(--c-surface)',
          border: `1.5px solid ${open ? 'var(--c-primary)' : 'var(--c-border)'}`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center',
          fontSize: fontSizes[size],
          color: selected ? 'var(--c-text)' : 'var(--c-text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'inherit',
          boxShadow: open ? `0 0 0 3px var(--c-primary-soft)` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          position: 'relative',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected?.label || placeholder}
        </span>
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`,
          transition: 'transform 0.2s', color: 'var(--c-text-muted)',
          display: 'flex', pointerEvents: 'none'
        }}>
          <Icon name="chevronDown" size={14} />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          background: 'var(--c-surface)',
          border: '1.5px solid var(--c-primary)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(11,29,57,0.14)',
          zIndex: 500,
          overflow: 'hidden',
          animation: 'dropIn 0.12s cubic-bezier(.16,1,.3,1)',
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {opts.map((o, i) => (
            <button
              key={o.value}
              type="button"
              onClick={() => select(o.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                background: o.value === value ? 'var(--c-primary-soft)' : 'transparent',
                border: 'none',
                borderBottom: i < opts.length - 1 ? '1px solid var(--c-border)' : 'none',
                textAlign: 'left',
                fontSize: fontSizes[size],
                fontFamily: 'inherit',
                color: o.value === value ? 'var(--c-primary)' : 'var(--c-text)',
                fontWeight: o.value === value ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                if (o.value !== value) e.currentTarget.style.background = 'var(--c-bg)'
              }}
              onMouseLeave={e => {
                if (o.value !== value) e.currentTarget.style.background = 'transparent'
              }}
            >
              {o.label}
              {o.value === value && (
                <Icon name="check" size={13} color="var(--c-primary)" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function Textarea(props) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', ...(props.style || {}) }} />;
}

// ----- Simple chart components (SVG) -----
function BarChart({ data, height = 180, color = 'var(--c-primary)' }) {
  // data: [{label, value}]
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingTop: 16 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>{formatBRL(d.value).replace('R$', '').trim().split(',')[0]}</div>
          <div style={{
            width: '100%', maxWidth: 56,
            height: `${(d.value / max) * 100}%`,
            background: d.color || color, borderRadius: '6px 6px 0 0', minHeight: 2,
            transition: 'all 0.3s'
          }} />
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }) {
  // data: [{label, value, color}]
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  let acc = 0;
  const C = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--c-border)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * C;
        const offset = -acc * C;
        acc += frac;
        return (
          <circle key={i} cx={cx} cy={cx} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cx})`} />
        );
      })}
      {centerValue && (
        <>
          <text x={cx} y={cx - 4} textAnchor="middle" fontSize="13" fill="var(--c-text-muted)" fontWeight="500">{centerLabel}</text>
          <text x={cx} y={cx + 16} textAnchor="middle" fontSize="18" fill="var(--c-text)" fontWeight="700">{centerValue}</text>
        </>
      )}
    </svg>
  );
}

function LineChart({ series, height = 200, labels = [] }) {
  // series: [{name, color, points: [number]}]
  const allValues = series.flatMap(s => s.points);
  const max = Math.max(1, ...allValues);
  const min = Math.min(0, ...allValues);
  const range = max - min || 1;
  const width = 600;
  const padding = { l: 50, r: 12, t: 12, b: 28 };
  const w = width - padding.l - padding.r;
  const h = height - padding.t - padding.b;
  const n = series[0]?.points.length || 0;
  const x = i => padding.l + (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const y = v => padding.t + h - ((v - min) / range) * h;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line x1={padding.l} x2={width - padding.r} y1={padding.t + h * t} y2={padding.t + h * t} stroke="var(--c-border)" strokeWidth="1" />
          <text x={padding.l - 6} y={padding.t + h * t + 4} fontSize="10" fill="var(--c-text-muted)" textAnchor="end">
            {formatBRL(max - range * t).replace('R$', '').trim().split(',')[0]}
          </text>
        </g>
      ))}
      {/* series */}
      {series.map((s, si) => {
        const path = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p)}`).join(' ');
        const area = `${path} L ${x(n - 1)} ${padding.t + h} L ${x(0)} ${padding.t + h} Z`;
        return (
          <g key={si}>
            <path d={area} fill={s.color} opacity="0.08" />
            <path d={path} stroke={s.color} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {s.points.map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p)} r="3" fill="var(--c-surface)" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        );
      })}
      {/* x labels */}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 8} fontSize="10" fill="var(--c-text-muted)" textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: it.color }} />
          <span style={{ color: 'var(--c-text-muted)' }}>{it.label}</span>
          {it.value != null && <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{it.value}</span>}
        </div>
      ))}
    </div>
  );
}

// ----- Table helpers -----
function EmptyState({ icon = 'file', title, hint, action }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--c-text-muted)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--c-bg)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{hint}</div>
      {action}
    </div>
  );
}

// ----- Toast (simple) -----
const ToastContext = React.createContext({ push: () => {} });
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = uid('t');
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: t.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${t.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,.08)', minWidth: 240,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name={t.type === 'error' ? 'alert' : 'check'} size={16} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
function useToast() { return React.useContext(ToastContext); }

// ----- Hook de responsividade -----
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ----- Validadores e Máscaras -----
const Validacao = {
  cnpj(v) {
    const nums = v.replace(/\D/g, '');
    if (nums.length !== 14) return 'CNPJ deve ter 14 dígitos';
    if (/^(\d)\1+$/.test(nums)) return 'CNPJ inválido';
    let sum = 0, peso = 5;
    for (let i = 0; i < 12; i++) { sum += parseInt(nums[i]) * peso; peso = peso === 2 ? 9 : peso - 1; }
    const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(nums[12]) !== d1) return 'CNPJ inválido';
    sum = 0; peso = 6;
    for (let i = 0; i < 13; i++) { sum += parseInt(nums[i]) * peso; peso = peso === 2 ? 9 : peso - 1; }
    const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(nums[13]) !== d2) return 'CNPJ inválido';
    return null;
  },
  email(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'E-mail inválido';
  },
  required(v, label) {
    return v?.trim() ? null : `${label} é obrigatório`;
  },
  valor(v) {
    return isNaN(parseFloat(v)) || parseFloat(v) <= 0 ? 'Valor deve ser maior que zero' : null;
  },
  senha(v) {
    return v.length >= 6 ? null : 'Senha deve ter pelo menos 6 caracteres';
  },
  telefone(v) {
    if (!v) return null;
    const nums = v.replace(/\D/g, '');
    if (nums.length === 0) return null;
    return nums.length === 10 || nums.length === 11 ? null : 'Telefone deve ter 10 ou 11 dígitos';
  },
  cep(v) {
    if (!v) return null;
    const nums = v.replace(/\D/g, '');
    if (nums.length === 0) return null;
    return nums.length === 8 ? null : 'CEP deve ter 8 dígitos';
  }
};

function maskCNPJ(v) {
  return v.replace(/\D/g, '').slice(0,14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskTelefone(v) {
  const n = v.replace(/\D/g, '').slice(0,11);
  if (n.length <= 10)
    return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0,8).replace(/(\d{5})(\d)/, '$1-$2');
}

function maskMoeda(v) {
  const num = v.replace(/\D/g, '');
  return (parseInt(num || '0') / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function ModalConfirmacao({ open, titulo, mensagem, labelConfirmar='Excluir', corConfirmar='#dc2626', onConfirmar, onCancelar }) {
  return (
    <Modal open={open} onClose={onCancelar} title={titulo} width={420}
      footer={<>
        <Btn variant="secondary" onClick={onCancelar}>Cancelar</Btn>
        <Btn onClick={onConfirmar} style={{ background: corConfirmar, color:'#fff', border:`1px solid ${corConfirmar}` }}>
          {labelConfirmar}
        </Btn>
      </>}>
      <p style={{ margin:0, fontSize:14, color:'var(--c-text-muted)', lineHeight:1.6 }}>
        {mensagem}
      </p>
    </Modal>
  );
}

function LoadingSpinner({ size = 24, color = 'var(--c-primary)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}40`, borderTopColor: color,
      animation: 'spin 1s linear infinite'
    }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function imprimirPDF(htmlStr, title = 'Documento') {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
          * { box-sizing: border-box; }
          .comprovante-wrapper { max-width: 600px; margin: 0 auto; border: 2px dashed #cbd5e1; padding: 32px; border-radius: 12px; }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 14px; font-weight: 700; color: #64748b; letter-spacing: 0.1em; margin-bottom: 12px; text-transform: uppercase; }
          .value { font-size: 32px; font-weight: 800; font-variant-numeric: tabular-nums; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .val { font-weight: 600; text-align: right; }
          .mono { font-family: ui-monospace, monospace; }
          
          @media print {
            body { padding: 0; }
            .comprovante-wrapper { border: none; padding: 0; max-width: none; }
          }
        </style>
      </head>
      <body>${htmlStr}</body>
      <script>
        setTimeout(() => {
          window.print();
          window.onafterprint = () => window.close();
        }, 300);
      </script>
    </html>
  `);
  win.document.close();
}

Object.assign(window, { Icon, Btn, Badge, Card, KPI, Modal, Field, Input, CustomSelect, Textarea, BarChart, DonutChart, LineChart, Legend, EmptyState, ToastProvider, useToast, useIsMobile, Validacao, maskCNPJ, maskTelefone, maskCEP, maskMoeda, ModalConfirmacao, LoadingSpinner, imprimirPDF, Toggle });
