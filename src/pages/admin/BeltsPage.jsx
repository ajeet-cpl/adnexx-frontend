import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Luggage, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { BeltAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const AREA_TYPES = ['ARR', 'DEP', 'TRANSFER', 'OVERSIZED'];

const EMPTY = {
  code: '',
  airportId: '',
  terminalId: '',
  active: true,
  attributes: { area: '', intl: false },
  validFrom: '',
  validTo: '',
};

export default function BeltsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/baggage-belts?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);

  const { data: terminalPage } = useSWR('/api/v1/terminals?page=0&size=1000', adminFetcher);
  const terminals = useMemo(() => (Array.isArray(terminalPage) ? terminalPage : terminalPage?.content || []), [terminalPage]);

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.terminalId, t])), [terminals]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        b.code?.toLowerCase().includes(q) ||
        (terminalMap[b.terminalId]?.code || '').toLowerCase().includes(q),
    );
  }, [data, search, terminalMap]);

  const filteredTerminals = useMemo(() => terminals.filter((t) => !form.airportId || t.airportId === form.airportId), [terminals, form.airportId]);

  const stats = [
    { label: 'Total Belts', value: data.length },
    { label: 'Active', value: data.filter((b) => b.active).length, color: 'var(--green)' },
    { label: 'Arrivals', value: data.filter((b) => b.attributes?.area === 'ARR').length, color: 'var(--green)' },
    { label: 'International', value: data.filter((b) => b.attributes?.intl).length, color: 'var(--blue)' },
  ];

  const AREA_COLOR = { ARR: 'badge-green', DEP: 'badge-blue', TRANSFER: 'badge-violet', OVERSIZED: 'badge-amber' };

  const columns = [
    { key: 'code', label: 'Belt', width: '90px', render: (r) => <span className="badge badge-blue">{r.code}</span> },
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
      key: 'area',
      label: 'Area',
      width: '100px',
      render: (r) => {
        const area = r.attributes?.area;
        return area ? <span className={`badge ${AREA_COLOR[area] || 'badge-slate'}`}>{area}</span> : '—';
      },
    },
    {
      key: 'intl',
      label: 'Intl',
      width: '70px',
      render: (r) => (r.attributes?.intl ? <span className="badge badge-cyan">Yes</span> : '—'),
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
      active: row.active ?? true,
      attributes: { area: row.attributes?.area || '', intl: row.attributes?.intl ?? false },
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await BeltAPI.update(row.beltId, { ...row, active: !row.active });
      toast.success('Status Updated', `Belt ${row.code} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await BeltAPI.update(editing.beltId, payload);
        toast.success('Belt Updated', `Belt ${form.code} has been updated`);
      } else {
        await BeltAPI.create(payload);
        toast.success('Belt Created', `Belt ${form.code} has been added`);
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
      const result = await BeltAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Baggage belts CSV uploaded successfully');
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
        title="Baggage Belts"
        subtitle="Baggage reclaim and sortation belts — area, international flag"
        icon={<Luggage size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="beltId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onToggle={handleToggle}
        hasToggle
        activeKey="active"
        addLabel="Add Belt"
        templateFile="belts.csv"
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
        title={editing ? 'Edit Belt' : 'New Belt'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={520}
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

        <FormSection title="Belt Details">
          <FormRow>
            <FormGroup label="Belt Code" required>
              <FormInput value={form.code} onChange={(v) => f('code', v)} placeholder="T3-B01" required />
            </FormGroup>
            <FormGroup label="Area">
              <FormSelect
                value={form.attributes?.area || ''}
                onChange={(v) => fa('area', v)}
                options={AREA_TYPES.map((t) => ({ value: t, label: t }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Options">
              <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FormCheckbox label="International" checked={form.attributes?.intl ?? false} onChange={(v) => fa('intl', v)} />
                <FormCheckbox label="Active" checked={form.active} onChange={(v) => f('active', v)} />
              </div>
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

