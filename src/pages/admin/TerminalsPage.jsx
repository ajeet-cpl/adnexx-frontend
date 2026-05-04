import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Building2, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormSection } from '@/components/ui/FormModal';
import { TerminalAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const ATTRIBUTE_TYPES = ['DOMESTIC', 'INTERNATIONAL', 'MIXED'];

const EMPTY = { tenantId: '', airportId: '', code: '', name: '', attributes: { type: '' }, validFrom: null, validTo: null, active: true };

export default function TerminalsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: rawData, isLoading, error, mutate } = useSWR(`/api/v1/terminals?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  // Normalize: if backend doesn't return `active`, default it to true
  const data = (Array.isArray(rawData) ? rawData : (rawData?.content || [])).map(t => ({ ...t, active: t.active !== false }));
  const totalPages = rawData?.totalPages ?? 1;
  const { data: airportsData } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = Array.isArray(airportsData) ? airportsData : (airportsData?.content || []);

  // Build airport lookup for status
  const airportMap = useMemo(() => {
    const map = {};
    airports.forEach((a) => { map[a.airportId] = a; });
    return map;
  }, [airports]);

  const getStatus = (t) => airportMap[t.airportId]?.operationalStatus || 'UNKNOWN';

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'active') rows = rows.filter((t) => t.active);
    else if (statusFilter === 'closed') rows = rows.filter((t) => !t.active);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((t) => (t.code || '').toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q) || (t.airportName || '').toLowerCase().includes(q));
  }, [data, search, statusFilter]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter((t) => t.active).length, color: 'var(--green)' },
    { label: 'Inactive', value: data.filter((t) => !t.active).length, color: 'var(--red)' },
    { label: 'Airports', value: new Set(data.map((t) => t.airportId).filter(Boolean)).size, color: 'var(--blue)' },
  ];

  const columns = [
    { key: 'code', label: 'Code', width: '80px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
    { key: 'name', label: 'Terminal Name', render: (r) => r.name || '—' },
    { key: 'airportName', label: 'Airport', width: '180px', render: (r) => r.airportName || '—' },
    { key: 'type', label: 'Type', width: '180px', render: (r) => r.attributes?.type || '—' },
    { key: 'airportIataCode', label: 'IATA', width: '80px', render: (r) => r.airportIataCode || '—' },
    { key: 'active', label: 'Status', width: '90px', render: (r) => <span className={`badge ${r.active ? 'badge-green' : 'badge-slate'}`}>{r.active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      tenantId: row.tenantId || getTenantId(),
      airportId: row.airportId,
      code: row.code,
      name: row.name || '',
      attributes: row.attributes || { type: '' },
      validFrom: row.validFrom || null,
      validTo: row.validTo || null,
      active: row.active ?? true,
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await TerminalAPI.update(row.terminalId, { ...row, active: !row.active });
      toast.success('Status Updated', `${row.name || row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function handleSubmit() {
    try {
      const payload = {
        name: form.name,
        code: form.code,
        airportId: form.airportId,
        attributes: form.attributes,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        tenantId: form.tenantId || getTenantId(),
        active: form.active ?? true,
      };
      if (editing) {
        await TerminalAPI.update(editing.terminalId, payload);
        toast.success('Terminal Updated', `${form.code} has been updated`);
      } else {
        await TerminalAPI.create(payload);
        toast.success('Terminal Created', `${form.code} has been added`);
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
      const result = await TerminalAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Terminals CSV uploaded successfully');
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
        title="Terminals"
        subtitle="Airport terminal buildings — codes, names and passenger capacity"
        icon={<Building2 size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="terminalId"
        hasToggle
        activeKey="active"
        onToggle={handleToggle}
        onStatusFilterChange={setStatusFilter}
        statusFilter={statusFilter}
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Terminal"
        templateFile="terminals.csv"
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
      <FormModal title={editing ? 'Edit Terminal' : 'New Terminal'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Details">
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
            <FormGroup label="Terminal Code" required hint="e.g. T1, T2, A">
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="T1" required />
            </FormGroup>
            <FormGroup label="Terminal Name" required>
              <FormInput value={form.name || ''} onChange={(v) => f('name', v)} placeholder="Terminal 1" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Type" hint="Terminal type attribute">
              <FormSelect
                value={form.attributes?.type || ''}
                onChange={(v) => setForm((p) => ({ ...p, attributes: { ...p.attributes, type: v } }))}
                options={ATTRIBUTE_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Select type…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Validity">
          <FormRow>
            <FormGroup label="Valid From">
              <FormInput type="date" value={form.validFrom || ''} onChange={(v) => f('validFrom', v || null)} />
            </FormGroup>
            <FormGroup label="Valid To">
              <FormInput type="date" value={form.validTo || ''} onChange={(v) => f('validTo', v || null)} />
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormModal>
    </>
  );
}

