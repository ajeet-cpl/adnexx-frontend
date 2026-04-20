import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getSession, hasRole } from '@/utils/auth';
import {
  LayoutDashboard,
  Plane,
  Globe2,
  Building2,
  DoorOpen,
  ParkingSquare,
  Waypoints,
  Luggage,
  ClipboardList,
  Users,
  Truck,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Database,
  Cpu,
} from 'lucide-react';

const NAV = [
  {
    section: 'OVERVIEW',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    section: 'REFERENCE DATA',
    items: [
      { href: '/admin/airlines', label: 'Airlines', icon: Plane },
      { href: '/admin/airports', label: 'Airports', icon: Globe2 },
      { href: '/admin/aircraft-types', label: 'Aircraft Types', icon: Cpu },
      { href: '/admin/countries', label: 'Countries', icon: Globe2 },
    ],
  },
  {
    section: 'INFRASTRUCTURE',
    items: [
      { href: '/admin/terminals', label: 'Terminals', icon: Building2 },
      { href: '/admin/gates', label: 'Gates', icon: DoorOpen },
      { href: '/admin/stands', label: 'Stands', icon: ParkingSquare },
      { href: '/admin/runways', label: 'Runways', icon: Waypoints },
      { href: '/admin/belts', label: 'Baggage Belts', icon: Luggage },
      { href: '/admin/checkin-desks', label: 'Check-in Desks', icon: ClipboardList },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { href: '/admin/ground-handlers', label: 'Ground Handlers', icon: Truck },
      { href: '/admin/delay-codes', label: 'Delay Codes', icon: AlertOctagon },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, role: 'ADMIN' },
      { href: '/admin/tenants', label: 'Tenants', icon: ShieldCheck },
    ],
  },
];

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  function isActive(href, exact) {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + '/');
  }

  return (
    <nav className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div
        style={{
          padding: '0 14px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
        className="sidebar-divider-bottom"
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, var(--blue), var(--violet))',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={14} color="#fff" />
            </div>
            <div>
              <div className="sidebar-title" style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em' }}>ADNexx</div>
              <div className="sidebar-subtitle" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}>Master Data</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            style={{
              width: 30,
              height: 30,
              background: 'linear-gradient(135deg, var(--blue), var(--violet))',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto',
            }}
          >
            <Database size={14} color="#fff" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="sidebar-toggle-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && <div className="nav-section-label">{section}</div>}
            {collapsed && <div style={{ height: 8 }} />}
            {items.filter(({ role }) => !role || hasRole(role)).map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  to={href}
                  title={collapsed ? label : undefined}
                  className={`nav-item ${active ? 'active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : undefined }}
                  onClick={onMobileClose}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-divider-top" style={{ padding: '10px 8px', flexShrink: 0 }}>
        {!collapsed && session && (
          <div style={{ padding: '6px 10px 8px' }}>
            <div className="sidebar-username" style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.name || session.email}
            </div>
            <div className="sidebar-role" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'IBM Plex Mono, monospace' }}>
              {session.role || 'admin'}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className="nav-item"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', background: 'none' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(225,29,72,0.08)';
            el.style.color = 'var(--red)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'transparent';
            el.style.color = 'var(--text-2)';
          }}
        >
          <LogOut size={14} />
          {!collapsed && 'Logout'}
        </button>

        {collapsed && (
          <button
            onClick={onToggle}
            className="nav-item"
            style={{ width: '100%', justifyContent: 'center', border: 'none', cursor: 'pointer', background: 'none', marginTop: 4 }}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </nav>
  );
}

