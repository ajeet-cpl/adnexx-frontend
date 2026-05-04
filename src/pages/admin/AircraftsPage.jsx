import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { PlaneTakeoff, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormSection } from '@/components/ui/FormModal';
import { AircraftAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const STATUSES        = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'GROUNDED'];
const NOISE_CHAPTERS  = ['CHAPTER_2', 'CHAPTER_3', 'CHAPTER_4', 'CHAPTER_14'];
const LOADING_METHODS = ['NOSE_IN', 'NOSE_OUT', 'PUSH_BACK', 'SIDE_LOAD'];
const OWNER_TYPES     = ['OWNED', 'LEASED', 'WET_LEASED', 'DRY_LEASED'];

const STATUS_BADGE_MAP = {
  ACTIVE:      'badge-active',
  INACTIVE:    'badge-inactive',
  MAINTENANCE: 'badge-scheduled',
  GROUNDED:    'badge-cancelled',
};

const EMPTY = {
  tenantId:          '',
  airlineId:         '',
  airportId:         '',
  aircraftTypeId:    '',
  tailNumber:        '',
  registration:      '',
  status:            'ACTIVE',
  manufactureYear:   new Date().getFullYear(),
  seatingFirst:      0,
  seatingBusiness:   0,
  seatingEconomy:    0,
  lastMaintenanceAt: '',
  nextMaintenanceDue:'',
  noiseChapter:      '',
  loadingMethod:     '',
  ownerType:         '',
  mtow:              '',
};

// Formats a datetime string to the value required by <input type="datetime-local">
function toDateTimeLocal(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  } catch { return ''; }
}

