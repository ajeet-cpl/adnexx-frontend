import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Cpu, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormSection } from '@/components/ui/FormModal';
import { AircraftTypeAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const BODY_CLASSES = ['NARROW', 'WIDE', 'REGIONAL', 'TURBOPROP', 'HELICOPTER', 'CARGO'];
const WAKE_CATS = ['L', 'M', 'H', 'J'];
const TURBULENCE_CATS = ['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER'];
const ENGINE_TYPES = ['TURBOFAN', 'TURBOPROP', 'TURBOJET', 'PISTON', 'ELECTRIC'];
const STAND_COMPAT = ['A', 'B', 'C', 'D', 'E', 'F'];

const EMPTY = {
  icaoCode: '', iataCode: '', description: '', bodyClass: '', wakeCategory: '',
  wingspanM: '', lengthM: '', mtowKg: '', mlwKg: '', engineCount: '', engineType: '',
  turbulenceCategory: '', standCompatibilityClass: '', validFrom: null, validTo: null,
  attributes: {},
};

export default function AircraftTypesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: rawData, isLoading, error, mutate } = useSWR(`/api/v1/aircraft-types?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = Array.isArray(rawData) ? rawData : (rawData?.content || []);
  const totalPages = rawData?.totalPages ?? 1;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((a) =>
      (a.description || '').toLowerCase().includes(q) ||
      (a.iataCode || '').toLowerCase().includes(q) ||
      (a.icaoCode || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const stats = [
    { label: 'Total Types', value: data.length },
    { label: 'Narrow Body', value: data.filter((a) => a.bodyClass === 'NARROW').length, color: 'var(--blue)' },
    { label: 'Wide Body', value: data.filter((a) => a.bodyClass === 'WIDE').length, color: 'var(--violet)' },
  ];

  const columns = [
    {
      key: 'iataCode',
      label: 'IATA/ICAO',
      width: '110px',
      render: (r) => (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 600 }}>{r.iataCode}</span>
          {r.icaoCode && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{r.icaoCode}</span>}
        </div>
      ),
    },
    { key: 'description', label: 'Description' },
    { key: 'bodyClass', label: 'Body', width: '100px', render: (r) => (r.bodyClass ? <span className="badge badge-violet">{r.bodyClass}</span> : '—') },
    { key: 'wakeCategory', label: 'Wake', width: '70px', render: (r) => (r.wakeCategory ? <span className="badge badge-amber">{r.wakeCategory}</span> : '—') },
    { key: 'engineType', label: 'Engine', width: '100px', render: (r) => r.engineType || '—' },
    { key: 'wingspanM', label: 'Wingspan', width: '90px', render: (r) => (r.wingspanM ? `${r.wingspanM}m` : '—') },
    { key: 'mtowKg', label: 'MTOW', width: '90px', render: (r) => (r.mtowKg ? `${r.mtowKg.toLocaleString()} kg` : '—') },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      icaoCode: row.icaoCode || '',
      iataCode: row.iataCode || '',
      description: row.description || '',
      bodyClass: row.bodyClass || '',
      wakeCategory: row.wakeCategory || '',
      wingspanM: row.wingspanM || '',
      lengthM: row.lengthM || '',
      mtowKg: row.mtowKg || '',
      mlwKg: row.mlwKg || '',
      engineCount: row.engineCount || '',
      engineType: row.engineType || '',
      turbulenceCategory: row.turbulenceCategory || '',
      standCompatibilityClass: row.standCompatibilityClass || '',
      validFrom: row.validFrom || null,
      validTo: row.validTo || null,
      attributes: row.attributes || {},
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload = {
        icaoCode: form.icaoCode,
        iataCode: form.iataCode,
        description: form.description,
        bodyClass: form.bodyClass || null,
        wakeCategory: form.wakeCategory || null,
        wingspanM: form.wingspanM ? Number(form.wingspanM) : null,
        lengthM: form.lengthM ? Number(form.lengthM) : null,
        mtowKg: form.mtowKg ? Number(form.mtowKg) : null,
        mlwKg: form.mlwKg ? Number(form.mlwKg) : null,
        engineCount: form.engineCount ? Number(form.engineCount) : null,
        engineType: form.engineType || null,
        turbulenceCategory: form.turbulenceCategory || null,
        standCompatibilityClass: form.standCompatibilityClass || null,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        attributes: form.attributes,
      };
      if (editing) {
        await AircraftTypeAPI.update(editing.aircraftTypeId, payload);
        toast.success('Aircraft Type Updated', `${form.iataCode} has been updated`);
      } else {
        await AircraftTypeAPI.create(payload);
        toast.success('Aircraft Type Created', `${form.iataCode} has been added`);
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
      const result = await AircraftTypeAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Aircraft types CSV uploaded successfully');
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
        title="Aircraft Types"
        subtitle="IATA/ICAO aircraft type reference data — dimensions, weight, wake turbulence"
        icon={<Cpu size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="aircraftTypeId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Aircraft Type"
        templateFile="aircraft-types.csv"
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
        title={editing ? 'Edit Aircraft Type' : 'New Aircraft Type'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={640}
      >
        <FormSection title="Identification">
          <FormRow>
            <FormGroup label="ICAO Code" required>
              <FormInput value={form.icaoCode} onChange={(v) => f('icaoCode', v)} placeholder="A320" required />
            </FormGroup>
            <FormGroup label="IATA Code" required>
              <FormInput value={form.iataCode} onChange={(v) => f('iataCode', v)} placeholder="320" required />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Description" required>
              <FormInput value={form.description} onChange={(v) => f('description', v)} placeholder="Airbus A320 family — single-aisle narrowbody" required />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Body Class">
              <FormSelect
                value={form.bodyClass || ''}
                onChange={(v) => f('bodyClass', v || '')}
                options={BODY_CLASSES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Stand Compatibility">
              <FormSelect
                value={form.standCompatibilityClass || ''}
                onChange={(v) => f('standCompatibilityClass', v || '')}
                options={STAND_COMPAT.map((c) => ({ value: c, label: `Class ${c}` }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Performance">
          <FormRow>
            <FormGroup label="Wake Category">
              <FormSelect
                value={form.wakeCategory || ''}
                onChange={(v) => f('wakeCategory', v || '')}
                options={WAKE_CATS.map((c) => ({ value: c, label: c }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Turbulence Category">
              <FormSelect
                value={form.turbulenceCategory || ''}
                onChange={(v) => f('turbulenceCategory', v || '')}
                options={TURBULENCE_CATS.map((c) => ({ value: c, label: c }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="MTOW (kg)">
              <FormInput type="number" value={String(form.mtowKg || '')} onChange={(v) => f('mtowKg', v)} placeholder="78000" />
            </FormGroup>
            <FormGroup label="MLW (kg)">
              <FormInput type="number" value={String(form.mlwKg || '')} onChange={(v) => f('mlwKg', v)} placeholder="66000" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Engine Type">
              <FormSelect
                value={form.engineType || ''}
                onChange={(v) => f('engineType', v || '')}
                options={ENGINE_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Engine Count">
              <FormInput type="number" value={String(form.engineCount || '')} onChange={(v) => f('engineCount', v)} placeholder="2" />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Dimensions (metres)">
          <FormRow>
            <FormGroup label="Wingspan">
              <FormInput type="number" value={String(form.wingspanM || '')} onChange={(v) => f('wingspanM', v)} placeholder="34.1" />
            </FormGroup>
            <FormGroup label="Length">
              <FormInput type="number" value={String(form.lengthM || '')} onChange={(v) => f('lengthM', v)} placeholder="37.57" />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Validity">
          <FormRow>
            <FormGroup label="Valid From">
              <FormInput type="datetime-local" value={form.validFrom || ''} onChange={(v) => f('validFrom', v || null)} />
            </FormGroup>
            <FormGroup label="Valid To">
              <FormInput type="datetime-local" value={form.validTo || ''} onChange={(v) => f('validTo', v || null)} />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

