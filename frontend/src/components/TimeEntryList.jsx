import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("de", de);

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function TimeEntryList({ entries, onEdit, onDelete, highlightId=null, isAdmin=false, users=[] }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState(null);
  const [rowError, setRowError] = useState(null);

  function startEdit(idx, entry) {
    setEditingIdx(idx);
    setDraft({ ...entry, start: entry.start ? new Date(entry.start) : null, end: entry.end ? new Date(entry.end) : null });
  }
  function cancelEdit() {
    setEditingIdx(null);
    setDraft(null);
    setRowError(null);
  }
  async function saveEdit(idx) {
    if (!draft) return;
    const payload = {
      ...draft,
      start: draft.start ? new Date(draft.start).toISOString() : null,
      end: draft.end ? new Date(draft.end).toISOString() : null,
    };
    try {
      await onEdit(entries[idx].id, payload);
      setEditingIdx(null);
      setDraft(null);
      setRowError(null);
    } catch (e) {
      setRowError(typeof e?.message === 'string' ? e.message : 'Speichern fehlgeschlagen');
    }
  }
  if (!entries.length)
    return <div className="bg-card text-accent border border-accent/20 rounded-lg p-4 text-center">Noch keine Einträge.</div>;
  const isReadOnly = !onEdit && !onDelete;
  return (
    <div className="table-scroll-3">
    <table className="dashboard-table">
      <thead>
        <tr>
          {isAdmin && <th>Mitarbeiter</th>}
          <th>Start</th>
          <th>Ende</th>
          <th>Kategorie</th>
          <th>Notiz</th>
          {isReadOnly ? null : <th style={{width:120}}>Aktionen</th>}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, idx) => {
          const isEditing = editingIdx === idx;
          const isHighlight = highlightId != null && entry.id === highlightId;
          return (
            <tr key={entry.id ?? idx} className={isHighlight ? 'row-highlight' : ''}>
              {isAdmin && <td>{users.find(u => u.id === entry.userId)?.username || entry.username || ''}</td>}
              <td>
                {isEditing ? (
                  <DatePicker
                    selected={draft?.start || null}
                    onChange={(v) => setDraft({ ...draft, start: v })}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="Pp"
                    className="input datepicker-input"
                    calendarClassName="dashboard-datepicker"
                    locale="de"
                    isClearable
                  />
                ) : (
                  formatDate(entry.start)
                )}
              </td>
              <td>
                {isEditing ? (
                  <DatePicker
                    selected={draft?.end || null}
                    onChange={(v) => setDraft({ ...draft, end: v })}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="Pp"
                    className="input datepicker-input"
                    calendarClassName="dashboard-datepicker"
                    locale="de"
                    isClearable
                  />
                ) : (
                  formatDate(entry.end)
                )}
              </td>
              <td>
                {isEditing ? (
                  <input className="input" value={draft?.category || ""} onChange={(e)=> setDraft({...draft, category: e.target.value})} />
                ) : (
                  entry.category
                )}
              </td>
              <td>
                {isEditing ? (
                  <input className="input" value={draft?.note || ""} onChange={(e)=> setDraft({...draft, note: e.target.value})} />
                ) : (
                  entry.note
                )}
              </td>
              {isReadOnly ? null : <td>
                {isEditing ? (
                  <>
                    <button className="btn-primary" onClick={() => saveEdit(idx)}>Speichern</button>
                    <button className="btn-secondary" onClick={cancelEdit}>Abbrechen</button>
                    {rowError && <div style={{color:'#e74c3c', marginTop:6}}>{rowError}</div>}
                  </>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => startEdit(idx, entry)}>Bearbeiten</button>
                    <button className="btn-danger" onClick={() => onDelete(entry.id)}>Löschen</button>
                  </>
                )}
              </td>}
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