export default function AircraftsPage() {
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [page,      setPage]      = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(
    `/api/v1/aircrafts?page=${page}&size=${PAGE_SIZE}`, adminFetcher
  );
  const rows       = Array.isArray(pageData) ? pageData : pageData?.content || [];
  const totalPages = pageData?.totalPages ?? 1;

  // Reference data for dropdowns
  const { data: tenantPage }       = useSWR('/api/v1/tenants?page=0&size=1000',        adminFetcher);
  const { data: airlinePage }      = useSWR('/api/v1/airlines?page=0&size=1000',       adminFetcher);
  const { data: airportPage }      = useSWR('/api/v1/airports?page=0&size=1000',       adminFetcher);
  const { data: aircraftTypePage } = useSWR('/api/v1/aircraft-types?page=0&size=1000', adminFetcher);

  const tenants       = useMemo(() => (Array.isArray(tenantPage)       ? tenantPage       : tenantPage?.content       || []), [tenantPage]);
  const airlines      = useMemo(() => (Array.isArray(airlinePage)      ? airlinePage      : airlinePage?.content      || []), [airlinePage]);
  const airports      = useMemo(() => (Array.isArray(airportPage)      ? airportPage      : airportPage?.content      || []), [airportPage]);
  const aircraftTypes = useMemo(() => (Array.isArray(aircraftTypePage) ? aircraftTypePage : aircraftTypePage?.content || []), [aircraftTypePage]);

  // Lookup maps for display in table
  const airlineMap      = useMemo(() => Object.fromEntries(airlines.map(a      => [a.airlineId,      a.iataCode || a.name])),                 [airlines]);
  const airportMap      = useMemo(() => Object.fromEntries(airports.map(a      => [a.airportId,      a.iataCode || a.name])),                 [airports]);
  const aircraftTypeMap = useMemo(() => Object.fromEntries(aircraftTypes.map(t => [t.aircraftTypeId, t.icaoCode  || t.iataCode || t.name])),  [aircraftTypes]);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter === 'active') result = result.filter(r => r.status === 'ACTIVE');
    else if (statusFilter === 'closed') result = result.filter(r => r.status !== 'ACTIVE');
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(r =>
      (r.tailNumber    || '').toLowerCase().includes(q) ||
      (r.registration  || '').toLowerCase().includes(q) ||
      (r.status        || '').toLowerCase().includes(q)
    );
  }, [rows, search, statusFilter]);

  const stats = [
    { label: 'Total',       value: rows.length },
    { label: 'Active',      value: rows.filter(r => r.status === 'ACTIVE').length },
    { label: 'Maintenance', value: rows.filter(r => r.status === 'MAINTENANCE').length },
    { label: 'Grounded',    value: rows.filter(r => r.status === 'GROUNDED').length },
  ];

  const columns = [
    {
      key: 'tailNumber',
      label: 'Tail / Reg',
      render: (r) => (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{r.tailNumber || '—'}</span>
          {r.registration && r.registration !== r.tailNumber && (
            <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.registration}</span>
          )}
        </div>
      ),
    },
    {
      key: 'airlineId',
      label: 'Airline',
      width: '90px',
      render: (r) => airlineMap[r.airlineId] || r.airlineId?.slice(0, 8) || '—',
    },
    {
      key: 'airportId',
      label: 'Airport',
      width: '90px',
      render: (r) => airportMap[r.airportId] || r.airportId?.slice(0, 8) || '—',
    },
    {
      key: 'aircraftTypeId',
      label: 'Type',
      width: '80px',
      render: (r) => aircraftTypeMap[r.aircraftTypeId] || r.aircraftTypeId?.slice(0, 8) || '—',
    },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      render: (r) => r.status
        ? <span className={`badge ${STATUS_BADGE_MAP[r.status] || 'badge-active'}`}>{r.status}</span>
        : '—',
    },
    {
      key: 'ownerType',
      label: 'Owner Type',
      width: '110px',
      render: (r) => r.ownerType ? r.ownerType.replace('_', ' ') : '—',
    },
    {
      key: 'mtow',
      label: 'MTOW (kg)',
      width: '100px',
      render: (r) => r.mtow != null ? r.mtow.toLocaleString() : '—',
    },
    {
      key: 'manufactureYear',
      label: 'Year',
      width: '70px',
      render: (r) => r.manufactureYear || '—',
    },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      tenantId:          row.tenantId          || '',
      airlineId:         row.airlineId         || '',
      airportId:         row.airportId         || '',
      aircraftTypeId:    row.aircraftTypeId    || '',
      tailNumber:        row.tailNumber        || '',
      registration:      row.registration      || '',
      status:            row.status            || 'ACTIVE',
      manufactureYear:   row.manufactureYear   || new Date().getFullYear(),
      seatingFirst:      row.seatingConfig?.first    || 0,
      seatingBusiness:   row.seatingConfig?.business || 0,
      seatingEconomy:    row.seatingConfig?.economy  || 0,
      lastMaintenanceAt: toDateTimeLocal(row.lastMaintenanceAt),
      nextMaintenanceDue:toDateTimeLocal(row.nextMaintenanceDue),
      noiseChapter:      row.noiseChapter      || '',
      loadingMethod:     row.loadingMethod     || '',
      ownerType:         row.ownerType         || '',
      mtow:              row.mtow              ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const { seatingFirst, seatingBusiness, seatingEconomy, ...rest } = form;
    const payload = {
      ...rest,
      manufactureYear: Number(form.manufactureYear) || null,
      seatingConfig: {
        first:    Number(seatingFirst)    || 0,
        business: Number(seatingBusiness) || 0,
        economy:  Number(seatingEconomy)  || 0,
      },
      lastMaintenanceAt:  form.lastMaintenanceAt  || null,
      nextMaintenanceDue: form.nextMaintenanceDue || null,
      noiseChapter:       form.noiseChapter       || null,
      loadingMethod:      form.loadingMethod      || null,
      mtow:               form.mtow !== '' ? Number(form.mtow) : null,
    };
    // Null out empty UUID fields
    ['tenantId', 'airlineId', 'airportId', 'aircraftTypeId'].forEach((k) => {
      if (!payload[k]) payload[k] = null;
    });

    try {
      if (editing) {
        await AircraftAPI.update(editing.aircraftId, payload);
        toast.success('Aircraft Updated', `${form.tailNumber} has been updated`);
      } else {
        await AircraftAPI.create(payload);
        toast.success('Aircraft Created', `${form.tailNumber} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage
        readOnly={!hasRole('ADMIN')}
        title="Aircrafts"
        subtitle="Manage aircraft records — tail numbers, types, seating configurations"
        icon={<PlaneTakeoff size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="aircraftId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Aircraft"
        hasToggle
        activeKey="status"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        stats={stats}
        page={page + 1}
        totalPages={totalPages}
        onPageChange={p => setPage(p - 1)}
      />

      <FormModal
        title={editing ? 'Edit Aircraft' : 'New Aircraft'}
        subtitle={editing ? `Editing ${editing.tailNumber}` : 'Register a new aircraft'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={660}
      >
        <FormSection title="Identity">
          <FormRow cols={2}>
            <FormGroup label="Tail Number" required>
              <FormInput value={form.tailNumber} onChange={v => f('tailNumber', v)} placeholder="VT-ANQ" required />
            </FormGroup>
            <FormGroup label="Registration">
              <FormInput value={form.registration} onChange={v => f('registration', v)} placeholder="VT-ANQ" />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Status" required>
              <FormSelect
                value={form.status}
                onChange={v => f('status', v)}
                options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }))}
                placeholder="Select status…"
              />
            </FormGroup>
            <FormGroup label="Manufacture Year">
              <FormInput
                type="number"
                value={form.manufactureYear}
                onChange={v => f('manufactureYear', Number(v))}
                placeholder={String(new Date().getFullYear())}
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="References">
          <FormRow cols={2}>
            <FormGroup label="Tenant">
              <FormSelect
                value={form.tenantId}
                onChange={v => f('tenantId', v)}
                options={tenants.map(t => ({ value: t.tenantId, label: `[${t.code}] ${t.name}` }))}
                placeholder="Select tenant…"
              />
            </FormGroup>
            <FormGroup label="Airline">
              <FormSelect
                value={form.airlineId}
                onChange={v => f('airlineId', v)}
                options={airlines.map(a => ({ value: a.airlineId, label: `${a.iataCode ? `[${a.iataCode}] ` : ''}${a.name}` }))}
                placeholder="Select airline…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Base Airport">
              <FormSelect
                value={form.airportId}
                onChange={v => f('airportId', v)}
                options={airports.map(a => ({ value: a.airportId, label: `${a.iataCode ? `[${a.iataCode}] ` : ''}${a.name}` }))}
                placeholder="Select airport…"
              />
            </FormGroup>
            <FormGroup label="Aircraft Type">
              <FormSelect
                value={form.aircraftTypeId}
                onChange={v => f('aircraftTypeId', v)}
                options={aircraftTypes.map(t => ({ value: t.aircraftTypeId, label: `${t.icaoCode || t.iataCode ? `[${t.icaoCode || t.iataCode}] ` : ''}${t.name}` }))}
                placeholder="Select type…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Seating Configuration">
          <FormRow cols={3}>
            <FormGroup label="First Class">
              <FormInput
                type="number"
                value={form.seatingFirst}
                onChange={v => f('seatingFirst', Number(v))}
                placeholder="0"
              />
            </FormGroup>
            <FormGroup label="Business">
              <FormInput
                type="number"
                value={form.seatingBusiness}
                onChange={v => f('seatingBusiness', Number(v))}
                placeholder="0"
              />
            </FormGroup>
            <FormGroup label="Economy">
              <FormInput
                type="number"
                value={form.seatingEconomy}
                onChange={v => f('seatingEconomy', Number(v))}
                placeholder="0"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Technical Details">
          <FormRow cols={3}>
            <FormGroup label="Noise Chapter">
              <FormSelect
                value={form.noiseChapter}
                onChange={v => f('noiseChapter', v)}
                options={NOISE_CHAPTERS.map(c => ({ value: c, label: c.replace('_', ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Loading Method">
              <FormSelect
                value={form.loadingMethod}
                onChange={v => f('loadingMethod', v)}
                options={LOADING_METHODS.map(m => ({ value: m, label: m.replace('_', ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Owner Type">
              <FormSelect
                value={form.ownerType}
                onChange={v => f('ownerType', v)}
                options={OWNER_TYPES.map(o => ({ value: o, label: o.replace('_', ' ') }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="MTOW (kg)" hint="Max Take-Off Weight">
              <FormInput
                type="number"
                value={form.mtow}
                onChange={v => f('mtow', v)}
                placeholder="e.g. 77000"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Maintenance">
          <FormRow cols={2}>
            <FormGroup label="Last Maintenance At">
              <FormInput
                type="datetime-local"
                value={form.lastMaintenanceAt}
                onChange={v => f('lastMaintenanceAt', v)}
              />
            </FormGroup>
            <FormGroup label="Next Maintenance Due">
              <FormInput
                type="datetime-local"
                value={form.nextMaintenanceDue}
                onChange={v => f('nextMaintenanceDue', v)}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}
