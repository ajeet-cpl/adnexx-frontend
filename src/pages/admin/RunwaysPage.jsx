import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Waypoints, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { RunwayAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const SURFACES = ['ASP', 'CON', 'GRS', 'GVL', 'DRT'];
const LIGHTING = ['HIRL', 'MIRL', 'LIRL', 'NONE'];

const EMPTY = {
  code: '',
  airportId: '',
  lengthM: '',
  widthM: '',
  active: true,
  attributes: { surface: '', lighting: '' },
  validFrom: '',
  validTo: '',
};

export default function RunwaysPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/runways?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'active') rows = rows.filter((r) => r.active);
    else if (statusFilter === 'closed') rows = rows.filter((r) => !r.active);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.code?.toLowerCase().includes(q));
  }, [data, search, statusFilter]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter((r) => r.active).length, color: 'var(--green)' },
  ];

  const columns = [
    {
      key: 'code',
      label: 'Designator',
      width: '110px',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.code}</span>
      ),
    },
    { key: 'lengthM', label: 'Length', width: '100px', render: (r) => (r.lengthM != null ? `${r.lengthM.toLocaleString()}m` : '—') },
    { key: 'widthM', label: 'Width', width: '80px', render: (r) => (r.widthM != null ? `${r.widthM}m` : '—') },
    { key: 'surface', label: 'Surface', width: '100px', render: (r) => (r.attributes?.surface ? <span className="badge badge-slate">{r.attributes.surface}</span> : '—') },
    { key: 'lighting', label: 'Lighting', width: '100px', render: (r) => (r.attributes?.lighting ? <span className="badge badge-cyan">{r.attributes.lighting}</span> : '—') },
    {
      key: 'active',
      label: 'Status',
      width: '80px',
      render: (r) => (
        <span className={`badge ${r.active ? 'badge-green' : 'badge-slate'}`}>
          {r.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, attributes: { ...EMPTY.attributes } });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      code: row.code || '',
      airportId: row.airportId || '',
      lengthM: row.lengthM ?? '',
      widthM: row.widthM ?? '',
      active: row.active ?? true,
      attributes: { surface: row.attributes?.surface || '', lighting: row.attributes?.lighting || '' },
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await RunwayAPI.update(row.runwayId, { ...row, active: !row.active });
      toast.success('Status Updated', `Runway ${row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      lengthM: form.lengthM !== '' ? Number(form.lengthM) : null,
      widthM: form.widthM !== '' ? Number(form.widthM) : null,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await RunwayAPI.update(editing.runwayId, payload);
        toast.success('Runway Updated', `Runway ${form.code} has been updated`);
      } else {
        await RunwayAPI.create(payload);
        toast.success('Runway Created', `Runway ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm((p) => ({ ...p, attributes: { ...p.attributes, [k]: v } }));

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await RunwayAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Runways CSV uploaded successfully');
      mutate();
    } catch (err) {
      toast.error('Bulk Upload Failed', err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <MasterPage
        readOnly={!hasRole('ADMIN')}
        title="Runways"
        subtitle="Airport runways — designator, dimensions, surface and lighting"
        icon={<Waypoints size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="runwayId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onToggle={handleToggle}
        hasToggle
        activeKey="active"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        addLabel="Add Runway"
        templateFile="runways.csv"
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
        title={editing ? 'Edit Runway' : 'New Runway'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={600}
      >
        <FormSection title="Identification">
          <FormRow cols={1}>
            <FormGroup label="Airport" required>
              <FormSelect
                value={form.airportId}
                onChange={(v) => f('airportId', v)}
                options={airports.map((a) => ({
                  value: a.airportId,
                  label: `${a.iataCode ? `[${a.iataCode.trim()}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airport…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Designator" required hint="e.g. 09/27">
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="09/27" required />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Physical Characteristics">
          <FormRow>
            <FormGroup label="Length (m)">
              <FormInput type="number" value={String(form.lengthM ?? '')} onChange={(v) => f('lengthM', v)} placeholder="4430" />
            </FormGroup>
            <FormGroup label="Width (m)">
              <FormInput type="number" value={String(form.widthM ?? '')} onChange={(v) => f('widthM', v)} placeholder="60" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Surface">
              <FormSelect
                value={form.attributes?.surface || ''}
                onChange={(v) => fa('surface', v)}
                options={SURFACES.map((s) => ({ value: s, label: s }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Lighting">
              <FormSelect
                value={form.attributes?.lighting || ''}
                onChange={(v) => fa('lighting', v)}
                options={LIGHTING.map((l) => ({ value: l, label: l }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Validity">
          <FormRow>
            <FormGroup label="Valid From">
              <FormInput type="datetime-local" value={form.validFrom || ''} onChange={(v) => f('validFrom', v)} />
            </FormGroup>
            <FormGroup label="Valid To">
              <FormInput type="datetime-local" value={form.validTo || ''} onChange={(v) => f('validTo', v)} />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormCheckbox label="Active" checked={form.active} onChange={(v) => f('active', v)} />
      </FormModal>
    </>
  );
}

