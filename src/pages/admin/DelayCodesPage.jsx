import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { AlertOctagon, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, {
  FormRow,
  FormGroup,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormSection,
} from '@/components/ui/FormModal';

import { DelayCodeAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole, getTenantId } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const CATEGORIES = ['Airline', 'Airport', 'ATC', 'Weather', 'Security', 'Government', 'Miscellaneous'];
const SUB_CATEGORIES = ['Equipment', 'Crew', 'Passenger', 'Baggage', 'Cargo', 'Catering', 'Fueling', 'Operations', 'Ramp', 'Technical'];
const IATA_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'Z'];

const EMPTY = {
  siteCode: '',
  numericCode: '',
  iataCode: '',
  description: '',
  isCarrier: false,
  attributes: { category: '', subCategory: '', iataGroup: '' },
  validFrom: '',
  validTo: '',
};

export default function DelayCodesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: pageData, isLoading, error, mutate } = useSWR(`/api/v1/delay-codes?page=${page}&size=${PAGE_SIZE}`, adminFetcher);
  const data = useMemo(() => (Array.isArray(pageData) ? pageData : pageData?.content || []), [pageData]);
  const totalPages = pageData?.totalPages ?? 1;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        (d.numericCode || '').toLowerCase().includes(q) ||
        (d.iataCode || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (d.attributes?.category || '').toLowerCase().includes(q) ||
        (d.siteCode || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const stats = [
    { label: 'Total Codes', value: data.length },
    { label: 'Carrier', value: data.filter((d) => d.isCarrier).length, color: 'var(--amber)' },
    { label: 'Non-Carrier', value: data.filter((d) => !d.isCarrier).length, color: 'var(--blue)' },
    { label: 'Categories', value: new Set(data.map((d) => d.attributes?.category).filter(Boolean)).size },
  ];

  const columns = [
    {
      key: 'numericCode',
      label: 'Code',
      width: '70px',
      render: (r) => (
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--amber)' }}>
          {r.numericCode || '—'}
        </span>
      ),
    },
    {
      key: 'iataCode',
      label: 'IATA',
      width: '70px',
      render: (r) => (r.iataCode ? <span className="badge badge-blue">{r.iataCode}</span> : '—'),
    },
    {
      key: 'siteCode',
      label: 'Site',
      width: '60px',
      render: (r) => (r.siteCode ? <span className="badge badge-slate">{r.siteCode}</span> : '—'),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'category',
      label: 'Category',
      width: '110px',
      render: (r) =>
        r.attributes?.category ? <span className="badge badge-violet">{r.attributes.category}</span> : '—',
    },
    {
      key: 'iataGroup',
      label: 'Group',
      width: '70px',
      render: (r) =>
        r.attributes?.iataGroup ? <span className="badge badge-cyan">{r.attributes.iataGroup}</span> : '—',
    },
    {
      key: 'isCarrier',
      label: 'Carrier',
      width: '80px',
      render: (r) =>
        r.isCarrier ? <span className="badge badge-amber">Carrier</span> : <span className="badge badge-slate">Non</span>,
    },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, attributes: { ...EMPTY.attributes } });
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const attr = row.attributes || {};
    setForm({
      siteCode: row.siteCode || '',
      numericCode: row.numericCode || '',
      iataCode: row.iataCode || '',
      description: row.description || '',
      isCarrier: row.isCarrier ?? false,
      attributes: {
        category: attr.category || '',
        subCategory: attr.subCategory || '',
        iataGroup: attr.iataGroup || '',
      },
      validFrom: row.validFrom || '',
      validTo: row.validTo || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const payload = {
      siteCode: form.siteCode || null,
      numericCode: form.numericCode,
      iataCode: form.iataCode || null,
      description: form.description,
      isCarrier: form.isCarrier,
      attributes: {
        category: form.attributes.category || null,
        subCategory: form.attributes.subCategory || null,
        iataGroup: form.attributes.iataGroup || null,
      },
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      tenantId: getTenantId(),
    };
    try {
      if (editing) {
        await DelayCodeAPI.update(editing.delayCodeId, payload);
        toast.success('Delay Code Updated', `${form.numericCode} has been updated`);
      } else {
        await DelayCodeAPI.create(payload);
        toast.success('Delay Code Created', `${form.numericCode} has been added`);
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
      const result = await DelayCodeAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Delay codes CSV uploaded successfully');
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
        title="Delay Codes"
        subtitle="IATA and custom delay codes for flight delay attribution and reporting"
        icon={<AlertOctagon size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="delayCodeId"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        addLabel="Add Delay Code"
        templateFile="delay-codes.csv"
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
        title={editing ? 'Edit Delay Code' : 'New Delay Code'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        width={560}
      >
        <FormSection title="Code Identity">
          <FormRow>
            <FormGroup label="Numeric Code" required hint="e.g. 11, 93">
              <FormInput value={form.numericCode} onChange={(v) => f('numericCode', v)} placeholder="11" required />
            </FormGroup>
            <FormGroup label="IATA Code" hint="IATA standard code">
              <FormInput value={form.iataCode} onChange={(v) => f('iataCode', v)} placeholder="11" />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Description" required>
              <FormInput
                value={form.description}
                onChange={(v) => f('description', v)}
                placeholder="Late aircraft - previous flight with same equipment"
                required
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Site Code" hint="Airport IATA e.g. DEL">
              <FormInput value={form.siteCode} onChange={(v) => f('siteCode', v)} placeholder="DEL" />
            </FormGroup>
            <FormGroup label="Carrier Delay">
              <div style={{ paddingTop: 6 }}>
                <FormCheckbox label="Is Carrier Delay" checked={form.isCarrier} onChange={(v) => f('isCarrier', v)} />
              </div>
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Classification">
          <FormRow>
            <FormGroup label="Category">
              <FormSelect
                value={form.attributes.category || ''}
                onChange={(v) => fa('category', v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="Select…"
              />
            </FormGroup>
            <FormGroup label="Sub-Category">
              <FormSelect
                value={form.attributes.subCategory || ''}
                onChange={(v) => fa('subCategory', v)}
                options={SUB_CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="Select…"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="IATA Group" hint="Delay group letter">
              <FormSelect
                value={form.attributes.iataGroup || ''}
                onChange={(v) => fa('iataGroup', v)}
                options={IATA_GROUPS.map((g) => ({ value: g, label: `Group ${g}` }))}
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
      </FormModal>
    </>
  );
}

