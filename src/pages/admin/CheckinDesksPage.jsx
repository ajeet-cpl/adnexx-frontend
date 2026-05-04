import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { ClipboardList, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { CheckinDeskAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const DESK_ATTR_TYPES = ['Full-Service', 'Self-Service', 'Premium', 'Oversized'];
const ZONE_TYPES = ['International', 'Domestic', 'Transfer'];

const EMPTY = {
  code: '',
  airportId: '',
  terminalId: '',
  airlineId: '',
  counters: 1,
  active: true,
  attributes: { zone: '', type: '' },
  validFrom: '',
  validTo: '',
};

export default function CheckinDesksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/checkin-desks?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const { data: terminalPage } = useSWR('/api/v1/terminals?page=0&size=1000', adminFetcher);
  const terminals = useMemo(() => (Array.isArray(terminalPage) ? terminalPage : terminalPage?.content || []), [terminalPage]);

  const { data: airlinePage } = useSWR('/api/v1/airlines?page=0&size=1000', adminFetcher);
  const airlines = useMemo(() => (Array.isArray(airlinePage) ? airlinePage : airlinePage?.content || []), [airlinePage]);

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.terminalId, t])), [terminals]);
  const airlineMap = useMemo(() => Object.fromEntries(airlines.map((a) => [a.airlineId, a])), [airlines]);

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'active') rows = rows.filter((d) => d.active);
    else if (statusFilter === 'closed') rows = rows.filter((d) => !d.active);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        d.code?.toLowerCase().includes(q) ||
        (terminalMap[d.terminalId]?.code || '').toLowerCase().includes(q) ||
        (airlineMap[d.airlineId]?.name || '').toLowerCase().includes(q),
    );
  }, [data, search, statusFilter, terminalMap, airlineMap]);

  const filteredTerminals = useMemo(() => terminals.filter((t) => !form.airportId || t.airportId === form.airportId), [terminals, form.airportId]);

  const stats = [
    { label: 'Total Desks', value: data.length },
    { label: 'Active', value: data.filter((d) => d.active).length, color: 'var(--green)' },
    { label: 'International', value: data.filter((d) => d.attributes?.zone === 'International').length, color: 'var(--blue)' },
  ];

  const columns = [
    { key: 'code', label: 'Desk', width: '100px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
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
      key: 'airlineId',
      label: 'Airline',
      width: '130px',
      render: (r) => {
        const a = airlineMap[r.airlineId];
        return a ? <span>{a.iataCode ? `[${a.iataCode}] ` : ''}{a.name}</span> : '—';
      },
    },
    { key: 'counters', label: 'Counters', width: '80px', render: (r) => (r.counters != null ? String(r.counters) : '—') },
    {
      key: 'zone',
      label: 'Zone',
      width: '110px',
      render: (r) => (r.attributes?.zone ? <span className="badge badge-cyan">{r.attributes.zone}</span> : '—'),
    },
    {
      key: 'type',
      label: 'Type',
      width: '110px',
      render: (r) => (r.attributes?.type ? <span className="badge badge-violet">{r.attributes.type}</span> : '—'),
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
      airlineId: row.airlineId || '',
      counters: row.counters ?? 1,
      active: row.active ?? true,
      attributes: { zone: row.attributes?.zone || '', type: row.attributes?.type || '' },
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await CheckinDeskAPI.update(row.deskId, { ...row, active: !row.active });
      toast.success('Status Updated', `Desk ${row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      counters: form.counters !== '' ? Number(form.counters) : null,
      airlineId: form.airlineId || null,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await CheckinDeskAPI.update(editing.deskId, payload);
        toast.success('Desk Updated', `Desk ${form.code} has been updated`);
      } else {
        await CheckinDeskAPI.create(payload);
        toast.success('Desk Created', `Desk ${form.code} has been added`);
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
      const result = await CheckinDeskAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Check-in desks CSV uploaded successfully');
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
        title="Check-in Desks"
        subtitle="Passenger check-in counters — zone, type, airline assignment"
        icon={<ClipboardList size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="deskId"
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
        addLabel="Add Desk"
        templateFile="checkin-desks.csv"
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
        title={editing ? 'Edit Check-in Desk' : 'New Check-in Desk'}
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

        <FormSection title="Desk Details">
          <FormRow>
            <FormGroup label="Desk Code" required>
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="T3-CK-001" required />
            </FormGroup>
            <FormGroup label="Counters">
              <FormInput type="number" value={String(form.counters ?? '')} onChange={(v) => f('counters', v)} placeholder="4" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Airline">
              <FormSelect
                value={form.airlineId || ''}
                onChange={(v) => f('airlineId', v)}
                options={airlines.map((a) => ({
                  value: a.airlineId,
                  label: `${a.iataCode ? `[${a.iataCode}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airline…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Zone">
              <FormSelect
                value={form.attributes?.zone || ''}
                onChange={(v) => fa('zone', v)}
                options={ZONE_TYPES.map((z) => ({ value: z, label: z }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Type">
              <FormSelect
                value={form.attributes?.type || ''}
                onChange={(v) => fa('type', v)}
                options={DESK_ATTR_TYPES.map((t) => ({ value: t, label: t }))}
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

