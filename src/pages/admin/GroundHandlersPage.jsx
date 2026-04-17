import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Truck, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { GroundHandlerAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const SERVICE_TYPES = ['ramp', 'baggage', 'fuel', 'cargo', 'passenger', 'catering', 'cleaning', 'de-icing'];

const EMPTY = {
  name: '',
  shortCode: '',
  airportId: '',
  active: true,
  contactInfo: { email: '', phone: '', website: '', address: '' },
  attributes: { serviceTypes: [], licenseNo: '', certifications: '' },
};

export default function GroundHandlersPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/ground-handlers?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const { data: airportPage } = useSWR('/api/v1/airports?page=0&size=1000', adminFetcher);
  const airports = useMemo(() => (Array.isArray(airportPage) ? airportPage : airportPage?.content || []), [airportPage]);
  const airportMap = useMemo(() => Object.fromEntries(airports.map((a) => [a.airportId, a])), [airports]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        (h.shortCode || '').toLowerCase().includes(q) ||
        (airportMap[h.airportId]?.iataCode || '').toLowerCase().includes(q),
    );
  }, [data, search, airportMap]);

  const stats = [
    { label: 'Total', value: data.length },
    { label: 'Active', value: data.filter((h) => h.active).length, color: 'var(--green)' },
    { label: 'Inactive', value: data.filter((h) => !h.active).length, color: 'var(--text-3)' },
  ];

  const columns = [
    {
      key: 'shortCode',
      label: 'Code',
      width: '80px',
      render: (r) =>
        r.shortCode ? (
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{r.shortCode}</span>
        ) : (
          '—'
        ),
    },
    { key: 'name', label: 'Handler Name' },
    {
      key: 'airportId',
      label: 'Airport',
      width: '90px',
      render: (r) => {
        const a = airportMap[r.airportId];
        return a ? <span className="badge badge-slate">{a.iataCode || a.name}</span> : '—';
      },
    },
    {
      key: 'contactInfo',
      label: 'Contact',
      width: '200px',
      render: (r) => {
        const c = r.contactInfo || {};
        return <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{c.email || c.phone || '—'}</span>;
      },
    },
    {
      key: 'services',
      label: 'Services',
      width: '160px',
      render: (r) => {
        const svcs = r.attributes?.serviceTypes;
        if (!Array.isArray(svcs) || !svcs.length) return '—';
        return (
          <span style={{ fontSize: '0.75rem' }}>
            {svcs.slice(0, 3).map((s) => (
              <span key={s} className="badge badge-cyan" style={{ marginRight: 3 }}>
                {s}
              </span>
            ))}
            {svcs.length > 3 && <span className="badge badge-slate">+{svcs.length - 3}</span>}
          </span>
        );
      },
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
    setForm({
      ...EMPTY,
      contactInfo: { ...EMPTY.contactInfo },
      attributes: { ...EMPTY.attributes, serviceTypes: [] },
    });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const ci = row.contactInfo || {};
    const attr = row.attributes || {};
    setForm({
      name: row.name || '',
      shortCode: row.shortCode || '',
      airportId: row.airportId || '',
      active: row.active ?? true,
      contactInfo: {
        email: ci.email || '',
        phone: ci.phone || '',
        website: ci.website || '',
        address: ci.address || '',
      },
      attributes: {
        serviceTypes: Array.isArray(attr.serviceTypes) ? [...attr.serviceTypes] : [],
        licenseNo: attr.licenseNo || '',
        certifications: Array.isArray(attr.certifications) ? attr.certifications.join(', ') : attr.certifications || '',
      },
    });
    setModalOpen(true);
  }

  async function handleToggle(row) {
    try {
      await GroundHandlerAPI.update(row.handlerId, { ...row, active: !row.active });
      toast.success('Status Updated', `${row.name} is now ${!row.active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    const certs = form.attributes.certifications
      ? form.attributes.certifications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const payload = {
      name: form.name,
      shortCode: form.shortCode || null,
      airportId: form.airportId || null,
      active: form.active,
      contactInfo: {
        email: form.contactInfo.email || null,
        phone: form.contactInfo.phone || null,
        website: form.contactInfo.website || null,
        address: form.contactInfo.address || null,
      },
      attributes: {
        serviceTypes: form.attributes.serviceTypes,
        licenseNo: form.attributes.licenseNo || null,
        certifications: certs.length ? certs : null,
      },
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await GroundHandlerAPI.update(editing.handlerId, payload);
        toast.success('Handler Updated', `${form.name} has been updated`);
      } else {
        await GroundHandlerAPI.create(payload);
        toast.success('Handler Created', `${form.name} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fc = (k, v) => setForm((p) => ({ ...p, contactInfo: { ...p.contactInfo, [k]: v } }));
  const fa = (k, v) => setForm((p) => ({ ...p, attributes: { ...p.attributes, [k]: v } }));

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await GroundHandlerAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Ground handlers CSV uploaded successfully');
      mutate();
    } catch (err) {
      toast.error('Bulk Upload Failed', err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function toggleService(svc) {
    setForm((p) => {
      const cur = p.attributes.serviceTypes || [];
      const next = cur.includes(svc) ? cur.filter((s) => s !== svc) : [...cur, svc];
      return { ...p, attributes: { ...p.attributes, serviceTypes: next } };
    });
  }

  return (
    <>
      <MasterPage
        readOnly={!hasRole('ADMIN')}
        title="Ground Handlers"
        subtitle="GHA companies providing ground services at the airport"
        icon={<Truck size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="handlerId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onToggle={handleToggle}
        hasToggle
        activeKey="active"
        addLabel="Add Handler"
        templateFile="ground-handlers.csv"
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
        title={editing ? 'Edit Ground Handler' : 'New Ground Handler'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={580}
      >
        <FormSection title="Identity">
          <FormRow cols={1}>
            <FormGroup label="Handler Name" required>
              <FormInput value={form.name} onChange={(v) => f('name', v)} placeholder="Swissport International" required />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Short Code" hint="e.g. BWFS">
              <FormInput value={form.shortCode} onChange={(v) => f('shortCode', v)} placeholder="BWFS" />
            </FormGroup>
            <FormGroup label="Airport">
              <FormSelect
                value={form.airportId || ''}
                onChange={(v) => f('airportId', v)}
                options={airports.map((a) => ({
                  value: a.airportId,
                  label: `${a.iataCode ? `[${a.iataCode.trim()}] ` : ''}${a.name}`,
                }))}
                placeholder="Select airport…"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Contact Information">
          <FormRow>
            <FormGroup label="Email">
              <FormInput type="email" value={form.contactInfo.email} onChange={(v) => fc('email', v)} placeholder="ops@handler.com" />
            </FormGroup>
            <FormGroup label="Phone">
              <FormInput type="tel" value={form.contactInfo.phone} onChange={(v) => fc('phone', v)} placeholder="+91-11-4567-8900" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Website">
              <FormInput value={form.contactInfo.website} onChange={(v) => fc('website', v)} placeholder="https://www.handler.com" />
            </FormGroup>
            <FormGroup label="Address">
              <FormInput value={form.contactInfo.address} onChange={(v) => fc('address', v)} placeholder="Terminal 3, Airport" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Services & Certifications">
          <FormGroup label="Service Types">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
              {SERVICE_TYPES.map((svc) => (
                <label
                  key={svc}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    background: (form.attributes.serviceTypes || []).includes(svc)
                      ? 'var(--cyan-a3, rgba(0,200,200,0.15))'
                      : 'var(--bg-2)',
                    border: (form.attributes.serviceTypes || []).includes(svc)
                      ? '1px solid var(--cyan, #0cc)'
                      : '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(form.attributes.serviceTypes || []).includes(svc)}
                    onChange={() => toggleService(svc)}
                    style={{ width: 14, height: 14 }}
                  />
                  {svc}
                </label>
              ))}
            </div>
          </FormGroup>
          <FormRow>
            <FormGroup label="License No.">
              <FormInput value={form.attributes.licenseNo} onChange={(v) => fa('licenseNo', v)} placeholder="BCAS-2024-001" />
            </FormGroup>
            <FormGroup label="Certifications" hint="Comma-separated">
              <FormInput value={form.attributes.certifications} onChange={(v) => fa('certifications', v)} placeholder="ISAGO, ISO-9001" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormCheckbox label="Active" checked={form.active} onChange={(v) => f('active', v)} />
      </FormModal>
    </>
  );
}

