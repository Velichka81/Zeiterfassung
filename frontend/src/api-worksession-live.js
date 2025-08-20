// Liefert alle offenen WorkSessions für alle User (Admin-API)
export async function fetchOpenWorkSessions(token) {
  const res = await fetch('/api/worksessions', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Nur Sessions ohne endTime zurückgeben
  return Array.isArray(data) ? data.filter(s => !s.endTime) : [];
}
