import React, { useEffect, useMemo, useState } from "react";
import { listOvertimeAdjustments } from "../api-overtime";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";

// Deutsch lokalisieren
registerLocale("de", de);

// Helper
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function toDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtHM(mins) {
  const sign = mins < 0 ? "-" : "";
  const m = Math.abs(mins);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function minutesOverlap(start, end, dayStart, dayEnd) {
  if (!start) return 0;
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const realEnd = e || s; // wenn kein Ende: 0 Minuten
  const a = Math.max(s.getTime(), dayStart.getTime());
  const b = Math.min(realEnd.getTime(), dayEnd.getTime());
  return b > a ? Math.floor((b - a) / 60000) : 0;
}

export default function Zeitmanagement({ auth, isAdmin, users = [], entries = [], absences = [] }) {
  // Monat auf den 1. des aktuellen Monats
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Admin: Benutzerwahl ("ALL" = alle Mitarbeiter aggregiert)
  const [selectedUser, setSelectedUser] = useState("ALL");

  const activeUserId = useMemo(() => {
    if (isAdmin) return selectedUser === "ALL" ? null : Number(selectedUser);
    return auth?.userId ?? null;
  }, [isAdmin, selectedUser, auth]);

  const rangeStart = useMemo(() => startOfMonth(month), [month]);
  const rangeEnd = useMemo(() => endOfMonth(month), [month]);

  // Anzeigename/Avatar
  const userInfo = useMemo(() => {
    if (isAdmin) {
      if (selectedUser === "ALL") {
        return { name: "Alle Mitarbeiter", imageUrl: null };
      }
      const u = users.find(u => String(u.id) === String(selectedUser));
      if (u) return { name: u.username, imageUrl: u.imageUrl };
      return { name: "Unbekannt", imageUrl: null };
    }
    return { name: auth?.username, imageUrl: auth?.imageUrl };
  }, [isAdmin, selectedUser, users, auth]);

  // Tage des Monats
  const monthDays = useMemo(() => {
    const days = [];
    const y = month.getFullYear();
    const m = month.getMonth();
    const d0 = new Date(y, m, 1);
    const d1 = new Date(y, m + 1, 0);
    for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
  }, [month]);

  // Gefilterte Daten nach aktivem Benutzer (oder alle)
  const byUserEntries = useMemo(() => {
    if (activeUserId == null) return isAdmin ? entries : entries.filter(e => e.userId === auth?.userId);
    return entries.filter(e => e.userId === activeUserId);
  }, [entries, activeUserId, isAdmin, auth]);
  const byUserAbsences = useMemo(() => {
    if (activeUserId == null) return isAdmin ? absences : absences.filter(a => a.userId === auth?.userId);
    return absences.filter(a => a.userId === activeUserId);
  }, [absences, activeUserId, isAdmin, auth]);

  // Zeilen berechnen
  const rows = useMemo(() => {
    const r = [];
    for (const day of monthDays) {
      const dStart = startOfDay(day);
      const dEnd = endOfDay(day);
      const weekday = day.getDay(); // 0 So, 6 Sa
      // Soll: 8h an Werktagen ohne genehmigte Abwesenheit, sonst 0
      let soll = (weekday >= 1 && weekday <= 5) ? 8 * 60 : 0;
      const hasApprovedAbsence = byUserAbsences.some(a => {
        if (a.status !== "APPROVED") return false;
        const s = a.startDate ? new Date(a.startDate) : null;
        const e = a.endDate ? new Date(a.endDate) : s;
        if (!s) return false;
        // Überlappung
        return !(e < dStart || s > dEnd);
      });
      if (hasApprovedAbsence) soll = 0;

      // Ist: Minuten-Überlappung aus Einträgen
      const ist = byUserEntries.reduce((acc, e) => acc + minutesOverlap(e.start, e.end, dStart, dEnd), 0);
      r.push({ key: toDayKey(day), date: new Date(day), soll, ist, saldo: ist - soll });
    }
    return r;
  }, [monthDays, byUserEntries, byUserAbsences]);

  const totals = useMemo(() => {
    const ist = rows.reduce((a, it) => a + it.ist, 0);
    const soll = rows.reduce((a, it) => a + it.soll, 0);
    return { ist, soll, saldo: ist - soll };
  }, [rows]);

  // Kompensationen (Überstunden-Ausgleich)
  const [adjustments, setAdjustments] = useState([]);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const opts = isAdmin && activeUserId ? { userId: activeUserId } : {};
        const data = await listOvertimeAdjustments(auth?.token, opts);
        if (!ignore) setAdjustments(Array.isArray(data) ? data : []);
      } catch { setAdjustments([]); }
    })();
    return () => { ignore = true; };
  }, [auth, isAdmin, activeUserId]);

  const monthCompMinutes = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    return adjustments.reduce((sum, a) => {
      if (!a || !a.date) return sum; // ohne Datum nicht monatsgenau
      const d = new Date(a.date + 'T00:00:00');
      if (d.getFullYear() === y && d.getMonth() === m) return sum + (a.minutes || 0);
      return sum;
    }, 0);
  }, [adjustments, month]);

  // Wöchentliche Summen (Montag-Sonntag)
  const weeks = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const d = r.date;
      const day = d.getDay(); // 0 So
      const diffToMonday = (day + 6) % 7; // 0=Mo
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMonday);
      const key = monday.toISOString().slice(0,10);
      const cur = map.get(key) || { ist:0, soll:0, saldo:0, start: new Date(monday) };
      cur.ist += r.ist; cur.soll += r.soll; cur.saldo += r.saldo;
      map.set(key, cur);
    }
    return Array.from(map.entries()).sort((a,b)=>b[0].localeCompare(a[0])).map(([k,v])=>({ key:k, ...v }));
  }, [rows]);

  function prevMonth() { setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  function nextMonth() { setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }

  return (
    <div className="dashboard-card" style={{ padding: "1.2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ color: "var(--color-accent)", margin: 0 }}>Zeitmanagement</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
  <button className="btn-secondary" onClick={prevMonth} style={{ padding: '0.35em 0.7em', fontSize: '0.9em' }}>◀</button>
        <DatePicker
          selected={month}
          onChange={d => d && setMonth(new Date(d.getFullYear(), d.getMonth(), 1))}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="input datepicker-input"
          calendarClassName="dashboard-datepicker"
          locale="de"
        />
  <button className="btn-secondary" onClick={nextMonth} style={{ padding: '0.35em 0.7em', fontSize: '0.9em' }}>▶</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label htmlFor="zm-user" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Mitarbeiter:</label>
            <select
              id="zm-user"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="input"
              style={{ maxWidth: 260 }}
            >
              <option value="ALL">Alle</option>
              {users.map(u => (
                <option key={u.id} value={String(u.id)}>{u.username}</option>
              ))}
            </select>
          </div>
        )}
        {userInfo && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {userInfo.imageUrl ? (
              <img src={userInfo.imageUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)" }} />
            ) : (
              <span style={{ width: 36, height: 36, display: "inline-block", borderRadius: "50%", background: "#222", color: "#fff", textAlign: "center", lineHeight: "36px" }}>👤</span>
            )}
            <span style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "1.08em" }}>{userInfo.name}</span>
          </div>
        )}
      </div>

      <div className="table-scroll-3" style={{ maxHeight: 420, overflowY: "auto" }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Soll</th>
              <th>Ist</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td>{new Date(r.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                <td>{fmtHM(r.soll)}</td>
                <td>{fmtHM(r.ist)}</td>
                <td style={{ color: r.saldo < 0 ? "#e74c3c" : r.saldo > 0 ? "#2ecc71" : "inherit", fontWeight: 600 }}>{fmtHM(r.saldo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 700 }}>Summe</td>
              <td style={{ fontWeight: 700 }}>{fmtHM(totals.soll)}</td>
              <td style={{ fontWeight: 700 }}>{fmtHM(totals.ist)}</td>
              <td style={{ fontWeight: 700, color: totals.saldo < 0 ? "#e74c3c" : totals.saldo > 0 ? "#2ecc71" : "inherit" }}>{fmtHM(totals.saldo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Wochenzusammenfassung */}
      <div style={{ marginTop: 16 }}>
        <div style={{ color:'var(--color-accent)', fontWeight:700, margin:'0 0 8px 0' }}>Wochensummen</div>
        <div className="table-scroll-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Woche ab</th>
                <th>Soll</th>
                <th>Ist</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(w => (
                <tr key={w.key}>
                  <td>{new Date(w.start).toLocaleDateString('de-DE')}</td>
                  <td>{fmtHM(w.soll)}</td>
                  <td>{fmtHM(w.ist)}</td>
                  <td style={{ fontWeight:600, color: w.saldo < 0 ? '#e74c3c' : w.saldo > 0 ? '#2ecc71' : 'inherit' }}>{fmtHM(w.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Überstunden / Kompensiert (Monat) */}
      <div style={{ marginTop: 16, display:'flex', gap:24, flexWrap:'wrap' }}>
        <div style={{ background:'var(--color-bg-card)', padding:'0.8rem 1rem', borderRadius:12, boxShadow:'0 2px 12px 0 var(--color-shadow)' }}>
          <div style={{ color:'var(--color-accent2)', fontWeight:600 }}>Überstunden (kumuliert, Monat)</div>
          <div style={{ fontWeight:800, fontSize:'1.1em' }}>{fmtHM(totals.saldo)}</div>
        </div>
        <div style={{ background:'var(--color-bg-card)', padding:'0.8rem 1rem', borderRadius:12, boxShadow:'0 2px 12px 0 var(--color-shadow)' }}>
          <div style={{ color:'var(--color-accent2)', fontWeight:600 }}>Kompensiert (Monat)</div>
          <div style={{ fontWeight:800, fontSize:'1.1em' }}>{fmtHM(monthCompMinutes)}</div>
        </div>
        <div style={{ background:'var(--color-bg-card)', padding:'0.8rem 1rem', borderRadius:12, boxShadow:'0 2px 12px 0 var(--color-shadow)' }}>
          <div style={{ color:'var(--color-accent2)', fontWeight:600 }}>Offen</div>
          <div style={{ fontWeight:800, fontSize:'1.1em', color: (totals.saldo - monthCompMinutes) < 0 ? '#e74c3c' : '#2ecc71' }}>{fmtHM(totals.saldo - monthCompMinutes)}</div>
        </div>
      </div>
    </div>
  );
}
