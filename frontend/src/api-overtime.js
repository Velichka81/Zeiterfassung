export async function addOvertimeAdjustment(token, { userId, date, minutes, type, note }) {
  const r = await fetch('/api/overtime/adjustments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId, date, minutes, type, note })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listOvertimeAdjustments(token, { userId } = {}) {
  const url = userId ? `/api/overtime/adjustments?userId=${encodeURIComponent(userId)}` : '/api/overtime/adjustments';
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
