import React, { useState } from "react";

function fmt(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("de-DE");
}

function badgeClass(type, note, hasATest) {
  const t = (type || '').toLowerCase();
  const n = (note || '').toLowerCase();
  if (t.startsWith('krank')) {
    const a = hasATest === true ? true : (n.includes('a-test') || n.includes('a test') || n.includes('atest') || n.includes('a‑test'));
    return a ? 'badge badge-orange' : 'badge badge-red';
  }
  if (t.startsWith('urlaub')) return 'badge badge-blue';
  if (t.startsWith('sonderurlaub')) return 'badge badge-green';
  return 'badge';
}

function illnessDisplay(type, hasATest) {
  const t = (type || '').toLowerCase();
  if (!t.startsWith('krank')) return type;
  return hasATest ? 'Krank mit A-test' : 'Krank- ohne A-test';
}

export default function AbsenceList({ items = [], onDelete, highlightId, statusFilter: controlledStatus, onStatusFilterChange }) {
  const isReadOnly = !onDelete;
  const [uncontrolledStatus, setUncontrolledStatus] = useState('ALLE');
  const statusFilter = (typeof controlledStatus === 'string') ? controlledStatus : uncontrolledStatus;

  if (!items.length) {
    return (
      <div className="bg-card text-accent border border-accent/20 rounded-lg p-4 text-center">
        Noch keine Abwesenheiten.
      </div>
    );
  }

  function statusLabel(status) {
    if (status === 'APPROVED') return 'genehmigt';
    if (status === 'PENDING') return 'wird überprüft';
    if (status === 'REJECTED') return 'abgelehnt';
    return status || '';
  }

  const statusOptions = [
    { value: 'ALLE', label: 'Alle' },
    { value: 'APPROVED', label: 'genehmigt' },
    { value: 'REJECTED', label: 'abgelehnt' },
    { value: 'PENDING', label: 'wird überprüft' },
  ];

  const filtered = statusFilter === 'ALLE' ? items : items.filter(a => a.status === statusFilter);

  return (
    <div>
      <div className="table-scroll-3">
        <table className="dashboard-table">
          <thead>
            <tr>
              {isReadOnly ? null : <th>Benutzer</th>}
              <th>Art</th>
              <th>Start</th>
              <th>Ende</th>
              <th>Notiz</th>
              <th>Status</th>
              {isReadOnly ? null : <th style={{ width: 120 }}>Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className={highlightId != null && a.id === highlightId ? 'row-highlight' : ''}>
                {isReadOnly ? null : <td>{a.username || a.userName || a.user_name || a.userId || a.user_id || ''}</td>}
                <td>
                  <span className={badgeClass(a.type, a.note, a.hasATest)}>{illnessDisplay(a.type, a.hasATest)}</span>
                </td>
                <td>{fmt(a.startDate)}</td>
                <td>{fmt(a.endDate)}</td>
                <td>{a.note}</td>
                <td>{statusLabel(a.status)}</td>
                {isReadOnly ? null : (
                  <td>
                    <button className="btn-danger" onClick={() => onDelete(a.id)}>Löschen</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
