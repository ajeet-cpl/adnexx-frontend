import {
  Plus,
  Search,
  Pencil,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

export default function MasterPage({
  title,
  subtitle,
  icon,
  columns,
  data,
  loading,
  error,
  idKey,
  searchValue,
  onSearchChange,
  onRefresh,
  onAdd,
  onEdit,
  onToggle,
  hasToggle,
  activeKey,
  addLabel = 'Add New',
  stats,
  page = 1,
  totalPages = 1,
  onPageChange,
  readOnly = false,
  renderExtraActions,
  extraToolbar,
  extraHeaderButtons,
  templateFile,
}) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                color: 'var(--text-1)',
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {templateFile && (
              <a
                href={`/templates/${templateFile}`}
                download={templateFile}
                className="btn-ghost"
                title="Download CSV Template"
                style={{ textDecoration: 'none' }}
              >
                <Download size={13} />
                <span style={{ fontSize: '0.82rem' }}>Template</span>
              </a>
            )}
            {extraHeaderButtons}
            <button
              className="btn-primary"
              onClick={onAdd}
            >
              <Plus size={14} />
              {addLabel}
            </button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      {stats && stats.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            gap: 12,
            marginBottom: 20,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="stat-mini">
              <div className="stat-mini-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-mini-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
          />
          <input
            className="field-input"
            style={{ paddingLeft: 30, width: '100%' }}
            placeholder="Search…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn-ghost" onClick={onRefresh} title="Refresh" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span style={{ fontSize: '0.78rem' }}>Refresh</span>
        </button>
        {extraToolbar}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: '0.8rem',
            color: 'var(--red)',
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
              <th style={{ width: hasToggle ? 110 : 80, textAlign: 'right' }}>{readOnly ? '' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={14} className="spin" /> Loading…
                  </div>
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                  No records found
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row, i) => (
                <tr key={String(row[idKey])} style={{ animationDelay: `${i * 20}ms` }}>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                  <td>
                    {!readOnly && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      {renderExtraActions && renderExtraActions(row)}
                      {hasToggle && activeKey && onToggle && (
                        <button
                          className="action-btn"
                          title={row[activeKey] ? 'Deactivate' : 'Activate'}
                          onClick={() => onToggle(row)}
                          style={{ color: row[activeKey] ? 'var(--green)' : 'var(--text-3)' }}
                        >
                          {row[activeKey] ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      )}
                      <button className="action-btn" title="Edit" onClick={() => onEdit(row)}>
                        <Pencil size={13} />
                      </button>
                    </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn-ghost" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} style={{ padding: '6px 10px' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
            Page {page} of {totalPages}
          </span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)} style={{ padding: '6px 10px' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}


    </div>
  );
}

