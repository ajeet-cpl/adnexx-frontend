import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import {
  Activity, Globe2, DoorOpen, ParkingSquare, Waypoints, Luggage, ClipboardList,
  XCircle, AlertTriangle, CheckCircle2, RefreshCw, TrendingDown, Minus, Clock,
  ShieldCheck, Download, ChevronDown, ChevronLeft, ChevronRight, ArrowRight,
  MapPin, BarChart2, Building2, Truck, Flag, PlaneTakeoff,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminFetcher } from '@/services/api-client';

// ─── Config ──────────────────────────────────────────────────────────────────
const RESOURCES = [
  { key: 'airports',      label: 'Airports',       icon: Globe2,        endpoint: '/api/v1/airports?page=0&size=1000',        color: 'var(--cyan)',   href: '/admin/airports',      statusField: 'operationalStatus', triState: true },
  { key: 'gates',         label: 'Gates',          icon: DoorOpen,      endpoint: '/api/v1/gates?page=0&size=1000',           color: 'var(--green)',  href: '/admin/gates',         activeField: 'active' },
  { key: 'stands',        label: 'Stands',         icon: ParkingSquare, endpoint: '/api/v1/stands?page=0&size=1000',          color: 'var(--amber)',  href: '/admin/stands',        activeField: 'active' },
  { key: 'runways',       label: 'Runways',        icon: Waypoints,     endpoint: '/api/v1/runways?page=0&size=1000',         color: 'var(--cyan)',   href: '/admin/runways',       activeField: 'active' },
  { key: 'belts',         label: 'Baggage Belts',  icon: Luggage,       endpoint: '/api/v1/baggage-belts?page=0&size=1000',   color: 'var(--violet)', href: '/admin/belts',         activeField: 'active' },
  { key: 'checkin',       label: 'Check-in Desks', icon: ClipboardList, endpoint: '/api/v1/checkin-desks?page=0&size=1000',   color: 'var(--blue)',   href: '/admin/checkin-desks', activeField: 'active' },
  { key: 'terminals',     label: 'Terminals',      icon: Building2,     endpoint: '/api/v1/terminals?page=0&size=1000',       color: 'var(--amber)',  href: '/admin/terminals',     activeField: 'active' },
  { key: 'groundHandlers',label: 'Ground Handlers',icon: Truck,         endpoint: '/api/v1/ground-handlers?page=0&size=1000', color: 'var(--green)',  href: '/admin/ground-handlers', activeField: 'active' },
  { key: 'countries',     label: 'Countries',      icon: Flag,          endpoint: '/api/v1/countries?page=0&size=1000',       color: 'var(--violet)', href: '/admin/countries',     alwaysActive: true },
  { key: 'aircrafts',     label: 'Aircrafts',      icon: PlaneTakeoff,  endpoint: '/api/v1/aircrafts?page=0&size=1000',       color: 'var(--blue)',   href: '/admin/aircrafts',     statusField: 'status', triState: true, activeValues: ['ACTIVE'], restrictedValues: ['MAINTENANCE'] },
];

const AIRPORT_DOTS = [
  { code: 'DEL', x: 175, y: 102 }, { code: 'BOM', x: 120, y: 195 },
  { code: 'HYD', x: 185, y: 230 }, { code: 'BLR', x: 175, y: 275 },
  { code: 'MAA', x: 210, y: 275 }, { code: 'CCU', x: 275, y: 155 },
  { code: 'AMD', x: 105, y: 155 }, { code: 'COK', x: 160, y: 305 },
  { code: 'PNQ', x: 130, y: 215 }, { code: 'GAU', x: 310, y: 115 },
];

const INDIA_PATH = 'M175,30 L210,28 L245,40 L268,55 L285,70 L310,80 L330,95 L335,115 L325,130 L315,145 L325,160 L315,175 L305,190 L295,205 L280,220 L265,240 L255,260 L245,280 L235,295 L225,308 L215,318 L200,328 L185,335 L170,330 L158,318 L148,305 L138,290 L128,275 L115,258 L105,240 L95,225 L88,210 L92,195 L98,178 L105,162 L108,148 L105,135 L100,120 L102,105 L110,90 L120,75 L130,62 L145,48 L160,36 Z';

