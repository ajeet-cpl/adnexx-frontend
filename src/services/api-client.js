// ADNexx API Client — Master Data CRUD All endpoints: /api/v1/*
import env from '@/config/env';
import { getToken, getTenantId, clearSession } from '@/utils/auth';

const API_BASE = env.API_URL;


// Helpers
function buildHeaders() {
  const token = getToken();
  const tenantId = getTenantId();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
  };
}

function buildQuery(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size) q.set('size', String(params.size));
  if (params.per_page) q.set('per_page', String(params.per_page));
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  if (params.search) q.set('search', params.search);
  if (params.is_active !== undefined) q.set('is_active', String(params.is_active));
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function req(path, init = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers || {}) },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || j.error || msg;
    } catch {
      // ignore json parse errors
    }

    if (res.status === 401) {
      clearSession();
      // Use replace-state so the back button doesn't loop
      window.history.replaceState(null, '', '/login');
      window.dispatchEvent(new Event('unauthorized'));
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined;
  const json = await res.json();
  // Unwrap standard { success, data } envelope if present
  return json && json.data !== undefined ? json.data : json;
}

export const adminFetcher = (url) => req(url);

// --------------------------------------------------------------------------
// CRUD Factory
// --------------------------------------------------------------------------
function makeCrud(base) {
  return {
    list: (p) => req(`${base}${buildQuery(p)}`),
    get: (id) => req(`${base}/${id}`),
    create: (b) => req(base, { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b) => req(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id) => req(`${base}/${id}`, { method: 'DELETE' }),
  };
}

// Resource APIs
export const TenantAPI = {
  ...makeCrud('/api/v1/tenants'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/tenants/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const CountryAPI = {
  ...makeCrud('/api/v1/countries'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/countries/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const AirlineAPI = {
  ...makeCrud('/api/v1/airlines'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/airlines/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      const json = await res.json();
      return json;
    });
  },
};
export const AirportAPI = {
  ...makeCrud('/api/v1/airports'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/airports/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const AircraftTypeAPI = {
  ...makeCrud('/api/v1/aircraft-types'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/aircraft-types/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const TerminalAPI = {
  ...makeCrud('/api/v1/terminals'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/terminals/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const GateAPI = {
  ...makeCrud('/api/v1/gates'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/gates/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const StandAPI = {
  ...makeCrud('/api/v1/stands'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/stands/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const RunwayAPI = {
  ...makeCrud('/api/v1/runways'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/runways/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const BeltAPI = {
  ...makeCrud('/api/v1/baggage-belts'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/baggage-belts/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const CheckinDeskAPI = {
  ...makeCrud('/api/v1/checkin-desks'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/checkin-desks/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const GroundHandlerAPI = {
  ...makeCrud('/api/v1/ground-handlers'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/ground-handlers/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};
export const DelayCodeAPI = {
  ...makeCrud('/api/v1/delay-codes'),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/delay-codes/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};

export const UserAPI = {
  ...makeCrud('/api/v1/users'),
  resetPassword: (id, newPassword, confirmPassword) =>
    req(`/api/v1/auth/admin/reset-password/${id}`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, confirmPassword }),
    }),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const tenantId = getTenantId();
    return fetch(`${API_BASE}/api/v1/users/bulk-upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
        if (res.status === 401) window.location.href = '/login';
        throw new Error(msg);
      }
      if (res.status === 204) return undefined;
      return res.json();
    });
  },
};

