const TOKEN_KEY = 'rms_token';
const USER_KEY = 'rms_user';

export function setSession(session) {
  const token = session.accessToken || session.token;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(session));
}

export function getSession() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getTenantId() {
  const s = getSession();
  return s?.tenant_id || '';
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getUserRoles() {
  const s = getSession();
  if (s?.roles?.length) return s.roles;
  if (s?.role) return [s.role];
  if (s?.role_ids?.length) return s.role_ids;
  return [];
}

export function hasRole(role) {
  return getUserRoles().includes(role);
}

