import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Users, KeyRound, Upload } from 'lucide-react';

import MasterPage from '@/components/ui/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/ui/FormModal';
import { UserAPI, adminFetcher } from '@/services/api-client';
import { toast } from '@/utils/toast';
import { hasRole } from '@/utils/auth';
import { PAGE_SIZE } from '@/config/env';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'];
const ROLE_COLOR = {
  ADMIN: 'badge-amber',
  OPERATOR: 'badge-blue',
  VIEWER: 'badge-slate',
};

const ROLE_ID_MAP = { ADMIN: 1, OPERATOR: 2, VIEWER: 3 };
const ID_ROLE_MAP = Object.fromEntries(Object.entries(ROLE_ID_MAP).map(([k, v]) => [v, k]));

const EMPTY = { username: '', email: '', first_name: '', last_name: '', phone_number: '', role_ids: [2] };

function getRoles(u) {
  if (u.role_ids?.length) return u.role_ids.map((id) => ID_ROLE_MAP[id]).filter(Boolean);
  if (u.roles?.length) return u.roles;
  if (u.role) return [u.role];
  return ['OPERATOR'];
}
function getRole(u) { return getRoles(u)[0] || 'OPERATOR'; }
function getFullName(u) { return [u.first_name || u.firstName, u.last_name || u.lastName].filter(Boolean).join(' ') || u.full_name || u.fullName || u.username; }
function isActive(u) { return u.is_active ?? u.isActive ?? u.active ?? u.enabled ?? true; }

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetModal, setResetModal] = useState(null);  // holds user row
  const [resetPwd, setResetPwd] = useState('');
  const [resetConfirmPwd, setResetConfirmPwd] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const swrKey = `/api/v1/users?page=${page}&size=${PAGE_SIZE}&sortBy=id&sortDir=asc`;
  const { data: pageData, isLoading, error, mutate } = useSWR(swrKey, adminFetcher);

  // Support both paginated response { content, totalPages, ... } and plain array
  const rows = Array.isArray(pageData) ? pageData : (pageData?.content ?? []);
  const totalPages = pageData?.totalPages ?? 1;

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || getFullName(u).toLowerCase().includes(q));
  }, [rows, search]);

  const stats = [
    { label: 'Total Users', value: pageData?.totalElements ?? rows.length },
    { label: 'Active', value: rows.filter((u) => isActive(u)).length, color: 'var(--green)' },
    { label: 'Admins', value: rows.filter((u) => { const rs = getRoles(u); return rs.includes('ADMIN') || rs.includes('SUPER_ADMIN'); }).length, color: 'var(--amber)' },
    { label: 'Operators', value: rows.filter((u) => getRoles(u).includes('OPERATOR')).length, color: 'var(--blue)' },
  ];

  const columns = [
    {
      key: 'first_name',
      label: 'User',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.84rem' }}>{getFullName(r)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.username}</div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (r) => <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{r.email}</span> },
    {
      key: 'role',
      label: 'Role',
      width: '180px',
      render: (r) => {
        const roles = getRoles(r);
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {roles.map((role) => (
              <span key={role} className={`badge ${ROLE_COLOR[role] || 'badge-slate'}`}>{role.replace('_', ' ')}</span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'last_login_at',
      label: 'Last Login',
      width: '140px',
      render: (r) => {
        const lastLogin = r.last_login_at || r.lastLoginAt;
        return lastLogin ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {new Date(lastLogin).toLocaleDateString()}
          </span>
        ) : (
          <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>Never</span>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '80px',
      render: (r) => {
        const active = isActive(r);
        return <span className={`badge ${active ? 'badge-green' : 'badge-slate'}`}>{active ? 'Active' : 'Inactive'}</span>;
      },
    },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setPassword('');
    setConfirmPassword('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    const role = getRole(row);
    setForm({
      username: row.username,
      email: row.email,
      first_name: row.first_name || row.firstName || '',
      last_name: row.last_name || row.lastName || '',
      phone_number: row.phone_number || row.phoneNumber || '',
      role_ids: row.role_ids?.length ? [...row.role_ids] : [ROLE_ID_MAP[role] || 2],
    });
    setPassword('');
    setConfirmPassword('');
    setModalOpen(true);
  }

  async function handleToggle(row) {
    const id = row.user_id || row.userId || row.id;
    const active = isActive(row);
    try {
      await UserAPI.update(id, { is_active: !active, active: !active, enabled: !active });
      toast.success('Status Updated', `${row.username} is now ${!active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      const payload = {
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        role_ids: form.role_ids,
        ...(password ? { password } : {}),
      };
      if (password && password !== confirmPassword) {
        toast.error('Validation Error', 'Passwords do not match');
        return;
      }
      if (editing) {
        const id = editing.user_id || editing.userId || editing.id;
        await UserAPI.update(id, payload);
        toast.success('User Updated', `${form.username} has been updated`);
      } else {
        if (!password) {
          toast.error('Create Failed', 'Password is required for new users');
          return;
        }
        await UserAPI.create(payload);
        toast.success('User Created', `${form.username} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  async function handleResetPassword() {
    if (!resetPwd || !resetConfirmPwd) {
      toast.error('Validation Error', 'Both password fields are required');
      return;
    }
    if (resetPwd !== resetConfirmPwd) {
      toast.error('Validation Error', 'Passwords do not match');
      return;
    }
    const id = resetModal.user_id || resetModal.userId || resetModal.id;
    try {
      await UserAPI.resetPassword(id, resetPwd, resetConfirmPwd);
      toast.success('Password Reset', `Password has been reset for ${resetModal.username}`);
      setResetModal(null);
      setResetPwd('');
      setResetConfirmPwd('');
    } catch (e) {
      toast.error('Reset Failed', e instanceof Error ? e.message : 'Failed to reset password');
    }
  }

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleBulkUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await UserAPI.bulkUpload(file);
      toast.success('Bulk Upload Complete', result?.message || 'Users CSV uploaded successfully');
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
        title="Users"
        subtitle="Platform user accounts — roles, access control and authentication"
        icon={<Users size={18} color="#fff" />}
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error?.message}
        idKey="id"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => mutate()}
        onAdd={openAdd}
        onEdit={openEdit}
        onToggle={handleToggle}
        hasToggle
        activeKey="is_active"
        addLabel="Add User"
        templateFile="users.csv"
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
        renderExtraActions={(row) => (
          <button
            className="action-btn"
            title="Reset Password"
            onClick={() => { setResetModal(row); setResetPwd(''); setResetConfirmPwd(''); }}
          >
            <KeyRound size={13} />
          </button>
        )}
      />

      <FormModal title={editing ? 'Edit User' : 'New User'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={580}>
        <FormSection title="Account Info">
          <FormRow>
            <FormGroup label="First Name" required>
              <FormInput value={form.first_name} onChange={(v) => f('first_name', v)} placeholder="Jane" required />
            </FormGroup>
            <FormGroup label="Last Name" required>
              <FormInput value={form.last_name} onChange={(v) => f('last_name', v)} placeholder="Doe" required />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Username" required>
              <FormInput value={form.username} onChange={(v) => f('username', v)} placeholder="jane_doe" required />
            </FormGroup>
            <FormGroup label="Email" required>
              <FormInput type="email" value={form.email} onChange={(v) => f('email', v)} placeholder="jane@airport.com" required />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Phone Number">
              <FormInput value={form.phone_number} onChange={(v) => f('phone_number', v)} placeholder="+9876543210" />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title="Access Control">
          <FormGroup label="Roles" required>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', paddingTop: 4 }}>
              {ROLES.map((role) => {
                const rid = ROLE_ID_MAP[role];
                const checked = form.role_ids?.includes(rid) || false;
                return (
                  <FormCheckbox
                    key={role}
                    label={role.replace('_', ' ')}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? form.role_ids.filter((id) => id !== rid)
                        : [...(form.role_ids || []), rid];
                      f('role_ids', next.length ? next : [rid]);
                    }}
                  />
                );
              })}
            </div>
          </FormGroup>
        </FormSection>

        {!editing && (
          <FormSection title="Password">
            <FormRow>
              <FormGroup label="Password" required>
                <FormInput type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" required />
              </FormGroup>
              <FormGroup label="Confirm Password" required>
                <FormInput type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" required />
              </FormGroup>
            </FormRow>
            {password && confirmPassword && password !== confirmPassword && (
              <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: 4 }}>Passwords do not match</div>
            )}
          </FormSection>
        )}

      </FormModal>

      {/* Reset Password Modal */}
      <FormModal
        title="Reset Password"
        subtitle={resetModal ? `Reset password for ${resetModal.username}` : ''}
        open={!!resetModal}
        onClose={() => { setResetModal(null); setResetPwd(''); setResetConfirmPwd(''); }}
        onSubmit={handleResetPassword}
        width={440}
      >
        <FormSection title="New Password">
          <FormRow cols={1}>
            <FormGroup label="New Password" required>
              <FormInput type="password" value={resetPwd} onChange={setResetPwd} placeholder="Min. 8 characters" required />
            </FormGroup>
          </FormRow>
          <FormRow cols={1}>
            <FormGroup label="Confirm Password" required>
              <FormInput type="password" value={resetConfirmPwd} onChange={setResetConfirmPwd} placeholder="Re-enter password" required />
            </FormGroup>
          </FormRow>
          {resetPwd && resetConfirmPwd && resetPwd !== resetConfirmPwd && (
            <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: 4 }}>Passwords do not match</div>
          )}
        </FormSection>
      </FormModal>
    </>
  );
}

