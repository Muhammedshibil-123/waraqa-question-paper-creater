import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/* ---------------- icons (24px stroke) ---------------- */
const P = {
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  fwd: 'M9 18l6-6-6-6',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  share: 'M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  print: 'M7 9V3h10v6M7 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-2M7 14h10v7H7z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  kbd: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  bank: 'M4 19V8l8-4 8 4v11M4 19h16M8 11v5M12 11v5M16 11v5',
  palette: 'M12 3a9 9 0 100 18c1.1 0 1.5-.8 1.5-1.6 0-.9-.6-1.4-.6-2.2 0-.9.7-1.7 1.7-1.7H17a4 4 0 004-4C21 6.8 17 3 12 3zM7.5 11.5h.01M10.5 7.5h.01M15 8h.01',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  page: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  table: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  shuffle: 'M16 4h4v4M4 20l16-16M20 16v4h-4M15 15l5 5M4 4l5 5',
  key: 'M14 10a4 4 0 11-1.2-2.8L21 3M17 7l2 2',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  install: 'M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  save: 'M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  sheet: 'M4 4h16v16H4zM4 9h16M9 4v16',
  bolt: 'M13 3L4 14h7l-1 7 9-11h-7z',
  file: 'M6 3h9l4 4v14H6zM15 3v4h4',
  chevD: 'M6 9l6 6 6-6',
  chevU: 'M18 15l-6-6-6 6',
  drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
};
export function Icon({ n, size = 20, stroke = 2, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={n === 'more' || n === 'drag' ? 3 : stroke} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
      <path d={P[n] || ''} />
    </svg>
  );
}

/* ---------------- keyboard context ---------------- */
const KbdCtx = createContext({ open: false, setOpen: () => {} });
export const useKbd = () => useContext(KbdCtx);
export function KbdProvider({ children }) {
  const [open, setOpen] = useState(false);
  return <KbdCtx.Provider value={{ open, setOpen }}>{children}</KbdCtx.Provider>;
}

/* ---------------- text inputs ---------------- */
export function TextInput({ value, onChange, placeholder, dir = 'auto', className = '', big, ...rest }) {
  const { open } = useKbd();
  return (
    <input
      className={'tin ' + (big ? 'big ' : '') + className}
      value={value ?? ''}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      inputMode={open ? 'none' : undefined}
      autoComplete="off"
      spellCheck={false}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, placeholder, dir = 'auto', minRows = 1, className = '', ...rest }) {
  const ref = useRef(null);
  const { open } = useKbd();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={'tin ta ' + className}
      rows={minRows}
      value={value ?? ''}
      dir={dir}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      inputMode={open ? 'none' : undefined}
      spellCheck={false}
      {...rest}
    />
  );
}

export function NumInput({ value, onChange, step = 1, min = 0, max, className = '', ...rest }) {
  return (
    <input
      className={'tin num-in ' + className}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : +e.target.value)}
      {...rest}
    />
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, suffix }) {
  const v = +value || 0;
  const set = (x) => onChange(Math.max(min, Math.min(max, +(x).toFixed(2))));
  return (
    <span className="stepper">
      <button type="button" onClick={() => set(v - step)} aria-label="Less">−</button>
      <span className="st-v">{value === '' ? '–' : v}{suffix}</span>
      <button type="button" onClick={() => set(v + step)} aria-label="More">+</button>
    </span>
  );
}

export function Seg({ value, onChange, options, small }) {
  return (
    <div className={'seg' + (small ? ' small' : '')} role="radiogroup">
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return <button type="button" key={String(v)} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle">
      <span className="tg-text"><span>{label}</span>{hint && <small>{hint}</small>}</span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="tg-track"><span className="tg-thumb" /></span>
    </label>
  );
}

export function Row({ label, children, hint, stack }) {
  return (
    <div className={'frow' + (stack ? ' stack' : '')}>
      <span className="fl">{label}{hint && <small>{hint}</small>}</span>
      <div className="fc">{children}</div>
    </div>
  );
}

export function Btn({ children, icon, kind = 'plain', onClick, className = '', ...rest }) {
  return (
    <button type="button" className={`btn ${kind} ${className}`} onClick={onClick} {...rest}>
      {icon && <Icon n={icon} size={18} />}
      {children && <span>{children}</span>}
    </button>
  );
}
export function IconBtn({ n, label, onClick, className = '', size = 20, ...rest }) {
  return <button type="button" className={'ibtn ' + className} onClick={onClick} aria-label={label} title={label} {...rest}><Icon n={n} size={size} /></button>;
}

/* ---------------- bottom sheet / dialog ---------------- */
export function Sheet({ open, onClose, title, children, footer, wide }) {
  const [show, setShow] = useState(open);
  useEffect(() => { if (open) setShow(true); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!show) return null;
  return createPortal(
    <div className={'sheet-wrap' + (open ? ' in' : ' out')} onAnimationEnd={() => !open && setShow(false)}>
      <div className="sheet-bg" onClick={onClose} />
      <div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        {title && (
          <div className="sheet-h">
            <h2>{title}</h2>
            <IconBtn n="x" label="Close" onClick={onClose} />
          </div>
        )}
        <div className="sheet-b">{children}</div>
        {footer && <div className="sheet-f">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* simple menu anchored as a sheet on mobile */
export function Menu({ open, onClose, items, title }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="menu">
        {items.filter(Boolean).map((it, i) => (
          <button type="button" key={i} className={'menu-i' + (it.danger ? ' danger' : '')} onClick={() => { onClose(); it.onClick(); }}>
            <Icon n={it.icon} size={20} /><span>{it.label}</span>{it.hint && <small>{it.hint}</small>}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- toast + confirm ---------------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg, action) => {
    clearTimeout(timer.current);
    setT({ msg, action, k: Date.now() });
    timer.current = setTimeout(() => setT(null), action ? 5000 : 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div className="toast" key={t.k} role="status">
          <span>{t.msg}</span>
          {t.action && <button type="button" onClick={() => { t.action.fn(); setT(null); }}>{t.action.label}</button>}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function Confirm({ open, title, body, okLabel = 'Delete', danger = true, onOk, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} footer={
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind={danger ? 'danger' : 'primary'} onClick={() => { onOk(); onClose(); }}>{okLabel}</Btn>
      </>
    }>
      <p className="muted">{body}</p>
    </Sheet>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        <span className="ea-1">ا</span><span className="ea-2">ب</span><span className="ea-3">ت</span>
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
