import { fetchWithRetry } from './api';

// API für WorkSession-Status-Update (Bestätigung)
export async function confirmWorkSession(id, token) {
  const res = await fetchWithRetry(`/api/worksessions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status: 'bestätigt' })
  });
  return await res.json();
}

// Alle offenen Sessions (Admin): filtert endTime == null
export async function fetchOpenWorkSessions(token) {
  const res = await fetchWithRetry('/api/worksessions', {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const data = await res.json();
  return Array.isArray(data) ? data.filter(s => !s.endTime) : [];
}
