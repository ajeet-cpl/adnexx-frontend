import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Save, Loader, ChevronDown, Search, Check } from 'lucide-react';

export default function FormModal({
  title,
  subtitle,
  open,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Save',
  width = 600,
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  async function handleSubmit() {
    setSaving(true);
    setErr(null);
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: width, width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)', margin: 0, fontFamily: 'Syne, sans-serif' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {err && (
          <div style={{ background: 'rgba(225,29,72,0.06)', borderBottom: '1px solid rgba(225,29,72,0.15)', padding: '10px 20px', fontSize: '0.78rem', color: 'var(--red)', flexShrink: 0 }}>
            {err}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>{children}</div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Loader size={13} className="spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Field helpers for form layouts
// --------------------------------------------------------------------------
export function FormRow({ children, cols = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 16px', marginBottom: 14 }}>{children}</div>;
}

export function FormGroup({ label, required, children, hint }) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function FormInput({ value, onChange, placeholder, type = 'text', required, disabled }) {
  return (
    <input
      className="field-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      style={{ width: '100%' }}
    />
  );
}

export function FormSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Scroll selected item into view on open
  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector('[data-selected="true"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, value]);

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="custom-select-wrap" ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        disabled={disabled}
      >
        <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : (placeholder || 'Select…')}
        </span>
        <ChevronDown size={14} className={`custom-select-chevron ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.length > 5 && (
            <div className="custom-select-search">
              <Search size={13} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="custom-select-list" ref={listRef}>
            {placeholder && (
              <button
                type="button"
                className={`custom-select-option ${value === '' ? 'selected' : ''}`}
                onClick={() => handleSelect('')}
                data-selected={value === ''}
              >
                <span className="custom-select-option-label">{placeholder}</span>
                {value === '' && <Check size={13} className="custom-select-check" />}
              </button>
            )}
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                className={`custom-select-option ${value === o.value ? 'selected' : ''}`}
                onClick={() => handleSelect(o.value)}
                data-selected={value === o.value}
              >
                <span className="custom-select-option-label">{o.label}</span>
                {value === o.value && <Check size={13} className="custom-select-check" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="custom-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FormCheckbox({ label, checked, onChange }) {
  return (
    <label className="field-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function FormTextArea({ value, onChange, placeholder, rows = 3, disabled }) {
  return (
    <textarea
      className="field-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
    />
  );
}