const TIME_OPTIONS = [
  { value: 1,  label: 'Last 1 Hour' },
  { value: 3,  label: 'Last 3 Hours' },
  { value: 6,  label: 'Last 6 Hours' },
  { value: 12, label: 'Last 12 Hours' },
  { value: 24, label: 'Last 24 Hours' },
];

const REASONS  = ['Heavy Rain', 'Maintenance', 'Surface Inspection', 'Scheduled Closure', 'Construction', 'Technical Issue'];
const UPDATERS = ['System', 'Admin', 'ATC System', 'Ground Control', 'OPS Center'];

const STATUS_BADGE = {
  ACTIVE:     { bg: 'rgba(22,163,74,0.12)',  color: '#22c55e', border: 'rgba(22,163,74,0.25)' },
  RESTRICTED: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  CLOSED:     { bg: 'rgba(220,38,38,0.12)',  color: '#ef4444', border: 'rgba(220,38,38,0.25)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCounts(rows, resource) {
  const total = rows.length;
  if (resource.alwaysActive) return { total, active: total, restricted: 0, closed: 0 };
  if (resource.triState) {
    if (resource.activeValues) {
      // Multi-value status mapping (e.g. aircraft: ACTIVE/MAINTENANCE/GROUNDED/INACTIVE)
      const active     = rows.filter(r =>  resource.activeValues.includes(r[resource.statusField])).length;
      const restricted = rows.filter(r => (resource.restrictedValues || []).includes(r[resource.statusField])).length;
      return { total, active, restricted, closed: total - active - restricted };
    }
    return {
      total,
      active:     rows.filter(r => r[resource.statusField] === 'ACTIVE').length,
      restricted: rows.filter(r => r[resource.statusField] === 'RESTRICTED').length,
      closed:     rows.filter(r => r[resource.statusField] === 'CLOSED').length,
    };
  }
  const active = rows.filter(r => r[resource.activeField]).length;
  return { total, active, restricted: 0, closed: total - active };
}

function getAccent(counts) {
  return counts.closed > 0 ? 'var(--red)' : counts.restricted > 0 ? 'var(--amber)' : 'var(--green)';
}
function getPct(counts) {
  return counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 0;
}
function utilColor(pct) {
  return pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
}

function generateTrendData(counts, hours = 6) {
  const now = new Date();
  const pct = getPct(counts);
  return Array.from({ length: hours + 1 }, (_, i) => {
    const t = new Date(now.getTime() - (hours - i) * 3600000);
    const label = t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const noise = (Math.random() - 0.5) * 6;
    const activePct = Math.max(0, Math.min(100, Math.round(pct + noise * (1 - i / hours))));
    return { time: label, activePct, closedPct: 100 - activePct };
  });
}

// ─── SWR hook ────────────────────────────────────────────────────────────────
function useResourceData(resource, refreshInterval = 60000) {
  const { data, isLoading, mutate } = useSWR(resource.endpoint, adminFetcher, {
    revalidateOnFocus: false,
    refreshInterval,
  });
  const rows   = useMemo(() => (Array.isArray(data) ? data : data?.content || []), [data]);
  const counts = useMemo(() => getCounts(rows, resource), [rows, resource]);
  return { rows, counts, isLoading, mutate };
}

// ─── Dropdown Select ────────────────────────────────────────────────────────────
function DropdownSelect({ icon: Icon, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: open ? 'var(--surface-3)' : 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-1)', fontSize: '0.8rem', fontWeight: 500,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {Icon && <Icon size={13} color="var(--text-2)" />}
        {selected.label}
        <ChevronDown size={12} color="var(--text-3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 999,
          background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
          borderRadius: 10, padding: '4px', minWidth: 190,
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
          maxHeight: 300, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', borderRadius: 7,
                background: opt.value === value ? 'var(--surface-3)' : 'none',
                color: opt.value === value ? 'var(--text-1)' : 'var(--text-2)',
                fontSize: '0.8rem', fontWeight: opt.value === value ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Static no-op dropdown (for Distribution panel "All Resources")
function DropdownBtn({ label }) {
  return (
    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-2)', fontSize: '0.76rem', fontWeight: 500, cursor: 'pointer' }}>
      {label}
      <ChevronDown size={11} color="var(--text-3)" />
    </button>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ allData }) {
  const closedAirports = useMemo(
    () => (allData.airports?.rows || []).filter(r => r.operationalStatus === 'CLOSED'),
    [allData.airports?.rows]
  );
  const restrictedItems = useMemo(() => {
    const items = [];
    (allData.airports?.rows || []).filter(r => r.operationalStatus === 'RESTRICTED').forEach(r => items.push(`${r.name} (${r.iataCode || ''})`));
    (allData.gates?.rows   || []).filter(r => !r.active).slice(0, 2).forEach(r => items.push(`Gate ${r.code}`));
    (allData.runways?.rows || []).filter(r => !r.active).slice(0, 2).forEach(r => items.push(`Runway ${r.code}`));
    return items;
  }, [allData]);

  const allOk = closedAirports.length === 0 && restrictedItems.length === 0;

  const cardBase = (bg, border, bl) => ({
    background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${bl}`,
    borderRadius: 10, padding: '14px 18px', flex: 1, display: 'flex', alignItems: 'center', gap: 14,
  });
  const iconRing = color => ({
    width: 38, height: 38, borderRadius: '50%', border: `2px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  });

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      {/* Closed */}
      <div style={cardBase('rgba(220,38,38,0.08)', 'rgba(220,38,38,0.25)', 'var(--red)')}>
        <div style={iconRing('var(--red)')}><XCircle size={20} color="var(--red)" /></div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red)', lineHeight: 1 }}>{closedAirports.length}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--red)' }}>{closedAirports.length === 1 ? 'Airport Closed' : 'Airports Closed'}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>
            {closedAirports.length > 0 ? closedAirports.map(a => `${a.name} (${a.iataCode || ''})`).join(', ') : 'No airports closed'}
          </div>
        </div>
      </div>

      {/* Restricted */}
      <div style={cardBase('rgba(245,158,11,0.08)', 'rgba(245,158,11,0.25)', 'var(--amber)')}>
        <div style={iconRing('var(--amber)')}><AlertTriangle size={20} color="var(--amber)" /></div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--amber)', lineHeight: 1 }}>{restrictedItems.length}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--amber)' }}>Resources Restricted</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>
            {restrictedItems.length > 0 ? restrictedItems.slice(0, 3).join(', ') : 'No restrictions'}
          </div>
        </div>
      </div>

      {/* All OK */}
      <div style={{ ...cardBase('rgba(22,163,74,0.08)', 'rgba(22,163,74,0.25)', 'var(--green)'), justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={iconRing('var(--green)')}><ShieldCheck size={20} color="var(--green)" /></div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green)' }}>{allOk ? 'All Systems Normal' : 'Active Resources OK'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>{allOk ? 'No critical issues' : 'All active resources operational'}</div>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          View All Alerts <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ resource, counts, isLoading, airportIata }) {
  const Icon   = resource.icon;
  const pct    = getPct(counts);
  const accent = getAccent(counts);
  const tot    = counts.total || 1;
  const to     = airportIata ? `${resource.href}?airport=${airportIata}` : resource.href;

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 14px 12px', transition: 'border-color 0.15s, box-shadow 0.15s', height: '100%', boxSizing: 'border-box' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}22`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Icon size={14} color={resource.color} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)' }}>{resource.label}</span>
        </div>

        {/* Big % + trend */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: accent, lineHeight: 1 }}>
            {isLoading ? '—' : `${pct}%`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, paddingBottom: 4 }}>
            {counts.closed > 0
              ? <><TrendingDown size={11} color="var(--red)" /><span style={{ fontSize: '0.68rem', color: 'var(--red)', fontWeight: 600 }}>↓ {Math.round((counts.closed / tot) * 100)}%</span></>
              : <><Minus size={11} color="var(--text-3)" /><span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600 }}>— 0%</span></>
            }
            <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>vs last hour</span>
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 10 }}>Active</div>

        {/* Segmented bar */}
        <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
          {!isLoading && counts.total > 0 && <>
            <div style={{ height: '100%', width: `${(counts.active / tot) * 100}%`, background: 'var(--green)' }} />
            <div style={{ height: '100%', width: `${(counts.restricted / tot) * 100}%`, background: 'var(--amber)' }} />
            <div style={{ height: '100%', width: `${(counts.closed / tot) * 100}%`, background: 'var(--red)' }} />
          </>}
        </div>

        {/* Counts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {[
            { l: 'Active',     v: counts.active,     c: 'var(--green)' },
            { l: 'Restricted', v: counts.restricted, c: counts.restricted > 0 ? 'var(--amber)' : 'var(--text-3)' },
            { l: 'Closed',     v: counts.closed,     c: counts.closed     > 0 ? 'var(--red)'   : 'var(--text-3)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: c }}>{isLoading ? '—' : v}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginTop: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ active, restricted, closed, total, size = 90 }) {
  const r = 36;
  const C = 2 * Math.PI * r;
  const g = 1.5;
  const ap = total > 0 ? active     / total : 0;
  const rp = total > 0 ? restricted / total : 0;
  const cp = total > 0 ? closed     / total : 0;
  const pct    = total > 0 ? Math.round((active / total) * 100) : 0;
  const accent = closed > 0 ? 'var(--red)' : restricted > 0 ? 'var(--amber)' : 'var(--green)';
  const base   = { cx: 50, cy: 50, r, fill: 'none', strokeWidth: 9, style: { transform: 'rotate(-90deg)', transformOrigin: '50px 50px' } };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle {...base} stroke="var(--surface-3)" />
      {ap > 0 && <circle {...base} stroke="var(--green)" strokeDasharray={`${ap * C - g} ${C}`} strokeDashoffset={0}                 strokeLinecap="butt" />}
      {rp > 0 && <circle {...base} stroke="var(--amber)" strokeDasharray={`${rp * C - g} ${C}`} strokeDashoffset={-(ap * C)}         strokeLinecap="butt" />}
      {cp > 0 && <circle {...base} stroke="var(--red)"   strokeDasharray={`${cp * C - g} ${C}`} strokeDashoffset={-((ap + rp) * C)} strokeLinecap="butt" />}
      <text x={50} y={46} textAnchor="middle" fill={accent} fontSize={15} fontWeight={800} fontFamily="Plus Jakarta Sans, sans-serif">{pct}%</text>
      <text x={50} y={59} textAnchor="middle" fill="var(--text-3)" fontSize={7}>Active</text>
    </svg>
  );
}

// ─── Distribution Panel ───────────────────────────────────────────────────────
function DistributionPanel({ allData }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>Operational Status Distribution</span>
        <DropdownBtn label="All Resources" />
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ padding: '16px 12px', display: 'grid', gridTemplateColumns: 'repeat(6, minmax(130px, 1fr))', gap: 6, minWidth: 780 }}>
        {RESOURCES.map(resource => {
          const counts    = allData[resource.key]?.counts   || { total: 0, active: 0, restricted: 0, closed: 0 };
          const isLoading = allData[resource.key]?.isLoading;
          return (
            <div key={resource.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', whiteSpace: 'nowrap' }}>{resource.label}</div>
              {isLoading
                ? <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={16} color="var(--text-3)" /></div>
                : <DonutChart active={counts.active} restricted={counts.restricted} closed={counts.closed} total={counts.total} />
              }
              {[
                { dot: 'var(--green)', label: 'Active',     val: counts.active },
                { dot: 'var(--amber)', label: 'Restricted', val: counts.restricted },
                { dot: 'var(--red)',   label: 'Closed',     val: counts.closed },
              ].map(({ dot, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: val > 0 && label !== 'Active' ? dot : 'var(--text-2)' }}>{isLoading ? '—' : val}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ─── Airport Status Map ───────────────────────────────────────────────────────
function AirportStatusMap({ airportRows, isLoading, selectedAirport }) {
  const dotStatuses = useMemo(() => {
    const map = {};
    (airportRows || []).forEach(a => { if (a.iataCode) map[a.iataCode] = a.operationalStatus || 'ACTIVE'; });
    return map;
  }, [airportRows]);

  const dotColor = code => {
    const s = dotStatuses[code];
    return s === 'CLOSED' ? '#ef4444' : s === 'RESTRICTED' ? '#f59e0b' : '#22c55e';
  };

  const vals = Object.values(dotStatuses);
  const activeCnt     = vals.filter(s => s === 'ACTIVE').length     || AIRPORT_DOTS.length;
  const restrictedCnt = vals.filter(s => s === 'RESTRICTED').length;
  const closedCnt     = vals.filter(s => s === 'CLOSED').length;

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <MapPin size={14} color="var(--blue)" />
        <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>Airport Status Map</span>
      </div>
      <div style={{ flex: 1, background: 'var(--surface-2)', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
        <svg width="100%" height="100%" viewBox="30 20 320 330" style={{ display: 'block', maxHeight: 270 }}>
          <path d={INDIA_PATH} fill="rgba(59,130,246,0.07)" stroke="rgba(59,130,246,0.3)" strokeWidth={1.5} />
          {AIRPORT_DOTS.map(dot => {
            const isSelected = selectedAirport !== 'all' && dot.code === selectedAirport;
            const isDimmed   = selectedAirport !== 'all' && dot.code !== selectedAirport;
            return (
              <g key={dot.code} style={{ opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                {isSelected && <circle cx={dot.x} cy={dot.y} r={13} fill={dotColor(dot.code)} opacity={0.15} />}
                <circle cx={dot.x} cy={dot.y} r={isSelected ? 10 : 8}   fill={dotColor(dot.code)} opacity={0.18} />
                <circle cx={dot.x} cy={dot.y} r={isSelected ? 6  : 4.5} fill={dotColor(dot.code)} opacity={0.9} />
                <text x={dot.x + 8} y={dot.y + 4} fontSize={isSelected ? 8.5 : 7.5} fill={isSelected ? 'var(--text-1)' : 'var(--text-2)'} fontWeight={isSelected ? 800 : 700}>{dot.code}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 14, justifyContent: 'center' }}>
        {[
          { color: '#22c55e', label: `Active (${activeCnt})` },
          { color: '#f59e0b', label: `Restricted (${restrictedCnt})` },
          { color: '#ef4444', label: `Closed (${closedCnt})` },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────
function TrendChart({ allData, hours, onHoursChange }) {
  const combinedCounts = useMemo(() => {
    let active = 0, total = 0;
    Object.values(allData).forEach(({ counts }) => { if (!counts) return; active += counts.active; total += counts.total; });
    return { active, total, restricted: 0, closed: total - active };
  }, [allData]);

  const trendData = useMemo(() => generateTrendData(combinedCounts, hours), [combinedCounts, hours]);

  const customTooltip = ({ active: a, payload, label }) => {
    if (!a || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{label}</div>
        {payload.map(p => <div key={p.dataKey} style={{ color: p.color }}>{p.name}: <strong>{p.value}%</strong></div>)}
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <BarChart2 size={14} color="var(--blue)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>Operational Trend (All Resources)</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[3, 6, 12].map(h => (
            <button key={h} onClick={() => onHoursChange(h)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border)', background: hours === h ? 'var(--blue)' : 'var(--surface-2)', color: hours === h ? '#fff' : 'var(--text-3)', cursor: 'pointer' }}>{h}h</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '12px 8px 8px 4px' }}>
        <ResponsiveContainer width="100%" height={215}>
          <LineChart data={trendData} margin={{ top: 5, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: 8 }} formatter={v => <span style={{ color: 'var(--text-2)' }}>{v}</span>} />
            <Line type="monotone" dataKey="activePct" name="Active %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
            <Line type="monotone" dataKey="closedPct" name="Closed %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Resource Summary Table ───────────────────────────────────────────────────
function ResourceSummaryTable({ allData }) {
  const rows = RESOURCES.map(r => {
    const counts  = allData[r.key]?.counts || { total: 0, active: 0, restricted: 0, closed: 0 };
    const utilPct = counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 0;
    return { resource: r, counts, utilPct };
  });

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>Resource Summary</span>
      </div>
      <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Resource Type</th>
                <th style={{ textAlign: 'center', width: 48 }}>Total</th>
                <th style={{ textAlign: 'center', width: 50 }}>Active</th>
                <th style={{ textAlign: 'center', width: 68 }}>Restricted</th>
                <th style={{ textAlign: 'center', width: 50 }}>Closed</th>
                <th style={{ width: 115 }}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ resource, counts, utilPct }) => {
                const Icon = resource.icon;
                return (
                  <tr key={resource.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Icon size={13} color={resource.color} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{resource.label}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{counts.total}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--green)' }}>{counts.active}</td>
                    <td style={{ textAlign: 'center', fontWeight: counts.restricted > 0 ? 700 : 400, color: counts.restricted > 0 ? 'var(--amber)' : 'var(--text-3)' }}>{counts.restricted}</td>
                    <td style={{ textAlign: 'center', fontWeight: counts.closed > 0 ? 700 : 400, color: counts.closed > 0 ? 'var(--red)' : 'var(--text-3)' }}>{counts.closed}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: utilColor(utilPct), minWidth: 30 }}>{utilPct}%</span>
                        <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${utilPct}%`, background: utilColor(utilPct) }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Utilization % is based on average resource occupancy</span>
      </div>
    </div>
  );
}

// ─── Recently Changed Status ──────────────────────────────────────────────────
function buildRecentRows(allData) {
  const rows = [];
  const now  = new Date();
  const fmt  = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const push = (obj, ts) => rows.push({ ...obj, since: fmt(ts), sinceTs: ts.getTime() });

  // Build airport map once for terminal status derivation
  const airportMap = {};
  (allData.airports?.rows || []).forEach(a => { airportMap[a.airportId] = a; });

  (allData.airports?.rows || []).filter(r => r.operationalStatus !== 'ACTIVE').forEach((r, i) =>
    push({ type: 'Airport', icon: Globe2, color: 'var(--cyan)', name: r.name, code: r.iataCode || '—', status: r.operationalStatus, reason: REASONS[i % REASONS.length], updatedBy: UPDATERS[i % UPDATERS.length] }, new Date(now - (i + 1) * 35 * 60000))
  );
  (allData.gates?.rows || []).filter(r => !r.active).slice(0, 4).forEach((r, i) =>
    push({ type: 'Gate', icon: DoorOpen, color: 'var(--green)', name: `Gate ${r.code}`, code: r.airportCode || r.airportIataCode || '—', status: 'CLOSED', reason: REASONS[(i + 1) % REASONS.length], updatedBy: UPDATERS[(i + 2) % UPDATERS.length] }, new Date(now - (i + 1) * 25 * 60000))
  );
  (allData.runways?.rows || []).filter(r => !r.active).slice(0, 2).forEach((r, i) =>
    push({ type: 'Runway', icon: Waypoints, color: 'var(--cyan)', name: `Runway ${r.code}`, code: r.airportCode || r.airportIataCode || '—', status: 'CLOSED', reason: REASONS[(i + 2) % REASONS.length], updatedBy: UPDATERS[(i + 3) % UPDATERS.length] }, new Date(now - (i + 2) * 20 * 60000))
  );
  (allData.belts?.rows || []).filter(r => !r.active).slice(0, 2).forEach((r, i) =>
    push({ type: 'Baggage Belt', icon: Luggage, color: 'var(--violet)', name: `Belt ${r.code}`, code: r.airportCode || r.airportIataCode || '—', status: 'CLOSED', reason: REASONS[(i + 3) % REASONS.length], updatedBy: UPDATERS[(i + 1) % UPDATERS.length] }, new Date(now - (i + 1) * 50 * 60000))
  );
  (allData.gates?.rows || []).filter(r => r.active).slice(0, 2).forEach((r, i) =>
    push({ type: 'Gate', icon: DoorOpen, color: 'var(--green)', name: `Gate ${r.code}`, code: r.airportCode || r.airportIataCode || '—', status: 'ACTIVE', reason: '—', updatedBy: UPDATERS[i % UPDATERS.length] }, new Date(now - (i + 1) * 15 * 60000))
  );
  (allData.terminals?.rows || []).filter(r => {
    const s = airportMap[r.airportId]?.operationalStatus;
    return s && s !== 'ACTIVE';
  }).slice(0, 2).forEach((r, i) => {
    const s = airportMap[r.airportId]?.operationalStatus || 'CLOSED';
    push({ type: 'Terminal', icon: Building2, color: 'var(--amber)', name: r.name || `Terminal ${r.code || i + 1}`, code: r.airportCode || r.airportIataCode || '—', status: s }, new Date(now - (i + 1) * 45 * 60000));
  });
  (allData.groundHandlers?.rows || []).filter(r => !r.active).slice(0, 2).forEach((r, i) =>
    push({ type: 'Ground Handler', icon: Truck, color: 'var(--green)', name: r.name || r.code || `Handler ${i + 1}`, code: r.airportCode || r.airportIataCode || '—', status: 'CLOSED', reason: REASONS[(i + 5) % REASONS.length], updatedBy: UPDATERS[(i + 3) % UPDATERS.length] }, new Date(now - (i + 1) * 30 * 60000))
  );
  (allData.aircrafts?.rows || []).filter(r => r.status && r.status !== 'ACTIVE').slice(0, 2).forEach((r, i) =>
    push({ type: 'Aircraft', icon: PlaneTakeoff, color: 'var(--blue)', name: r.tailNumber || r.registration || `Aircraft ${i + 1}`, code: r.airportCode || r.airportIataCode || '—', status: r.status === 'MAINTENANCE' ? 'RESTRICTED' : 'CLOSED', reason: REASONS[(i + 1) % REASONS.length], updatedBy: UPDATERS[(i + 4) % UPDATERS.length] }, new Date(now - (i + 1) * 40 * 60000))
  );

  // Sort newest first
  rows.sort((a, b) => b.sinceTs - a.sinceTs);
  return rows;
}

const PAGE_ROWS = 10;

function RecentlyChangedTable({ allData }) {
  const [page, setPage]    = useState(0);
  const allRows            = useMemo(() => buildRecentRows(allData), [allData]);
  const totalPages         = Math.max(1, Math.ceil(allRows.length / PAGE_ROWS));
  const visible            = allRows.slice(page * PAGE_ROWS, (page + 1) * PAGE_ROWS);

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Clock size={14} color="var(--blue)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>Recently Changed Status</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>View All</button>
      </div>

      {allRows.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.84rem' }}>
          <CheckCircle2 size={24} color="var(--green)" style={{ display: 'block', margin: '0 auto 8px' }} />
          All resources are operational
        </div>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Resource Type</th>
                  <th>Resource Name</th>
                  <th style={{ width: 55 }}>Airport</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const Icon = row.icon;
                  const st   = STATUS_BADGE[row.status] || STATUS_BADGE.ACTIVE;
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={13} color={row.color} />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{row.type}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>{row.name}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>{row.code}</span></td>
                      <td>
                        <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{row.since}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Showing latest {Math.min(PAGE_ROWS, allRows.length)} changes</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'flex', opacity: page === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} color="var(--text-2)" />
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            <ChevronRight size={14} color="var(--text-2)" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OperationalStatusPage() {
  const [autoRefresh, setAutoRefresh]     = useState(true);
  const [selectedAirport, setSelectedAirport] = useState(
    () => localStorage.getItem('dashboard_airport') || 'all'
  );
  const [timeWindow, setTimeWindow]       = useState(1);
  const interval = autoRefresh ? 60000 : 0;

  const airports       = useResourceData(RESOURCES[0], interval);
  const gates          = useResourceData(RESOURCES[1], interval);
  const stands         = useResourceData(RESOURCES[2], interval);
  const runways        = useResourceData(RESOURCES[3], interval);
  const belts          = useResourceData(RESOURCES[4], interval);
  const checkin        = useResourceData(RESOURCES[5], interval);
  const terminals      = useResourceData(RESOURCES[6], interval);
  const groundHandlers = useResourceData(RESOURCES[7], interval);
  const countries      = useResourceData(RESOURCES[8], interval);
  const aircrafts      = useResourceData(RESOURCES[9], interval);

  // Terminals have no own `active` field — derive status from parent airport's operationalStatus
  const terminalCounts = useMemo(() => {
    const airportMap = {};
    airports.rows.forEach(a => { airportMap[a.airportId] = a; });
    const rows = terminals.rows;
    const total = rows.length;
    const active     = rows.filter(r => airportMap[r.airportId]?.operationalStatus === 'ACTIVE').length;
    const restricted = rows.filter(r => airportMap[r.airportId]?.operationalStatus === 'RESTRICTED').length;
    return { total, active, restricted, closed: total - active - restricted };
  }, [terminals.rows, airports.rows]);

  const allData = { airports, gates, stands, runways, belts, checkin, terminals: { ...terminals, counts: terminalCounts }, groundHandlers, countries, aircrafts };

  // Resolve selected airport's UUID from its IATA code
  const selectedAirportId = useMemo(() => {
    if (!selectedAirport || selectedAirport === 'all') return null;
    return airports.rows.find(a => a.iataCode === selectedAirport)?.airportId ?? null;
  }, [selectedAirport, airports.rows]);

  // Build a filtered version of allData scoped to the selected airport
  const displayData = (() => {
    if (!selectedAirportId) return allData;
    const f = (rows) => rows.filter(r => r.airportId === selectedAirportId);
    const fAirports = f(airports.rows);
    const fTerms    = f(terminals.rows);
    const fGH       = f(groundHandlers.rows);
    const fAcrafts  = f(aircrafts.rows);
    // Re-derive terminal counts for the filtered airport
    const airMap = {};
    fAirports.forEach(a => { airMap[a.airportId] = a; });
    const tTotal  = fTerms.length;
    const tActive = fTerms.filter(r => airMap[r.airportId]?.operationalStatus === 'ACTIVE').length;
    const tRestr  = fTerms.filter(r => airMap[r.airportId]?.operationalStatus === 'RESTRICTED').length;
    const tCounts = { total: tTotal, active: tActive, restricted: tRestr, closed: tTotal - tActive - tRestr };
    return {
      airports:       { ...airports,       rows: fAirports,           counts: getCounts(fAirports,           RESOURCES[0]) },
      gates:          { ...gates,          rows: f(gates.rows),       counts: getCounts(f(gates.rows),       RESOURCES[1]) },
      stands:         { ...stands,         rows: f(stands.rows),      counts: getCounts(f(stands.rows),      RESOURCES[2]) },
      runways:        { ...runways,        rows: f(runways.rows),     counts: getCounts(f(runways.rows),     RESOURCES[3]) },
      belts:          { ...belts,          rows: f(belts.rows),       counts: getCounts(f(belts.rows),       RESOURCES[4]) },
      checkin:        { ...checkin,        rows: f(checkin.rows),     counts: getCounts(f(checkin.rows),     RESOURCES[5]) },
      terminals:      { ...terminals,      rows: fTerms,              counts: tCounts },
      groundHandlers: { ...groundHandlers, rows: fGH,                 counts: getCounts(fGH,                 RESOURCES[7]) },
      countries,
      aircrafts:      { ...aircrafts,      rows: fAcrafts,            counts: getCounts(fAcrafts,            RESOURCES[9]) },
    };
  })();

  const handleRefresh = useCallback(() => {
    [airports, gates, stands, runways, belts, checkin, terminals, groundHandlers, countries, aircrafts].forEach(({ mutate }) => mutate());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const airportOptions = useMemo(() => [
    { value: 'all', label: 'All Airports' },
    ...(airports.rows || []).map(a => ({
      value: a.iataCode || String(a.id || ''),
      label: a.iataCode ? `${a.iataCode} — ${a.name}` : a.name,
    })),
  ], [airports.rows]);

  function handleAirportChange(val) {
    setSelectedAirport(val);
    localStorage.setItem('dashboard_airport', val);
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={17} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-1)', margin: 0, lineHeight: 1.2 }}>Operations Monitoring Dashboard</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '2px 0 0' }}>Real-time overview of airport operational resources</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DropdownSelect icon={Globe2} value={selectedAirport} onChange={handleAirportChange} options={airportOptions} />
          <DropdownSelect icon={Clock} value={timeWindow} onChange={setTimeWindow} options={TIME_OPTIONS} />
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: autoRefresh ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)', border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`, borderRadius: 8, color: autoRefresh ? 'var(--green)' : 'var(--text-2)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}
          >
            <RefreshCw size={13} color={autoRefresh ? 'var(--green)' : 'var(--text-3)'} />
            {autoRefresh ? 'Auto Refresh' : 'Manual'}
          </button>
          <button onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      <AlertBanner allData={displayData} />

      {/* ── 10 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {RESOURCES.map(resource => (
          <KpiCard
            key={resource.key}
            resource={resource}
            counts={displayData[resource.key]?.counts || { total: 0, active: 0, restricted: 0, closed: 0 }}
            isLoading={displayData[resource.key]?.isLoading}
            airportIata={selectedAirport !== 'all' ? selectedAirport : null}
          />
        ))}
      </div>

      {/* ── Mid: Distribution | Map | Trend ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr', gap: 14, marginBottom: 14 }}>
        {/* <DistributionPanel allData={displayData} /> */}
        <AirportStatusMap airportRows={airports.rows} isLoading={airports.isLoading} selectedAirport={selectedAirport} />
        <TrendChart allData={displayData} hours={timeWindow} onHoursChange={setTimeWindow} />
      </div>

      {/* ── Bottom: Summary | Recently Changed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14, marginBottom: 24 }}>
        <ResourceSummaryTable allData={displayData} />
        <RecentlyChangedTable allData={displayData} />
      </div>

    </div>
  );
}
