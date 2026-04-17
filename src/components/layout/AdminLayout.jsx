import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, HelpCircle, Palette, Check } from 'lucide-react';

import AdminSidebar from '@/components/layout/AdminSidebar';
import { getSession } from '@/utils/auth';
import { ToastProvider } from '@/utils/toast';
import useTheme, { THEMES } from '@/hooks/useTheme';

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const session = getSession();
  const { theme, setTheme, isDark } = useTheme();
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const themePanelRef = useRef(null);

  // Close theme panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (themePanelRef.current && !themePanelRef.current.contains(e.target)) {
        setThemePanelOpen(false);
      }
    }
    if (themePanelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [themePanelOpen]);

  // Derive breadcrumb from path
  const parts = (pathname || '/admin').split('/').filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    label: p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    href: '/' + parts.slice(0, i + 1).join('/'),
  }));

  return (
    <ToastProvider>
      <div className="admin-shell">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className={`admin-content ${collapsed ? 'collapsed' : ''}`}>
          {/* Topbar */}
          <div className="admin-topbar">
            <nav style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {crumbs.map((crumb, i) => (
                <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>/</span>}
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: i === crumbs.length - 1 ? 'var(--text-1)' : 'var(--text-3)',
                      fontWeight: i === crumbs.length - 1 ? 600 : 400,
                      fontFamily: 'IBM Plex Mono, monospace',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div ref={themePanelRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setThemePanelOpen((v) => !v)}
                  title="Change theme"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    padding: 6,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                >
                  <Palette size={15} />
                </button>
                {themePanelOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-mid)',
                      borderRadius: 10,
                      padding: 8,
                      minWidth: 180,
                      zIndex: 999,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', padding: '4px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Theme
                    </div>
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t.id); setThemePanelOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '7px 8px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          background: theme === t.id ? 'var(--blue-glow)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (theme !== t.id) e.currentTarget.style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { if (theme !== t.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: t.color,
                            border: `2px solid ${t.accent}`,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-1)', fontWeight: theme === t.id ? 600 : 400, flex: 1, textAlign: 'left' }}>
                          {t.label}
                        </span>
                        {theme === t.id && <Check size={13} style={{ color: 'var(--blue)' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <HelpCircle size={15} />
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Bell size={15} />
              </button>
              {session && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--blue), var(--violet))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {(session.name || session.email || 'A')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 500 }}>{session.name || session.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

