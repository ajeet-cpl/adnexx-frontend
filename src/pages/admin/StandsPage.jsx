import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { ParkingSquare, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { StandAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

function compatClasses(row) {
  const classes = [];
  if (row.classACompatible) classes.push('A');
  if (row.classBCompatible) classes.push('B');
  if (row.classCCompatible) classes.push('C');
  if (row.classDCompatible) classes.push('D');
  if (row.classECompatible) classes.push('E');
  if (row.classFCompatible) classes.push('F');
  return classes;
}

const EMPTY = {
  code: '',
  airportId: '',
  terminalId: '',
  maxWingspanM: '',
  towRequired: false,
  classACompatible: false,
  classBCompatible: false,
  classCCompatible: false,
  classDCompatible: false,
  classECompatible: false,
  classFCompatible: false,
  blockedBy1: '',
  blockedBy2: '',
  blockedBy3: '',
  blockedBy4: '',
  blockedBy5: '',
  blockedBy6: '',
  active: true,
  quantity: 1,
  validFrom: '',
  validTo: '',
  attributes: { zone: '' },
};

export default function StandsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/stands?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const { data: terminalPage } = useSWR('/api/v1/terminals?page=0&size=1000', adminFetcher);
  const terminals = useMemo(() => (Array.isArray(terminalPage) ? terminalPage : terminalPage?.content || []), [terminalPage]);

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.terminalId, t])), [terminals]);

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'active') rows = rows.filter((s) => s.active);
    else if (statusFilter === 'closed') rows = rows.filter((s) => !s.active);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (s) =>
        s.code?.toLowerCase().includes(q) ||
        (terminalMap[s.terminalId]?.code || '').toLowerCase().includes(q),
    );
  }, [data, search, statusFilter, terminalMap]);

  const filteredTerminals = useMemo(() => terminals.filter((t) => !form.airportId || t.airportId === form.airportId), [terminals, form.airportId]);

  const stats = [
    { label: 'Total Stands', value: data.length },
    { label: 'Active', value: data.filter((s) => s.active).length, color: 'var(--green)' },
    { label: 'Tow Required', value: data.filter((s) => s.towRequired).length, color: 'var(--amber)' },
  ];

  const columns = [
    { key: 'code', label: 'Stand', width: '90px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
    {
      key: 'terminalId',
      label: 'Terminal',
      width: '90px',
      render: (r) => {
        const t = terminalMap[r.terminalId];
        return t ? <span className="badge badge-slate">{t.code}</span> : '—';
      },
    },
    { key: 'maxWingspanM', label: 'Max WS', width: '80px', render: (r) => (r.maxWingspanM != null ? `${r.maxWingspanM}m` : '—') },
    {
      key: 'compat',
      label: 'Classes',
      width: '130px',
      render: (r) => {
        const cc = compatClasses(r);
        return cc.length > 0 ? (
          <div style={{ display: 'flex', gap: 3 }}>
            {cc.map((c) => (
              <span key={c} className="badge badge-violet">{c}</span>
            ))}
          </div>
        ) : '—';
      },
    },
    {
      key: 'towRequired',
      label: 'Features',
      width: '90px',
      render: (r) => (
        <div style={{ display: 'flex', gap: 3 }}>
          {r.towRequired && <span className="badge badge-amber">TOW</span>}
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', width: '60px', render: (r) => (r.quantity != null ? String(r.quantity) : '—') },
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
      terminalId: row.terminalId || '',
      maxWingspanM: row.maxWingspanM ?? '',
      towRequired: row.towRequired ?? false,
      classACompatible: row.classACompatible ?? false,
      classBCompatible: row.classBCompatible ?? false,
      classCCompatible: row.classCCompatible ?? false,
      classDCompatible: row.classDCompatible ?? false,
      classECompatible: row.classECompatible ?? false,
      classFCompatible: row.classFCompatible ?? false,
      blockedBy1: row.blockedBy1 || '',
      blockedBy2: row.blockedBy2 || '',
      blockedBy3: row.blockedBy3 || '',
      blockedBy4: row.blockedBy4 || '',
      blockedBy5: row.blockedBy5 || '',
      blockedBy6: row.blockedBy6 || '',
      active: row.active ?? true,
      quantity: row.quantity ?? 1,
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
      attributes: { zone: row.attributes?.zone || '' },
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await StandAPI.update(row.standId, { ...row, active: !row.active });
      toast.success('Status Updated', `Stand ${row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      maxWingspanM: form.maxWingspanM !== '' ? Number(form.maxWingspanM) : null,
      blockedBy1: form.blockedBy1 || null,
      blockedBy2: form.blockedBy2 || null,
      blockedBy3: form.blockedBy3 || null,
      blockedBy4: form.blockedBy4 || null,
      blockedBy5: form.blockedBy5 || null,
      blockedBy6: form.blockedBy6 || null,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await StandAPI.update(editing.standId, payload);
        toast.success('Stand Updated', `Stand ${form.code} has been updated`);
      } else {
        await StandAPI.create(payload);
        toast.success('Stand Created', `Stand ${form.code} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await StandAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Stands CSV uploaded successfully');
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
        title="Stands / Apron"
        subtitle="Aircraft parking stands — compatibility classes, dimensions, blocked-by"
        icon={<ParkingSquare size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="standId"
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
        addLabel="Add Stand"
        templateFile="stands.csv"
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
        title={editing ? 'Edit Stand' : 'New Stand'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={620}
      >
        <FormSection title="Location">
          <FormRow cols={1}>
            <FormGroup label="Airport" required>
              <FormSelect
                value={form.airportId}
                onChange={(v) => {
                  f('airportId', v);
                  f('terminalId', '');
                }}
                options={airports.map((a) => ({
                  value: a.airportId,
                  label: `${a.iataCode ? `[${a.iataCode.trim()}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airport…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Terminal">
              <FormSelect
                value={form.terminalId || ''}
                onChange={(v) => f('terminalId', v)}
                options={filteredTerminals.map((t) => ({ value: t.terminalId, label: t.code }))}
                placeholder="Select terminal…"
              />
            </FormGroup>
            <FormGroup label="Stand Code" required>
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="T3-201" required />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Dimensions & Constraints">
          <FormRow>
            <FormGroup label="Max Wingspan (m)">
              <FormInput
                type="number"
                value={String(form.maxWingspanM ?? '')}
                onChange={(v) => f('maxWingspanM', v)}
                placeholder="36"
              />
            </FormGroup>
            <FormGroup label="Quantity">
              <FormInput type="number" value={String(form.quantity ?? '')} onChange={(v) => f('quantity', Number(v))} placeholder="1" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Zone (attribute)">
              <FormInput value={form.attributes?.zone || ''} onChange={(v) => setForm((p) => ({ ...p, attributes: { ...p.attributes, zone: v } }))} placeholder="T3D" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Compatibility Classes">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <FormCheckbox label="Class A" checked={form.classACompatible} onChange={(v) => f('classACompatible', v)} />
            <FormCheckbox label="Class B" checked={form.classBCompatible} onChange={(v) => f('classBCompatible', v)} />
            <FormCheckbox label="Class C" checked={form.classCCompatible} onChange={(v) => f('classCCompatible', v)} />
            <FormCheckbox label="Class D" checked={form.classDCompatible} onChange={(v) => f('classDCompatible', v)} />
            <FormCheckbox label="Class E" checked={form.classECompatible} onChange={(v) => f('classECompatible', v)} />
            <FormCheckbox label="Class F" checked={form.classFCompatible} onChange={(v) => f('classFCompatible', v)} />
          </div>
        </FormSection>

        <FormSection title="Options">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormCheckbox label="Tow Required" checked={form.towRequired} onChange={(v) => f('towRequired', v)} />
            <FormCheckbox label="Active" checked={form.active} onChange={(v) => f('active', v)} />
          </div>
        </FormSection>

        <FormSection title="Blocked By">
          <FormRow>
            <FormGroup label="Blocked By 1">
              <FormInput value={form.blockedBy1 || ''} onChange={(v) => f('blockedBy1', v)} placeholder="Stand code" />
            </FormGroup>
            <FormGroup label="Blocked By 2">
              <FormInput value={form.blockedBy2 || ''} onChange={(v) => f('blockedBy2', v)} placeholder="Stand code" />
            </FormGroup>
            <FormGroup label="Blocked By 3">
              <FormInput value={form.blockedBy3 || ''} onChange={(v) => f('blockedBy3', v)} placeholder="Stand code" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Blocked By 4">
              <FormInput value={form.blockedBy4 || ''} onChange={(v) => f('blockedBy4', v)} placeholder="Stand code" />
            </FormGroup>
            <FormGroup label="Blocked By 5">
              <FormInput value={form.blockedBy5 || ''} onChange={(v) => f('blockedBy5', v)} placeholder="Stand code" />
            </FormGroup>
            <FormGroup label="Blocked By 6">
              <FormInput value={form.blockedBy6 || ''} onChange={(v) => f('blockedBy6', v)} placeholder="Stand code" />
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
      </FormModal>
    </>
  );
}

