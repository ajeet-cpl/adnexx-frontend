import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { ShieldCheck, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormCheckbox, FormSection } from '@/components/ui/FormModal';
import { TenantAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const EMPTY = {
  name: '',
  code: '',
  email: '',
  phone: '',
  website: '',
  country: '',
  active: true,
  attributes: { region: '', tier: '' },
  validFrom: '',
  validTo: '',
};

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/tenants?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q) ||
        (t.country || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const stats = [
    { label: 'Total Tenants', value: data.length },
    { label: 'Active', value: data.filter((t) => t.active).length, color: 'var(--green)' },
    { label: 'Inactive', value: data.filter((t) => !t.active).length, color: 'var(--text-3)' },
  ];

  const columns = [
    { key: 'code', label: 'Code', width: '100px', render: (r) => <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--blue)' }}>{r.code}</span> },
    { key: 'name', label: 'Tenant Name' },
    { key: 'country', label: 'Country', width: '120px', render: (r) => r.country || '—' },
    { key: 'email', label: 'Email', width: '180px', render: (r) => r.email || '—' },
    {
      key: 'createdAt',
      label: 'Created',
      width: '130px',
      render: (r) =>
        r.createdAt ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ) : '—',
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
      name: row.name || '',
      code: row.code || '',
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '',
      country: row.country || '',
      active: row.active ?? true,
      attributes: { region: row.attributes?.region || '', tier: row.attributes?.tier || '' },
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await TenantAPI.update(row.tenantId, { ...row, active: !row.active });
      toast.success('Status Updated', `${row.name} is now ${!row.active ? 'active' : 'inactive'}`);
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
    };
    try {
      if (editing) {
        await TenantAPI.update(editing.tenantId, payload);
        toast.success('Tenant Updated', `${form.name} has been updated`);
      } else {
        await TenantAPI.create(payload);
        toast.success('Tenant Created', `${form.name} has been added`);
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
      const result = await TenantAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Tenants CSV uploaded successfully');
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
        title="Tenants"
        subtitle="Multi-tenancy root — airport and organisation tenant management"
        icon={<ShieldCheck size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="tenantId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onToggle={handleToggle}
        hasToggle
        activeKey="active"
        addLabel="Add Tenant"
        templateFile="tenants.csv"
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
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} />
                {uploading ? 'Uploading…' : 'Bulk Upload'}
              </button>
            </>
          )
        }
        stats={stats}
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />
      <FormModal title={editing ? 'Edit Tenant' : 'New Tenant'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={560}>
        <FormSection title="Tenant Details">
          <FormRow>
            <FormGroup label="Tenant Code" required hint="Unique short code">
              <FormInput value={form.code} onChange={(v) => f('code', v.toUpperCase())} placeholder="IGIA" required />
            </FormGroup>
            <FormGroup label="Country">
              <FormInput value={form.country} onChange={(v) => f('country', v)} placeholder="India" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Tenant Name" required>
              <FormInput value={form.name} onChange={(v) => f('name', v)} placeholder="Indira Gandhi International Airport Authority" required />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Contact">
          <FormRow>
            <FormGroup label="Email">
              <FormInput type="email" value={form.email} onChange={(v) => f('email', v)} placeholder="admin@igia.in" />
            </FormGroup>
            <FormGroup label="Phone">
              <FormInput value={form.phone} onChange={(v) => f('phone', v)} placeholder="+91-11-2456-2000" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Website">
              <FormInput value={form.website} onChange={(v) => f('website', v)} placeholder="https://www.newdelhiairport.in" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Attributes">
          <FormRow>
            <FormGroup label="Region">
              <FormInput value={form.attributes?.region || ''} onChange={(v) => fa('region', v)} placeholder="South Asia" />
            </FormGroup>
            <FormGroup label="Tier">
              <FormInput value={form.attributes?.tier || ''} onChange={(v) => fa('tier', v)} placeholder="Tier-1" />
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

