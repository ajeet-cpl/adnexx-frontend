import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { DoorOpen, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { GateAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const GATE_ATTR_TYPES = ['CONTACT', 'REMOTE', 'BUS'];

const EMPTY = {
  code: '',
  airportId: '',
  terminalId: '',
  isCommonUse: false,
  adjacentGate1: '',
  adjacentGate2: '',
  active: true,
  quantity: 1,
  validFrom: '',
  validTo: '',
  attributes: { type: 'CONTACT', hasBoardingBridge: false },
};

export default function GatesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/gates?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const { data: terminalPage } = useSWR('/api/v1/terminals?page=0&size=1000', adminFetcher);
  const terminals = useMemo(() => (Array.isArray(terminalPage) ? terminalPage : terminalPage?.content || []), [terminalPage]);

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.terminalId, t])), [terminals]);

  const airportIdFilter = useMemo(() => {
    const iata = searchParams.get('airport');
    if (!iata) return '';
    return airports.find(a => a.iataCode === iata)?.airportId || '';
  }, [airports, searchParams]);

  const filtered = useMemo(() => {
    let rows = data;
    if (airportIdFilter) rows = rows.filter(g => g.airportId === airportIdFilter);
    if (statusFilter === 'active') rows = rows.filter((g) => g.active);
    else if (statusFilter === 'closed') rows = rows.filter((g) => !g.active);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (g) =>
        g.code?.toLowerCase().includes(q) ||
        (terminalMap[g.terminalId]?.code || '').toLowerCase().includes(q),
    );
  }, [data, search, statusFilter, terminalMap, airportIdFilter]);

  const filteredTerminals = useMemo(() => terminals.filter((t) => !form.airportId || t.airportId === form.airportId), [terminals, form.airportId]);

  const stats = [
    { label: 'Total Gates', value: data.length },
    { label: 'Active', value: data.filter((g) => g.active).length, color: 'var(--green)' },
    { label: 'Common Use', value: data.filter((g) => g.isCommonUse).length, color: 'var(--cyan)' },
    { label: 'Contact', value: data.filter((g) => g.attributes?.type === 'CONTACT').length, color: 'var(--blue)' },
  ];

  const columns = [
    { key: 'code', label: 'Gate', width: '80px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
    {
      key: 'terminalId',
      label: 'Terminal',
      width: '90px',
      render: (r) => {
        const t = terminalMap[r.terminalId];
        return t ? <span className="badge badge-slate">{t.code}</span> : '—';
      },
    },
    {
      key: 'attributes.type',
      label: 'Type',
      width: '110px',
      render: (r) => (r.attributes?.type ? <span className="badge badge-violet">{r.attributes.type}</span> : '—'),
    },
    { key: 'isCommonUse', label: 'Common Use', width: '100px', render: (r) => (r.isCommonUse ? <span className="badge badge-cyan">Yes</span> : '—') },
    { key: 'quantity', label: 'Qty', width: '70px', render: (r) => (r.quantity != null ? String(r.quantity) : '—') },
    {
      key: 'attributes.hasBoardingBridge',
      label: 'Bridge',
      width: '80px',
      render: (r) => (r.attributes?.hasBoardingBridge ? <span className="badge badge-green">Yes</span> : '—'),
    },
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
      isCommonUse: row.isCommonUse ?? false,
      adjacentGate1: row.adjacentGate1 || '',
      adjacentGate2: row.adjacentGate2 || '',
      active: row.active ?? true,
      quantity: row.quantity ?? 1,
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
      attributes: { type: row.attributes?.type || 'CONTACT', hasBoardingBridge: row.attributes?.hasBoardingBridge ?? false },
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await GateAPI.update(row.gateId, { ...row, active: !row.active });
      toast.success('Status Updated', `Gate ${row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      adjacentGate1: form.adjacentGate1 || null,
      adjacentGate2: form.adjacentGate2 || null,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await GateAPI.update(editing.gateId, payload);
        toast.success('Gate Updated', `Gate ${form.code} has been updated`);
      } else {
        await GateAPI.create(payload);
        toast.success('Gate Created', `Gate ${form.code} has been added`);
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
      const result = await GateAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Gates CSV uploaded successfully');
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
        title="Gates"
        subtitle="Boarding gates — type, common-use and boarding bridge"
        icon={<DoorOpen size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="gateId"
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
        addLabel="Add Gate"
        templateFile="gates.csv"
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
        title={editing ? 'Edit Gate' : 'New Gate'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={560}
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
          <FormRow cols={1}>
            <FormGroup label="Terminal">
              <FormSelect
                value={form.terminalId || ''}
                onChange={(v) => f('terminalId', v)}
                options={filteredTerminals.map((t) => ({ value: t.terminalId, label: t.code }))}
                placeholder="Select terminal…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Gate Details">
          <FormRow>
            <FormGroup label="Gate Code" required>
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="A1" required />
            </FormGroup>
            <FormGroup label="Gate Type">
              <FormSelect
                value={form.attributes?.type || ''}
                onChange={(v) => fa('type', v)}
                options={GATE_ATTR_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Quantity">
              <FormInput type="number" value={String(form.quantity ?? '')} onChange={(v) => f('quantity', Number(v))} placeholder="1" />
            </FormGroup>
            <FormGroup label="Options">
              <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FormCheckbox label="Common Use" checked={form.isCommonUse} onChange={(v) => f('isCommonUse', v)} />
                <FormCheckbox label="Boarding Bridge" checked={form.attributes?.hasBoardingBridge ?? false} onChange={(v) => fa('hasBoardingBridge', v)} />
                <FormCheckbox label="Active" checked={form.active} onChange={(v) => f('active', v)} />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Adjacent Gates">
          <FormRow>
            <FormGroup label="Adjacent Gate 1">
              <FormInput value={form.adjacentGate1 || ''} onChange={(v) => f('adjacentGate1', v)} placeholder="e.g. A2" />
            </FormGroup>
            <FormGroup label="Adjacent Gate 2">
              <FormInput value={form.adjacentGate2 || ''} onChange={(v) => f('adjacentGate2', v)} placeholder="e.g. B1" />
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

