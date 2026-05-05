import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Plane, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/ui/FormModal';
import { AirlineAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const AIRLINE_TYPES = ['FULL_SERVICE', 'LCC', 'CHARTER', 'CARGO', 'REGIONAL', 'PRIVATE'];
const AIRLINE_CATEGORIES = ['FSC', 'LCC', 'CHARTER', 'CARGO', 'REGIONAL', 'PRIVATE',];
const ALLIANCES = ['Star Alliance', 'Oneworld', 'SkyTeam'];

const EMPTY = {
  iataCode: '',
  icaoCode: '',
  name: '',
  callsign: '',
  country: '',
  airlineType: '',
  airlineCategory: '',
  alliance: '',
  terminalPref: '',
  slotPriority: 1,
  clearingHouseMember: false,
  tenantId: '',
  countryId: '',
  stateId: '',
  cityId: '',
  homeHubAirport: '',
  metadata: {},
  attributes: {},
};

export default function AirlinesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/airlines?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const rows = Array.isArray(pageData) ? pageData : pageData?.content || [];
  const totalPages = pageData?.totalPages ?? 1;

  const { data: tenantPage } = useSWR('/api/v1/tenants?page=0&size=1000', adminFetcher);
  const tenants = useMemo(() => (Array.isArray(tenantPage) ? tenantPage : tenantPage?.content || []), [tenantPage]);

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const { data: countryPage } = useSWR('/api/v1/countries?page=0&size=1000', adminFetcher);
  const countries = useMemo(() => (Array.isArray(countryPage) ? countryPage : countryPage?.content || []), [countryPage]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        (a.iataCode || '').toLowerCase().includes(q) ||
        (a.icaoCode || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = [
    { label: 'Total', value: rows.length },
    { label: 'Types', value: new Set(rows.map((a) => a.airlineType).filter(Boolean)).size },
    { label: 'Alliances', value: new Set(rows.map((a) => a.alliance).filter(Boolean)).size },
    { label: 'Categories', value: new Set(rows.map((a) => a.airlineCategory).filter(Boolean)).size },
  ];

  const columns = [
    {
      key: 'iataCode',
      label: 'IATA/ICAO',
      width: '100px',
      render: (r) => (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{(r.iataCode || '—').trim()}</span>
          {r.icaoCode && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icaoCode.trim()}</span>}
        </div>
      ),
    },
    { key: 'name', label: 'Airline Name' },
    {
      key: 'airlineType',
      label: 'Type',
      width: '120px',
      render: (r) =>
        r.airlineType ? <span className="badge badge-scheduled">{r.airlineType.replace('_', ' ')}</span> : '—',
    },
    {
      key: 'airlineCategory',
      label: 'Category',
      width: '100px',
      render: (r) =>
        r.airlineCategory ? <span className="badge badge-arrived">{r.airlineCategory}</span> : '—',
    },
    { key: 'alliance', label: 'Alliance', width: '120px', render: (r) => r.alliance || '—' },
    { key: 'country', label: 'Country', width: '120px', render: (r) => r.country || '—' },
    {
      key: 'clearingHouseMember',
      label: 'Clearing',
      width: '80px',
      render: (r) =>
        <span className={`badge ${r.clearingHouseMember ? 'badge-active' : 'badge-inactive'}`}>
          {r.clearingHouseMember ? 'Yes' : 'No'}
        </span>,
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
      iataCode: row.iataCode || '',
      icaoCode: row.icaoCode || '',
      name: row.name || '',
      callsign: row.callsign || '',
      country: row.country || '',
      airlineType: row.airlineType || '',
      airlineCategory: row.airlineCategory || '',
      alliance: row.alliance || '',
      terminalPref: row.terminalPref || '',
      slotPriority: row.slotPriority || 1,
      clearingHouseMember: row.clearingHouseMember || false,
      tenantId: row.tenantId || '',
      countryId: row.countryId || '',
      stateId: row.stateId || '',
      cityId: row.cityId || '',
      homeHubAirport: row.homeHubAirport || '',
      metadata: row.metadata || {},
      attributes: row.attributes || {},
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    // Convert empty optional UUID fields to null
    const payload = { ...form };
    ['alliance', 'countryId', 'stateId', 'cityId', 'homeHubAirport'].forEach((k) => {
      if (!payload[k]) payload[k] = null;
    });
    try {
      if (editing) {
        await AirlineAPI.update(editing.airlineId, payload);
        toast.success('Airline Updated', `${form.name} has been updated`);
      } else {
        await AirlineAPI.create(payload);
        toast.success('Airline Created', `${form.name} has been added`);
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
      const result = await AirlineAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Airlines CSV uploaded successfully');
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
        title="Airlines"
        subtitle="Manage airline reference data — IATA/ICAO codes, types, alliances"
        icon={<Plane size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="airlineId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Airline"
        templateFile="airlines.csv"
        renderExtraActions={() => null}
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
        title={editing ? 'Edit Airline' : 'New Airline'}
        subtitle={editing ? `Editing ${editing.name}` : 'Create a new airline record'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={640}
      >
        <FormSection title="Identity">
          <FormRow cols={2}>
            <FormGroup label="IATA Code" hint="2-letter code e.g. AI">
              <FormInput value={form.iataCode || ''} onChange={(v) => f('iataCode', v)} placeholder="AI" />
            </FormGroup>
            <FormGroup label="ICAO Code" hint="3-letter code e.g. AIC">
              <FormInput value={form.icaoCode || ''} onChange={(v) => f('icaoCode', v)} placeholder="AIC" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Airline Name" required>
              <FormInput value={form.name} onChange={(v) => f('name', v)} placeholder="Air India" required />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Callsign">
              <FormInput value={form.callsign || ''} onChange={(v) => f('callsign', v)} placeholder="AIRINDIA" />
            </FormGroup>
            <FormGroup label="Country">
              <FormSelect
                value={form.country || ''}
                onChange={(v) => f('country', v)}
                options={countries.map((c) => ({ value: c.name, label: `[${c.iso2}] ${c.name}` }))}
                placeholder="Select country…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Classification">
          <FormRow cols={2}>
            <FormGroup label="Airline Type">
              <FormSelect
                value={form.airlineType || ''}
                onChange={(v) => f('airlineType', v)}
                options={AIRLINE_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))}
                placeholder="Select type…"
              />
            </FormGroup>
            <FormGroup label="Airline Category">
              <FormSelect
                value={form.airlineCategory || ''}
                onChange={(v) => f('airlineCategory', v)}
                options={AIRLINE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="Select category…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Alliance">
              <FormSelect
                value={form.alliance || ''}
                onChange={(v) => f('alliance', v)}
                options={ALLIANCES.map((a) => ({ value: a, label: a }))}
                placeholder="None"
              />
            </FormGroup>
            <FormGroup label="Terminal Preference">
              <FormInput value={form.terminalPref || ''} onChange={(v) => f('terminalPref', v)} placeholder="T1" />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Slot Priority">
              <FormInput
                type="number"
                value={form.slotPriority}
                onChange={(v) => f('slotPriority', Number(v))}
                placeholder="1"
              />
            </FormGroup>
            <FormGroup label="Options">
              <div style={{ paddingTop: 6 }}>
                <FormCheckbox
                  label="Clearing House Member"
                  checked={form.clearingHouseMember}
                  onChange={(v) => f('clearingHouseMember', v)}
                />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="References">
          <FormRow cols={2}>
            <FormGroup label="Tenant">
              <FormSelect
                value={form.tenantId || ''}
                onChange={(v) => f('tenantId', v)}
                options={tenants.map((t) => ({ value: t.tenantId, label: `[${t.code}] ${t.name}` }))}
                placeholder="Select tenant…"
              />
            </FormGroup>
            <FormGroup label="Home Hub Airport">
              <FormSelect
                value={form.homeHubAirport || ''}
                onChange={(v) => f('homeHubAirport', v)}
                options={airports.map((a) => ({
                  value: a.airportId,
                  label: `${a.iataCode ? `[${a.iataCode.trim()}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airport…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="Country">
              <FormSelect
                value={form.countryId || ''}
                onChange={(v) => f('countryId', v)}
                options={countries.map((c) => ({ value: c.countryId, label: `[${c.iso2}] ${c.name}` }))}
                placeholder="Select country…"
              />
            </FormGroup>
            <FormGroup label="State ID" hint="UUID">
              <FormInput value={form.stateId || ''} onChange={(v) => f('stateId', v)} placeholder="UUID" />
            </FormGroup>
            <FormGroup label="City ID" hint="UUID">
              <FormInput value={form.cityId || ''} onChange={(v) => f('cityId', v)} placeholder="UUID" />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

