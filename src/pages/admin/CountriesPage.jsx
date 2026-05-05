import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Globe2, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/ui/FormModal';
import { CountryAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const CONTINENT_CODES = ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'];
const OP_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const EMPTY = {
  iso2: '', iso3: '', name: '', nameOfficial: '', numericCode: '', phoneCode: '',
  currencyCode: '', currencyName: '', continentCode: '', subregion: '', capital: '',
  lat: '', lon: '', tzDefault: '', operationalStatus: 'ACTIVE', aviationGroup: '',
  isSchengen: false, isEu: false, icaoRegionCode: '', firCode: '', aviationAuthority: '',
  slotRegulation: false, meta: {}, governance: {},
};

export default function CountriesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: rawData, isLoading, error, mutate } = useSWR(`/api/v1/countries?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = Array.isArray(rawData) ? rawData : (rawData?.content || []);
  const totalPages = rawData?.totalPages ?? 1;

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'active') rows = rows.filter((c) => c.operationalStatus === 'ACTIVE');
    else if (statusFilter === 'closed') rows = rows.filter((c) => c.operationalStatus !== 'ACTIVE');
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.iso2 || '').toLowerCase().includes(q) ||
      (c.iso3 || '').toLowerCase().includes(q) ||
      (c.capital || '').toLowerCase().includes(q)
    );
  }, [data, search, statusFilter]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter((c) => c.operationalStatus === 'ACTIVE').length, color: 'var(--green)' },
    { label: 'Continents', value: new Set(data.map((c) => c.continentCode).filter(Boolean)).size, color: 'var(--blue)' },
  ];

  const columns = [
    { key: 'iso2', label: 'ISO2', width: '60px', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.iso2}</span> },
    { key: 'iso3', label: 'ISO3', width: '60px', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{r.iso3}</span> },
    { key: 'name', label: 'Country Name' },
    { key: 'capital', label: 'Capital', width: '140px', render: (r) => r.capital || '—' },
    { key: 'continentCode', label: 'Continent', width: '90px', render: (r) => (r.continentCode ? <span className="badge badge-slate">{r.continentCode}</span> : '—') },
    { key: 'operationalStatus', label: 'Status', width: '90px', render: (r) => <span className={`badge ${r.operationalStatus === 'ACTIVE' ? 'badge-green' : 'badge-slate'}`}>{r.operationalStatus === 'ACTIVE' ? 'Active' : r.operationalStatus || '—'}</span> },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      iso2: row.iso2 || '', iso3: row.iso3 || '', name: row.name || '', nameOfficial: row.nameOfficial || '',
      numericCode: row.numericCode || '', phoneCode: row.phoneCode || '',
      currencyCode: row.currencyCode || '', currencyName: row.currencyName || '',
      continentCode: row.continentCode || '', subregion: row.subregion || '', capital: row.capital || '',
      lat: row.lat || '', lon: row.lon || '', tzDefault: row.tzDefault || '',
      operationalStatus: row.operationalStatus || 'ACTIVE', aviationGroup: row.aviationGroup || '',
      isSchengen: row.isSchengen || false, isEu: row.isEu || false,
      icaoRegionCode: row.icaoRegionCode || '', firCode: row.firCode || '',
      aviationAuthority: row.aviationAuthority || '', slotRegulation: row.slotRegulation || false,
      meta: row.meta || {}, governance: row.governance || {},
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload = {
        iso2: form.iso2, iso3: form.iso3, name: form.name, nameOfficial: form.nameOfficial || null,
        numericCode: form.numericCode ? Number(form.numericCode) : null,
        phoneCode: form.phoneCode || null, currencyCode: form.currencyCode || null,
        currencyName: form.currencyName || null, continentCode: form.continentCode || null,
        subregion: form.subregion || null, capital: form.capital || null,
        lat: form.lat ? Number(form.lat) : null, lon: form.lon ? Number(form.lon) : null,
        tzDefault: form.tzDefault || null, operationalStatus: form.operationalStatus || 'ACTIVE',
        aviationGroup: form.aviationGroup || null, isSchengen: form.isSchengen,
        isEu: form.isEu, icaoRegionCode: form.icaoRegionCode || null,
        firCode: form.firCode || null, aviationAuthority: form.aviationAuthority || null,
        slotRegulation: form.slotRegulation, meta: form.meta, governance: form.governance,
      };
      if (editing) {
        await CountryAPI.update(editing.countryId, payload);
        toast.success('Country Updated', `${form.name} has been updated`);
      } else {
        await CountryAPI.create(payload);
        toast.success('Country Created', `${form.name} has been added`);
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
      const result = await CountryAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Countries code CSV uploaded successfully');
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
        title="Country Codes"
        subtitle="ISO 3166-1 country reference data — codes, geography, aviation authorities"
        icon={<Globe2 size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="countryId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Country"
        templateFile="countries.csv"
        hasToggle
        activeKey="operationalStatus"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
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
        title={editing ? 'Edit Country' : 'New Country'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={640}
      >
        <FormSection title="Identification">
          <FormRow cols={3}>
            <FormGroup label="ISO2 Code" required>
              <FormInput value={form.iso2} onChange={(v) => f('iso2', v)} placeholder="US" required />
            </FormGroup>
            <FormGroup label="ISO3 Code" required>
              <FormInput value={form.iso3} onChange={(v) => f('iso3', v)} placeholder="USA" required />
            </FormGroup>
            <FormGroup label="Numeric Code">
              <FormInput type="number" value={String(form.numericCode || '')} onChange={(v) => f('numericCode', v)} placeholder="840" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Country Name" required>
              <FormInput value={form.name} onChange={(v) => f('name', v)} placeholder="United States" required />
            </FormGroup>
            <FormGroup label="Official Name">
              <FormInput value={form.nameOfficial || ''} onChange={(v) => f('nameOfficial', v)} placeholder="United States of America" />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Geography">
          <FormRow>
            <FormGroup label="Capital">
              <FormInput value={form.capital || ''} onChange={(v) => f('capital', v)} placeholder="Washington, D.C." />
            </FormGroup>
            <FormGroup label="Continent">
              <FormSelect
                value={form.continentCode || ''}
                onChange={(v) => f('continentCode', v || '')}
                options={CONTINENT_CODES.map((c) => ({ value: c, label: c }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Subregion">
              <FormInput value={form.subregion || ''} onChange={(v) => f('subregion', v)} placeholder="Northern America" />
            </FormGroup>
            <FormGroup label="Default Timezone">
              <FormInput value={form.tzDefault || ''} onChange={(v) => f('tzDefault', v)} placeholder="America/New_York" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Latitude">
              <FormInput type="number" value={String(form.lat || '')} onChange={(v) => f('lat', v)} placeholder="39.8283" />
            </FormGroup>
            <FormGroup label="Longitude">
              <FormInput type="number" value={String(form.lon || '')} onChange={(v) => f('lon', v)} placeholder="-98.5795" />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Currency & Phone">
          <FormRow cols={3}>
            <FormGroup label="Phone Code">
              <FormInput value={form.phoneCode || ''} onChange={(v) => f('phoneCode', v)} placeholder="+1" />
            </FormGroup>
            <FormGroup label="Currency Code">
              <FormInput value={form.currencyCode || ''} onChange={(v) => f('currencyCode', v)} placeholder="USD" />
            </FormGroup>
            <FormGroup label="Currency Name">
              <FormInput value={form.currencyName || ''} onChange={(v) => f('currencyName', v)} placeholder="US Dollar" />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Aviation">
          <FormRow>
            <FormGroup label="Aviation Authority">
              <FormInput value={form.aviationAuthority || ''} onChange={(v) => f('aviationAuthority', v)} placeholder="FAA" />
            </FormGroup>
            <FormGroup label="Status">
              <FormSelect
                value={form.operationalStatus || ''}
                onChange={(v) => f('operationalStatus', v || 'ACTIVE')}
                options={OP_STATUSES.map((s) => ({ value: s, label: s }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Aviation Group">
              <FormInput value={form.aviationGroup || ''} onChange={(v) => f('aviationGroup', v)} placeholder="" />
            </FormGroup>
            <FormGroup label="ICAO Region Code">
              <FormInput value={form.icaoRegionCode || ''} onChange={(v) => f('icaoRegionCode', v)} placeholder="" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="FIR Code">
              <FormInput value={form.firCode || ''} onChange={(v) => f('firCode', v)} placeholder="" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormCheckbox label="Schengen" checked={form.isSchengen} onChange={(v) => f('isSchengen', v)} />
            <FormCheckbox label="EU Member" checked={form.isEu} onChange={(v) => f('isEu', v)} />
            <FormCheckbox label="Slot Regulation" checked={form.slotRegulation} onChange={(v) => f('slotRegulation', v)} />
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

