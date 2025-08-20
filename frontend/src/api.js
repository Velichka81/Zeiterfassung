// Set user image (Admin only)
export async function setUserImage(id, imageUrl, token) {
  const res = await fetchWithRetry(`/api/admin/users/${id}/image`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ imageUrl })
  });
  return await res.json();
}

export async function uploadUserImage(id, file, token) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetchWithRetry(`/api/admin/users/${id}/image`, {
    method: 'POST',
    body: fd,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  return await res.json();
}
// API helper für Zeiterfassung
// Dev: Relativer Pfad nutzt Vite-Proxy (/api -> 8082)
const API_URL = '/api/entries';

function authBaseUrl() {
  try {
    const { protocol, hostname, port } = window.location || {};
    // Im Vite-Dev (Port 5173) direkt Backend ansprechen (gleicher Host, Port 8082)
    if (String(port) === '5173') {
      return `${protocol}//${hostname}:8082`;
    }
  } catch { /* noop */ }
  return '';
}

function authHeaders() {
  // Primär aus 'auth' lesen, Fallback: legacy 'token'
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    }
  } catch { /* ignore */ }
  const legacy = localStorage.getItem('token');
  return legacy ? { Authorization: `Bearer ${legacy}` } : {};
}

export async function fetchWithRetry(url, options = {}, retries = 4, delayMs = 400) {
  // Optional Auth-Header unterdrücken (für /api/auth/*)
  const includeAuth = !options.skipAuth;
  const baseAuth = includeAuth ? authHeaders() : {};
  // WICHTIG: Explizit gesetzte Header sollen Vorrang haben
  const merged = { ...options, headers: { ...baseAuth, ...(options.headers || {}) } };
  // interne Option nicht weiterreichen
  delete merged.skipAuth;

  try {
    const res = await fetch(url, merged);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status} ${res.statusText}${text ? ' - ' + text : ''}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    return res;
  } catch (err) {
    // Fallback: Wenn Proxy (5173) nicht erreichbar ist und es sich um Auth-Endpunkte handelt,
    // direkt gegen das Backend (8082) anfragen, CORS ist auf /api/auth/** erlaubt.
    const isNetworkErr = !('status' in (err || {}));
    const isAuthEndpoint = typeof url === 'string' && url.startsWith('/api/auth/');
    if (isNetworkErr && isAuthEndpoint) {
      const directUrl = `http://localhost:8082${url}`;
      const res = await fetch(directUrl, merged).catch(() => null);
      if (res && res.ok) return res;
      if (res && !res.ok) {
        const text = await res.text().catch(() => '');
        const e2 = new Error(`HTTP ${res.status} ${res.statusText}${text ? ' - ' + text : ''}`);
        e2.status = res.status; e2.body = text; throw e2;
      }
    }
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, delayMs));
    return fetchWithRetry(url, options, retries - 1, Math.min(delayMs * 2, 4000));
  }
}

export async function fetchEntries() {
  const res = await fetchWithRetry(API_URL);
  return await res.json();
}

export async function addEntry(entry) {
  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return await res.json();
}

export async function updateEntry(id, entry) {
  const res = await fetchWithRetry(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return await res.json();
}

export async function removeEntry(id) {
  await fetchWithRetry(`${API_URL}/${id}`, { method: 'DELETE' });
}

// Timer-API entfernt

// Absences API
const ABSENCE_URL = '/api/absences';
export async function fetchAbsences() {
  const res = await fetchWithRetry(ABSENCE_URL);
  return await res.json();
}
export async function addAbsence(abs) {
  const res = await fetchWithRetry(ABSENCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(abs),
  });
  return await res.json();
}
export async function updateAbsence(id, abs) {
  const res = await fetchWithRetry(`${ABSENCE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(abs),
  });
  return await res.json();
}
export async function removeAbsence(id) {
  await fetchWithRetry(`${ABSENCE_URL}/${id}`, { method: 'DELETE' });
}

// Auth API
// Admin API
export async function fetchAdminUsers(token) {
  const res = await fetchWithRetry('/api/admin/users', {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  return await res.json();
}

// Admin: set work model
export async function setUserWorkModel(id, payload, token){
  const res = await fetchWithRetry(`/api/admin/users/${id}/work-model`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

// Optional: allowances helpers used by MitarbeiterVerwaltung
export async function getUserAllowances(year, userId, token){
  const res = await fetchWithRetry(`/api/admin/allowances/${year}/user/${userId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  return await res.json();
}
export async function setUserAllowances(year, userId, map, token){
  const res = await fetchWithRetry(`/api/admin/allowances/${year}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(map)
  });
  return await res.json();
}

// Admin Allowances API
export async function fetchAllowances(year) {
  const res = await fetchWithRetry(`/api/admin/allowances/${year}`);
  return await res.json();
}
export async function fetchUserAllowances(year, userId) {
  const res = await fetchWithRetry(`/api/admin/allowances/${year}/user/${userId}`);
  return await res.json();
}
export async function upsertUserAllowances(year, userId, map) {
  // map: { Urlaub: number, Krank: number, Sonderurlaub: number }
  const res = await fetchWithRetry(`/api/admin/allowances/${year}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(map)
  });
  return await res.json();
}
export async function clearUserAllowances(year, userId) {
  await fetchWithRetry(`/api/admin/allowances/${year}/user/${userId}`, { method: 'DELETE' });
}

export async function createAdminUser({ username, password, role }, token) {
  const res = await fetchWithRetry('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ username, password, role })
  });
  return await res.json();
}

export async function setUserRole(id, role, token) {
  const res = await fetchWithRetry(`/api/admin/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ role })
  });
  return await res.json();
}
export async function login(username, password) {
  const base = authBaseUrl();
  const res = await fetchWithRetry(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}
export async function register(username, password) {
  const base = authBaseUrl();
  const res = await fetchWithRetry(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}
