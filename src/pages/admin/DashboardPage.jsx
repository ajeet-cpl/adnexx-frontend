import useSWR from 'swr';
import { Link } from 'react-router-dom';
import {
  Plane,
  Globe2,
  Cpu,
  Building2,
  DoorOpen,
  ParkingSquare,
  Waypoints,
  Luggage,
  ClipboardList,
  Truck,
  AlertOctagon,
  Users,
  ShieldCheck,
  ArrowRight,
  Flag,
} from 'lucide-react';

import { adminFetcher } from '@/services/api-client';
import { hasRole } from '@/utils/auth';

const MASTERS = [
  { label: 'Airlines', href: '/admin/airlines', icon: Plane, statsKey: 'totalAirlines', endpoint: '/api/v1/airlines', color: 'var(--blue)', desc: 'IATA/ICAO, types, alliances' },
  { label: 'Airports', href: '/admin/airports', icon: Globe2, statsKey: 'totalAirports', endpoint: '/api/v1/airports', color: 'var(--cyan)', desc: 'Codes, timezone, coordinates' },
  { label: 'Aircraft Types', href: '/admin/aircraft-types', icon: Cpu, statsKey: 'totalAircraftTypes', endpoint: '/api/v1/aircraft-types', color: 'var(--violet)', desc: 'Dimensions, wake category' },
  { label: 'Countries', href: '/admin/countries', icon: Flag, statsKey: 'totalCountries', endpoint: '/api/v1/countries', color: 'var(--green)', desc: 'ISO 3166-1 country reference data' },
  { label: 'Terminals', href: '/admin/terminals', icon: Building2, statsKey: 'totalTerminals', endpoint: '/api/v1/terminals', color: 'var(--blue)', desc: 'Terminal buildings, capacity' },
  { label: 'Gates', href: '/admin/gates', icon: DoorOpen, statsKey: 'totalGates', endpoint: '/api/v1/gates', color: 'var(--green)', desc: 'Boarding gates, common use' },
  { label: 'Stands', href: '/admin/stands', icon: ParkingSquare, statsKey: 'totalStands', endpoint: '/api/v1/stands', color: 'var(--amber)', desc: 'Apron stands, GSE equipment' },
  { label: 'Runways', href: '/admin/runways', icon: Waypoints, statsKey: 'totalRunways', endpoint: '/api/v1/runways', color: 'var(--cyan)', desc: 'Designators, dimensions, surface' },
  { label: 'Baggage Belts', href: '/admin/belts', icon: Luggage, statsKey: 'totalBelts', endpoint: '/api/v1/baggage-belts', color: 'var(--violet)', desc: 'Arrivals, departures, oversized' },
  { label: 'Check-in Desks', href: '/admin/checkin-desks', icon: ClipboardList, statsKey: 'totalCheckInDesk', endpoint: '/api/v1/checkin-desks', color: 'var(--blue)', desc: 'Desk types, counters, airlines' },
  { label: 'Ground Handlers', href: '/admin/ground-handlers', icon: Truck, statsKey: 'totalGroundHandlers', endpoint: '/api/v1/ground-handlers', color: 'var(--amber)', desc: 'GHA companies and contacts' },
  { label: 'Delay Codes', href: '/admin/delay-codes', icon: AlertOctagon, statsKey: 'totalDelayCodes', endpoint: '/api/v1/delay-codes', color: 'var(--red)', desc: 'IATA + custom delay codes' },
  { label: 'Users', href: '/admin/users', icon: Users, statsKey: 'totalUsers', endpoint: '/api/v1/users', color: 'var(--green)', desc: 'Platform users, roles, access', adminOnly: true },
  { label: 'Tenants', href: '/admin/tenants', icon: ShieldCheck, statsKey: 'totalTenants', endpoint: '/api/v1/tenants', color: 'var(--violet)', desc: 'Multi-tenancy configuration' },
];

function MasterCardWidget({ card, stats, isLoading }) {
  const Icon = card.icon;
  const count = stats?.[card.statsKey] ?? 0;

  return (
    <Link to={card.href} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="master-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `color-mix(in srgb, ${card.color} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${card.color} 30%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} color={card.color} />
          </div>
          <ArrowRight size={14} color="var(--text-3)" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: card.color, lineHeight: 1, marginBottom: 4 }}>
          {isLoading ? '—' : count.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{card.label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{card.desc}</div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useSWR('/api/v1/dashboard/stats', adminFetcher, { revalidateOnFocus: false });
  const isAdmin = hasRole('ADMIN');
  const visibleCards = isAdmin ? MASTERS : MASTERS.filter((m) => !m.adminOnly);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--text-1)', margin: 0 }}>
          Master Data Administration
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 4 }}>Manage all reference and configuration data for the AODB platform</p>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 28,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', marginTop: 5, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--blue)', marginBottom: 3 }}>Master Data — Stage 1</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            All entities below feed into the AODB operational database. Changes here propagate to FIDS, RMS, and Slot applications in real-time.
            Ensure all reference data is accurate before activating operational modules.
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {visibleCards.map((card) => (
          <MasterCardWidget key={card.href} card={card} stats={stats} isLoading={isLoading} />
        ))}
      </div>

      {/* API Endpoints Reference */}
      <div style={{ marginTop: 36, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'IBM Plex Mono, monospace' }}>API Endpoints</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginLeft: 4 }}>All mapped to /api/v1/*</span>
        </div>
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
          {[...MASTERS.map((m) => m.endpoint), '/api/v1/dashboard/stats'].map((ep) => (
            <div key={ep} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--green)', background: 'rgba(34,197,94,0.08)', padding: '1px 5px', borderRadius: 3 }}>GET</span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text-3)' }}>{ep}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

