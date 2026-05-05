import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Globe2, Upload, Activity } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
  FormTextArea,
} from '@/components/ui/FormModal';
import { AirportAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const AIRPORT_TYPES = ['LARGE_HUB', 'MEDIUM_HUB', 'SMALL_HUB', 'NON_HUB', 'REGIONAL', 'MILITARY', 'PRIVATE', 'GENERAL_AVIATION'];
const OPERATIONAL_STATUSES = ['ACTIVE', 'RESTRICTED', 'CLOSED'];
const AIRPORT_CATEGORIES = ['INTERNATIONAL', 'DOMESTIC', 'REGIONAL'];
const COORDINATION_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'];
const NOISE_RESTRICTION_LEVELS = ['NONE', 'LOW', 'MODERATE', 'HIGH', 'SEVERE'];
const DST_RULES = ['N', 'E', 'A', 'O', 'S', 'Z'];

const EMPTY = {
  name: '',
  country: '',
  tz: '',
  iataCode: '',
  icaoCode: '',
  type: '',
  cityName: '',
  latitude: '',
  longitude: '',
  elevationFt: '',
  timezone: '',
  tzOffset: '',
  dstRule: '',
  runwayCount: '',
  hubScore: '',
  terminalCount: '',
  operationalStatus: 'ACTIVE',
  airportCategory: '',
  coordinationLevel: '',
  maxMovementsPerHour: '',
  isSlotCoordinated: false,
  icaoLocationIndicator: '',
  acdmEnabled: false,
  aoccEnabled: false,
  noiseRestrictionLevel: '',
  curfewStart: '',
  curfewEnd: '',
  metadata: '{}',
  attributes: '{}',
  governance: '{}',
};

function jsonStr(obj) {
  if (!obj || typeof obj === 'string') return obj || '{}';
  try { return JSON.stringify(obj, null, 2); } catch { return '{}'; }
}

export default function AirportsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/airports?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = pageData?.content || [];
  const totalPages = pageData?.totalPages ?? 1;

  const { data: countryPage } = useSWR('/api/v1/countries?page=0&size=1000', adminFetcher);
  const countries = useMemo(() => (Array.isArray(countryPage) ? countryPage : countryPage?.content || []), [countryPage]);

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter !== 'all') rows = rows.filter((a) => a.operationalStatus === statusFilter);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.iataCode || '').toLowerCase().includes(q) ||
        (a.icaoCode || '').toLowerCase().includes(q) ||
        (a.cityName || '').toLowerCase().includes(q)
    );
  }, [data, search, statusFilter]);

  const activeCount = data.filter((a) => a.operationalStatus === 'ACTIVE').length;
  const restrictedCount = data.filter((a) => a.operationalStatus === 'RESTRICTED').length;
  const closedCount = data.filter((a) => a.operationalStatus === 'CLOSED').length;

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: activeCount, color: 'var(--green)' },
    { label: 'Restricted', value: restrictedCount, color: 'var(--amber)' },
    { label: 'Closed', value: closedCount, color: 'var(--red)' },
    { label: 'International', value: data.filter((a) => a.airportCategory === 'INTERNATIONAL').length, color: 'var(--blue)' },
    { label: 'Slot Coordinated', value: data.filter((a) => a.isSlotCoordinated).length, color: 'var(--cyan)' },
  ];

  const columns = [
    {
      key: 'iataCode',
      label: 'Codes',
      width: '110px',
      render: (r) => (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{(r.iataCode || '—').trim()}</span>
          {r.icaoCode && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icaoCode.trim()}</span>}
        </div>
      ),
    },
    { key: 'name', label: 'Airport Name' },
    { key: 'cityName', label: 'City', width: '120px', render: (r) => r.cityName || '—' },
    { key: 'type', label: 'Type', width: '120px', render: (r) => (r.type ? <span className="badge badge-blue">{r.type}</span> : '—') },
    { key: 'airportCategory', label: 'Category', width: '130px', render: (r) => (r.airportCategory ? <span className="badge badge-cyan">{r.airportCategory}</span> : '—') },
    { key: 'operationalStatus', label: 'Status', width: '110px', render: (r) => {
      const s = r.operationalStatus;
      const cls = s === 'ACTIVE' ? 'badge-green' : s === 'RESTRICTED' ? 'badge-amber' : 'badge-slate';
      return <span className={`badge ${cls}`}>{s || '—'}</span>;
    } },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name || '',
      country: row.country || '',
      tz: row.tz || '',
      iataCode: row.iataCode || '',
      icaoCode: row.icaoCode || '',
      type: row.type || '',
      cityName: row.cityName || '',
      latitude: row.latitude ?? '',
      longitude: row.longitude ?? '',
      elevationFt: row.elevationFt ?? '',
      timezone: row.timezone || '',
      tzOffset: row.tzOffset || '',
      dstRule: row.dstRule || '',
      runwayCount: row.runwayCount ?? '',
      hubScore: row.hubScore ?? '',
      terminalCount: row.terminalCount ?? '',
      operationalStatus: row.operationalStatus || 'ACTIVE',
      airportCategory: row.airportCategory || '',
      coordinationLevel: row.coordinationLevel || '',
      maxMovementsPerHour: row.maxMovementsPerHour ?? '',
      isSlotCoordinated: row.isSlotCoordinated ?? false,
      icaoLocationIndicator: row.icaoLocationIndicator || '',
      acdmEnabled: row.acdmEnabled ?? false,
      aoccEnabled: row.aoccEnabled ?? false,
      noiseRestrictionLevel: row.noiseRestrictionLevel || '',
      curfewStart: row.curfewStart || '',
      curfewEnd: row.curfewEnd || '',
      metadata: jsonStr(row.metadata),
      attributes: jsonStr(row.attributes),
      governance: jsonStr(row.governance),
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload = {
        name: form.name,
        country: form.country,
        tz: form.tz,
        iataCode: form.iataCode,
        icaoCode: form.icaoCode,
        type: form.type || undefined,
        cityName: form.cityName,
        latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
        longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
        elevationFt: form.elevationFt !== '' ? Number(form.elevationFt) : undefined,
        timezone: form.timezone,
        tzOffset: form.tzOffset,
        dstRule: form.dstRule || undefined,
        runwayCount: form.runwayCount !== '' ? Number(form.runwayCount) : undefined,
        hubScore: form.hubScore !== '' ? Number(form.hubScore) : undefined,
        terminalCount: form.terminalCount !== '' ? Number(form.terminalCount) : undefined,
        operationalStatus: form.operationalStatus || undefined,
        airportCategory: form.airportCategory || undefined,
        coordinationLevel: form.coordinationLevel || undefined,
        maxMovementsPerHour: form.maxMovementsPerHour !== '' ? Number(form.maxMovementsPerHour) : undefined,
        isSlotCoordinated: form.isSlotCoordinated,
        icaoLocationIndicator: form.icaoLocationIndicator,
        acdmEnabled: form.acdmEnabled,
        aoccEnabled: form.aoccEnabled,
        noiseRestrictionLevel: form.noiseRestrictionLevel || undefined,
        curfewStart: form.curfewStart || undefined,
        curfewEnd: form.curfewEnd || undefined,
        metadata: form.metadata ? JSON.parse(form.metadata) : {},
        attributes: form.attributes ? JSON.parse(form.attributes) : {},
        governance: form.governance ? JSON.parse(form.governance) : {},
      };

      if (editing) {
        await AirportAPI.update(editing.airportId, payload);
        toast.success('Airport Updated', `${form.name} has been updated`);
      } else {
        await AirportAPI.create(payload);
        toast.success('Airport Created', `${form.name} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await AirportAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Airports CSV uploaded successfully');
      mutate();
    } catch (err) {
      toast.error('Bulk Upload Failed', err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage
        readOnly={!hasRole('ADMIN')}
        title="Airports"
        subtitle="Reference airports — IATA/ICAO codes, timezones, coordinates"
        icon={<Globe2 size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="airportId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Airport"
        templateFile="airports.csv"
        extraToolbar={
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface-2)', borderRadius: 7, padding: '2px 3px', border: '1px solid var(--border)' }}>
            {[
              { value: 'all', label: 'All', color: 'var(--text-1)' },
              { value: 'ACTIVE', label: 'Active', color: 'var(--green)' },
              { value: 'RESTRICTED', label: 'Restricted', color: 'var(--amber)' },
              { value: 'CLOSED', label: 'Closed', color: 'var(--red)' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === opt.value ? 'var(--surface-1)' : 'transparent',
                  color: statusFilter === opt.value ? opt.color : 'var(--text-3)',
                  boxShadow: statusFilter === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.12s',
                }}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span style={{ marginLeft: 4, fontSize: '0.68rem', opacity: 0.75 }}>
                    ({opt.value === 'ACTIVE' ? activeCount : opt.value === 'RESTRICTED' ? restrictedCount : closedCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        }
        extraHeaderButtons={
          hasRole('ADMIN') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleBulkUpload}
              />
              <button
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Bulk Upload CSV"
              >
                <Upload size={13} className={uploading ? 'spin' : ''} />
                <span style={{ fontSize: '0.82rem' }}>{uploading ? 'Uploading…' : 'Bulk Upload'}</span>
              </button>
            </>
          )
        }
        stats={stats}
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />
      <FormModal
        title={editing ? 'Edit Airport' : 'New Airport'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={720}
      >
        <FormSection title="Identity">
          <FormRow cols={1}>
            <FormGroup label="Airport Name" required>
              <FormInput value={form.name} onChange={(v) => f('name', v)} placeholder="Chhatrapati Shivaji Maharaj International Airport" required />
            </FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="IATA Code" hint="3-letter">
              <FormInput value={form.iataCode} onChange={(v) => f('iataCode', v)} placeholder="BOM" />
            </FormGroup>
            <FormGroup label="ICAO Code" hint="4-letter">
              <FormInput value={form.icaoCode} onChange={(v) => f('icaoCode', v)} placeholder="VABB" />
            </FormGroup>
            <FormGroup label="ICAO Location Indicator">
              <FormInput value={form.icaoLocationIndicator} onChange={(v) => f('icaoLocationIndicator', v)} placeholder="VABB" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Type">
              <FormSelect
                value={form.type}
                onChange={(v) => f('type', v)}
                options={AIRPORT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Category">
              <FormSelect
                value={form.airportCategory}
                onChange={(v) => f('airportCategory', v)}
                options={AIRPORT_CATEGORIES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Operational Status">
              <FormSelect
                value={form.operationalStatus}
                onChange={(v) => f('operationalStatus', v)}
                options={OPERATIONAL_STATUSES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Hub Score">
              <FormInput type="number" value={String(form.hubScore)} onChange={(v) => f('hubScore', v)} placeholder="98.5" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Location">
          <FormRow>
            <FormGroup label="Country">
              <FormSelect
                value={form.country}
                onChange={(v) => f('country', v)}
                options={countries.map((c) => ({ value: c.name, label: c.iso2 ? `[${c.iso2}] ${c.name}` : c.name }))}
                placeholder="Select country…"
              />
            </FormGroup>
            <FormGroup label="City">
              <FormInput value={form.cityName} onChange={(v) => f('cityName', v)} placeholder="Mumbai" />
            </FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="Latitude">
              <FormInput type="number" value={String(form.latitude)} onChange={(v) => f('latitude', v)} placeholder="19.0887" />
            </FormGroup>
            <FormGroup label="Longitude">
              <FormInput type="number" value={String(form.longitude)} onChange={(v) => f('longitude', v)} placeholder="72.867919" />
            </FormGroup>
            <FormGroup label="Elevation (ft)">
              <FormInput type="number" value={String(form.elevationFt)} onChange={(v) => f('elevationFt', v)} placeholder="37" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Timezone">
          <FormRow cols={3}>
            <FormGroup label="TZ (IANA)">
              <FormInput value={form.tz} onChange={(v) => f('tz', v)} placeholder="Asia/Kolkata" />
            </FormGroup>
            <FormGroup label="Timezone">
              <FormInput value={form.timezone} onChange={(v) => f('timezone', v)} placeholder="Asia/Kolkata" />
            </FormGroup>
            <FormGroup label="TZ Offset">
              <FormInput value={form.tzOffset} onChange={(v) => f('tzOffset', v)} placeholder="+05:30" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="DST Rule">
              <FormSelect
                value={form.dstRule}
                onChange={(v) => f('dstRule', v)}
                options={DST_RULES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Capacity">
          <FormRow>
            <FormGroup label="Runway Count">
              <FormInput type="number" value={String(form.runwayCount)} onChange={(v) => f('runwayCount', v)} placeholder="2" />
            </FormGroup>
            <FormGroup label="Terminal Count">
              <FormInput type="number" value={String(form.terminalCount)} onChange={(v) => f('terminalCount', v)} placeholder="2" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Max Movements / Hour">
              <FormInput type="number" value={String(form.maxMovementsPerHour)} onChange={(v) => f('maxMovementsPerHour', v)} placeholder="48" />
            </FormGroup>
            <FormGroup label="Coordination Level">
              <FormSelect
                value={form.coordinationLevel}
                onChange={(v) => f('coordinationLevel', v)}
                options={COORDINATION_LEVELS.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Operations">
          <FormRow>
            <FormGroup label="Noise Restriction Level">
              <FormSelect
                value={form.noiseRestrictionLevel}
                onChange={(v) => f('noiseRestrictionLevel', v)}
                options={NOISE_RESTRICTION_LEVELS.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Curfew Start">
              <FormInput type="time" value={form.curfewStart} onChange={(v) => f('curfewStart', v)} placeholder="23:00" />
            </FormGroup>
            <FormGroup label="Curfew End">
              <FormInput type="time" value={form.curfewEnd} onChange={(v) => f('curfewEnd', v)} placeholder="06:00" />
            </FormGroup>
          </FormRow>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 6 }}>
            <FormCheckbox label="Slot Coordinated" checked={form.isSlotCoordinated} onChange={(v) => f('isSlotCoordinated', v)} />
            <FormCheckbox label="A-CDM Enabled" checked={form.acdmEnabled} onChange={(v) => f('acdmEnabled', v)} />
            <FormCheckbox label="AOCC Enabled" checked={form.aoccEnabled} onChange={(v) => f('aoccEnabled', v)} />
          </div>
        </FormSection>

        <FormSection title="Extended Data">
          <FormRow cols={1}>
            <FormGroup label="Metadata" hint="JSON object">
              <FormTextArea value={form.metadata} onChange={(v) => f('metadata', v)} placeholder='{"region": "Western India"}' rows={3} />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Attributes" hint="JSON object">
              <FormTextArea value={form.attributes} onChange={(v) => f('attributes', v)} placeholder='{"passengerCapacity": 48000000}' rows={3} />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Governance" hint="JSON object">
              <FormTextArea value={form.governance} onChange={(v) => f('governance', v)} placeholder='{"authority": "AAI"}' rows={3} />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

