import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import { fetchAdminUsers } from "./api";
import AuthPanel from "./components/AuthPanel";
import TimeEntryForm from "./components/TimeEntryForm";
import TimeEntryList from "./components/TimeEntryList";
import { fetchEntries, addEntry as apiAddEntry, updateEntry as apiUpdateEntry, removeEntry as apiRemoveEntry, fetchAbsences, addAbsence as apiAddAbsence, removeAbsence as apiRemoveAbsence } from "./api";
import AbsenceForm from "./components/AbsenceForm";
import AbsenceList from "./components/AbsenceList";
import CalendarBoard from "./components/CalendarBoard";
import AdminPanel from "./components/AdminPanel";
import MitarbeiterVerwaltung from "./components/MitarbeiterVerwaltung";
import Zeitmanagement from "./components/Zeitmanagement";
import LiveStempeluhr from "./components/LiveStempeluhr";
import WorkSessionList from "./components/WorkSessionList";
import AbsenceOverview from "./components/AbsenceOverview";

// Datepicker-Locale einmalig registrieren
registerLocale("de", de);

// SidebarUserInfo muss vor App stehen!

function SidebarUserInfo({ auth }) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!auth?.username) return;
    // Für Admin: Bild aus Admin-API, für User: Bild aus /api/auth/me
    if (auth.role === 'ADMIN') {
      fetchAdminUsers(auth.token).then(users => {
        const user = users.find(u => u.username === auth.username);
        setImg(user?.imageUrl || null);
      }).catch(() => setImg(null));
    } else {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
        .then(r=>r.ok?r.json():Promise.reject(r))
        .then(me => setImg(me.imageUrl || null))
        .catch(() => setImg(null));
    }
  }, [auth]);
  return (
    <div style={{
      color: 'var(--color-accent)',
      fontWeight: 600,
      fontSize: '1.08em',
      textAlign: 'center',
      marginBottom: '1.2rem',
      opacity: 0.85,
      letterSpacing: '0.2px',
      wordBreak: 'break-all',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }}>
      {img ? (
        <img src={img} alt="avatar" style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--color-border)',marginBottom:2}} />
      ) : (
        <div style={{width:38,height:38,borderRadius:'50%',background:'#222',display:'flex',alignItems:'center',justifyContent:'center',color:'#888',fontSize:'1.3em',border:'2px solid var(--color-border)',marginBottom:2}}>
          <span role="img" aria-label="avatar">👤</span>
        </div>
      )}
      {auth?.username && <span>{auth.username}</span>}
    </div>
  );
}






export default function App() {
  const [users, setUsers] = useState([]);
  const [reloadSessions, setReloadSessions] = useState(0);
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token && parsed.role) return parsed;
      return null;
    } catch {
      return null;
    }
  });
  // Dark/Light Mode State
  const [mode, setMode] = useState(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return "light";
    }
    return "dark";
  });
  useEffect(() => {
    document.body.classList.toggle("light", mode === "light");
  }, [mode]);

  const [entries, setEntries] = useState([]);
  // Timer-States entfernt
  const [absences, setAbsences] = useState([]);
  // Admin-Filter (Mitarbeiter) für Einträge und Abwesenheiten
  const [entryUserFilter, setEntryUserFilter] = useState('ALL');
  const [absenceUserFilter, setAbsenceUserFilter] = useState('ALL');
  const [absenceStatusFilter, setAbsenceStatusFilter] = useState('ALLE');
  const [absenceTypeFilter, setAbsenceTypeFilter] = useState('ALLE');
  // Datumsbereichsfilter
  const [entryFrom, setEntryFrom] = useState(null);
  const [entryTo, setEntryTo] = useState(null);
  const [absenceFrom, setAbsenceFrom] = useState(null);
  const [absenceTo, setAbsenceTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Fehler für Einträge
  const [absenceError, setAbsenceError] = useState(""); // Fehler für Abwesenheiten
  const [highlightEntryId, setHighlightEntryId] = useState(null);
  const [highlightAbsenceId, setHighlightAbsenceId] = useState(null);

  useEffect(() => {
    if(!auth){ setLoading(false); return; }
    if (auth.role === 'ADMIN') {
      fetchAdminUsers(auth.token).then(setUsers).catch(() => null);
    }
    // Profil anreichern (username/role/id/image), falls nur token vorhanden
    if (!auth.username || !auth.userId) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
        .then(r=>r.ok?r.json():Promise.reject(r))
        .then(me => {
          // userId camelCase für alle Filter
          const merged = { ...auth, username: me.username, role: me.role, userId: me.user_id || me.userId, imageUrl: me.imageUrl };
          localStorage.setItem('auth', JSON.stringify(merged));
          setAuth(merged);
        })
  .catch(() => null);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchEntries().catch(err => { throw err; }),
      fetchAbsences().catch(err => { throw err; }),
    ]).then(([e, a]) => {
      setEntries(e);
      setAbsences(a);
    }).catch(err => {
      const status = err && (err.status || (String(err.message).match(/HTTP (\d{3})/)||[])[1]);
      if (status==401 || status==403 || status=="401" || status=="403") {
        localStorage.removeItem('token');
        setAuth(null);
      } else {
        setError(err.message || 'Fehler');
      }
    }).finally(() => setLoading(false));
  }, [auth]);

  // Timer-Tick entfernt

  async function addEntry(entry) {
    try {
      const saved = await apiAddEntry(entry);
      setEntries([saved, ...entries]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function editEntry(id, entry) {
    try {
      const updated = await apiUpdateEntry(id, entry);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
      return updated;
    } catch (err) {
      setError(err.message);
      // Falls der Eintrag serverseitig nicht existiert (z.B. Backend wurde neu gestartet), Liste aktualisieren
      if (String(err.message).includes('404')) {
        try { const fresh = await fetchEntries(); setEntries(fresh); } catch { void 0; }
      }
      throw err;
    }
  }

  async function deleteEntry(id) {
    try {
      await apiRemoveEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function addAbsence(abs){
    try {
      const saved = await apiAddAbsence(abs);
      setAbsences(prev => [saved, ...prev]);
    } catch(err){ setError(err.message); }
  }

  async function deleteAbsence(id){
    try {
      await apiRemoveAbsence(id);
      setAbsences(prev => prev.filter(a=>a.id!==id));
      setAbsenceError("");
    } catch(err){
      let msg = err.message;
      if (err.status === 400 && err.body) {
        try {
          const json = JSON.parse(err.body);
          if (json.message && (json.message.includes('PENDING') || json.message.includes('stornierbar'))) {
            msg = "Nur Anträge im Status 'wird überprüft' können gelöscht werden.";
          }
        } catch {
          if (err.body.includes('PENDING') || err.body.includes('stornierbar')) {
            msg = "Nur Anträge im Status 'wird überprüft' können gelöscht werden.";
          }
        }
      }
      setAbsenceError(msg);
    }
  }

  function scrollToId(id){
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function handleDayClick(){
    scrollToId('time-entry-form');
  }
  function handleEntryClick(id){
    setHighlightEntryId(id);
    scrollToId('entries-section');
    setTimeout(()=> setHighlightEntryId(null), 1800);
  }
  function handleAbsenceClick(id){
    setHighlightAbsenceId(id);
    scrollToId('absences-section');
    setTimeout(()=> setHighlightAbsenceId(null), 1800);
  }

  // Timer-Logik vollständig entfernt



  // Navigation-State: 'dashboard', 'berichte', 'einstellungen', 'admin'
  const isAdmin = auth && auth.role === "ADMIN";
  const [nav, setNav] = useState('dashboard');
  const activeNav = nav;

  if(!auth){
    return <AuthPanel onAuth={(info)=> setAuth(info)} />;
  }

  return (
  <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Sidebar */}
  <aside className="dashboard-sidebar">
        <div className="dashboard-logo" style={{
          fontWeight: 'bold',
          fontSize: '2rem',
          color: 'var(--color-accent)',
          marginBottom: '0.7rem',
          letterSpacing: '1px',
          textAlign: 'center'
        }}>
          Zeiterfassung
        </div>
        <SidebarUserInfo auth={auth} />




        <button
          className="mode-switcher"
          onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          style={{
            margin: '0 0 1.5rem 0',
            padding: '0.5em 1.2em',
            borderRadius: 8,
            border: 'none',
            background: 'var(--color-accent)',
            color: 'var(--color-btn-text)',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 var(--color-shadow)',
            transition: 'background 0.2s, color 0.2s',
            width: '100%'
          }}
          aria-label="Dark/Light Mode wechseln"
        >
          {mode === "dark" ? "🌙 Dunkel" : "☀️ Hell"}
        </button>
        <nav className="nav">
          <a
            href="#"
            className={activeNav === 'dashboard' ? 'active' : ''}
            style={activeNav === 'dashboard' ? {
              boxShadow: '0 2px 16px 0 var(--color-shadow)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              background: 'transparent',
              borderRadius: 10
            } : {}}
            onClick={e => { e.preventDefault(); setNav('dashboard'); }}
          >
            Dashboard
          </a>
<a
  href="#"
  className={activeNav === 'zeit' ? 'active' : ''}
            style={activeNav === 'zeit' ? {
              boxShadow: '0 2px 16px 0 var(--color-shadow)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              background: 'transparent',
              borderRadius: 10
            } : {}}
            onClick={e => { e.preventDefault(); setNav('zeit'); }}
          >
            Zeitmanagement
          </a>
          <a
            href="#"
            className={activeNav === 'abwesenheiten' ? 'active' : ''}
            style={activeNav === 'abwesenheiten' ? {
              boxShadow: '0 2px 16px 0 var(--color-shadow)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              background: 'transparent',
              borderRadius: 10
            } : {}}
            onClick={e => { e.preventDefault(); setNav('abwesenheiten'); }}
          >
            Abwesenheits‑Übersicht
          </a>
          <a
            href="#"
            className={activeNav === 'stempeluhr' ? 'active' : ''}
            style={activeNav === 'stempeluhr' ? {
              boxShadow: '0 2px 16px 0 var(--color-shadow)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              background: 'transparent',
              borderRadius: 10
            } : {}}
            onClick={e => { e.preventDefault(); setNav('stempeluhr'); }}
          >
            Live‑Stempeluhr
          </a>
          {isAdmin && (
            <>
              <a
                href="#"
                className={activeNav === 'mitarbeiter' ? 'active' : ''}
                style={activeNav === 'mitarbeiter' ? {
                  boxShadow: '0 2px 16px 0 var(--color-shadow)',
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  background: 'transparent',
                  borderRadius: 10
                } : {}}
                onClick={e => { e.preventDefault(); setNav('mitarbeiter'); }}
              >
                Mitarbeiter
              </a>
              <a
                href="#"
                className={activeNav === 'admin' ? 'active' : ''}
                style={activeNav === 'admin' ? {
                  boxShadow: '0 2px 16px 0 var(--color-shadow)',
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  background: 'transparent',
                  borderRadius: 10
                } : {}}
                onClick={e => { e.preventDefault(); setNav('admin'); }}
              >
                Admin
              </a>
            </>
          )}
        </nav>
  <button className="logout-btn" onClick={()=>{ try{localStorage.removeItem('token');}catch{ /* ignore */ } localStorage.removeItem('auth'); setAuth(null); }}>Logout</button>
      </aside>
      {/* Main Content */}
      <main className="dashboard-main">
        {nav === 'dashboard' && (
          <div className="dashboard-cards">
            {/* ...Debug-Ausgabe entfernt... */}
            <div className="dashboard-card">
              <h2>Kalender</h2>
              <CalendarBoard
                entries={isAdmin ? entries : entries.filter(e => e.userId === auth.userId)}
                absences={
                  (isAdmin ? absences : absences.filter(a => a.userId === auth.userId && a.status === 'APPROVED'))
                  .filter(a => a.status !== 'REJECTED')
                }
                onDayClick={handleDayClick}
                onEntryClick={handleEntryClick}
                onAbsenceClick={handleAbsenceClick}
              />
            </div>
            <div className="dashboard-card" id="time-entry-form">
              <h2>Tagesübersicht</h2>
              <TimeEntryForm onAdd={addEntry} />
            </div>
            <div className="dashboard-card" id="entries-section">
              <h2>Einträge</h2>
              {isAdmin && activeNav === 'mitarbeiter' && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="entryUserFilter" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Mitarbeiter:</label>
                    <select
                      id="entryUserFilter"
                      value={entryUserFilter}
                      onChange={e => setEntryUserFilter(e.target.value)}
                      style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      <option value="ALL">Alle</option>
                      {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="entryFrom" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Von:</label>
                    <DatePicker
                      id="entryFrom"
                      selected={entryFrom}
                      onChange={(d) => setEntryFrom(d)}
                      dateFormat="P"
                      placeholderText="tt.mm.jjjj"
                      className="input datepicker-input"
                      calendarClassName="dashboard-datepicker"
                      locale="de"
                      isClearable
                    />
                    <label htmlFor="entryTo" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Bis:</label>
                    <DatePicker
                      id="entryTo"
                      selected={entryTo}
                      onChange={(d) => setEntryTo(d)}
                      dateFormat="P"
                      placeholderText="tt.mm.jjjj"
                      className="input datepicker-input"
                      calendarClassName="dashboard-datepicker"
                      locale="de"
                      isClearable
                    />
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setEntryUserFilter('ALL'); setEntryFrom(null); setEntryTo(null); }}
                      title="Alle Eintragsfilter zurücksetzen"
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                </div>
              )}
              {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
              {loading ? <div>Lade Einträge...</div> : (
                <TimeEntryList
                  entries={(() => {
                    const base = isAdmin && activeNav === 'mitarbeiter' ? entries : (isAdmin ? entries : entries.filter(e => e.userId === auth.userId));
                    const toStartOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
                    const toEndOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : null;
                    if (isAdmin && activeNav === 'mitarbeiter' && entryUserFilter !== 'ALL') {
                      const sel = Number(entryUserFilter);
                      const byUser = base.filter(e => e.userId === sel);
                      if (!entryFrom && !entryTo) return byUser;
                      const from = toStartOfDay(entryFrom);
                      const to = toEndOfDay(entryTo);
                      return byUser.filter(e => {
                        const s = e.start ? new Date(e.start) : null;
                        const en = e.end ? new Date(e.end) : s;
                        const afterFrom = !from || (en && en >= from);
                        const beforeTo = !to || (s && s <= to);
                        return afterFrom && beforeTo;
                      });
                    }
                    if (!entryFrom && !entryTo) return base;
                    const from = toStartOfDay(entryFrom);
                    const to = toEndOfDay(entryTo);
                    return base.filter(e => {
                      const s = e.start ? new Date(e.start) : null;
                      const en = e.end ? new Date(e.end) : s;
                      const afterFrom = !from || (en && en >= from);
                      const beforeTo = !to || (s && s <= to);
                      return afterFrom && beforeTo;
                    });
                  })()}
                  onEdit={isAdmin && activeNav === 'mitarbeiter' ? editEntry : undefined}
                  onDelete={isAdmin && activeNav === 'mitarbeiter' ? deleteEntry : undefined}
                  highlightId={highlightEntryId}
                  isAdmin={isAdmin}
                  users={users}
                />
              )}
            </div>
            <div className="dashboard-card" id="absences-section">
              <h2>Abwesenheiten</h2>
              <AbsenceForm onAdd={addAbsence} />
            </div>
            <div className="dashboard-card">
              <h2>Liste Abwesenheiten</h2>
              {isAdmin && activeNav === 'mitarbeiter' && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="absenceUserFilter" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Mitarbeiter:</label>
                    <select
                      id="absenceUserFilter"
                      value={absenceUserFilter}
                      onChange={e => setAbsenceUserFilter(e.target.value)}
                      style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      <option value="ALL">Alle</option>
                      {users.map(u => <option key={u.id} value={String(u.id)}>{u.username}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="absenceStatusFilter" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Status:</label>
                    <select
                      id="absenceStatusFilter"
                      value={absenceStatusFilter}
                      onChange={e => setAbsenceStatusFilter(e.target.value)}
                      style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      <option value="ALLE">Alle</option>
                      <option value="APPROVED">genehmigt</option>
                      <option value="REJECTED">abgelehnt</option>
                      <option value="PENDING">wird überprüft</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="absenceTypeFilter" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Art:</label>
                    <select
                      id="absenceTypeFilter"
                      value={absenceTypeFilter}
                      onChange={e => setAbsenceTypeFilter(e.target.value)}
                      style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      <option value="ALLE">Alle</option>
                      <option value="Urlaub">Urlaub</option>
                      <option value="Sonderurlaub">Sonderurlaub</option>
                      <option value="Krank">Krank</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="absenceFrom" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Von:</label>
                    <DatePicker
                      id="absenceFrom"
                      selected={absenceFrom}
                      onChange={(d) => setAbsenceFrom(d)}
                      dateFormat="P"
                      placeholderText="tt.mm.jjjj"
                      className="input datepicker-input"
                      calendarClassName="dashboard-datepicker"
                      locale="de"
                      isClearable
                    />
                    <label htmlFor="absenceTo" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Bis:</label>
                    <DatePicker
                      id="absenceTo"
                      selected={absenceTo}
                      onChange={(d) => setAbsenceTo(d)}
                      dateFormat="P"
                      placeholderText="tt.mm.jjjj"
                      className="input datepicker-input"
                      calendarClassName="dashboard-datepicker"
                      locale="de"
                      isClearable
                    />
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setAbsenceUserFilter('ALL'); setAbsenceStatusFilter('ALLE'); setAbsenceTypeFilter('ALLE'); setAbsenceFrom(null); setAbsenceTo(null); }}
                      title="Alle Abwesenheitsfilter zurücksetzen"
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                </div>
              )}
              {absenceError && <div style={{color:'red',marginBottom:8}}>{absenceError}</div>}
              {/* Admin-Filter im Dashboard ausgeblendet; in "Mitarbeiter" sichtbar */}
              {loading ? <div>Lade...</div> : (
                <AbsenceList
                  items={
                    (() => {
                      const base = isAdmin && activeNav === 'mitarbeiter' ? absences : (isAdmin ? absences : absences.filter(a => a.userId === auth.userId));
                      const byUser = (isAdmin && activeNav === 'mitarbeiter' && absenceUserFilter !== 'ALL') ? base.filter(a => a.userId === Number(absenceUserFilter)) : base;
                      const byStatus = (isAdmin && activeNav === 'mitarbeiter') ? (absenceStatusFilter === 'ALLE' ? byUser : byUser.filter(a => a.status === absenceStatusFilter)) : byUser;
                      const byType = (isAdmin && activeNav === 'mitarbeiter') ? (absenceTypeFilter === 'ALLE' ? byStatus : byStatus.filter(a => {
                        const t = (a.type || '').toLowerCase();
                        if (absenceTypeFilter === 'Urlaub') return t.startsWith('urlaub');
                        if (absenceTypeFilter === 'Sonderurlaub') return t.startsWith('sonderurlaub');
                        if (absenceTypeFilter === 'Krank') return t.startsWith('krank');
                        return true;
                      })) : byUser;
                      const toStartOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
                      const toEndOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : null;
                      const byDate = (() => {
                        if (!absenceFrom && !absenceTo) return byType;
                        const from = toStartOfDay(absenceFrom);
                        const to = toEndOfDay(absenceTo);
                        return byType.filter(a => {
                          const s = a.startDate ? new Date(a.startDate) : null;
                          const en = a.endDate ? new Date(a.endDate) : s;
                          const afterFrom = !from || (en && en >= from);
                          const beforeTo = !to || (s && s <= to);
                          return afterFrom && beforeTo;
                        });
                      })();
                      return byDate.map(a => ({
                        ...a,
                        username: (isAdmin && activeNav === 'mitarbeiter') ? (users.find(u => u.id === a.userId)?.username || '') : ''
                      }));
                    })()
                  }
                  onDelete={isAdmin && activeNav === 'mitarbeiter' ? deleteAbsence : undefined}
                  highlightId={highlightAbsenceId}
                  statusFilter={absenceStatusFilter}
                />
              )}
            </div>
          </div>
  )}
        {nav === 'zeit' && (
          <Zeitmanagement
            entries={entries}
            absences={absences}
            auth={auth}
            isAdmin={isAdmin}
            users={users}
          />
        )}
        {nav === 'stempeluhr' && (
          <>
            <LiveStempeluhr auth={auth} onSessionChanged={() => setReloadSessions(r => r + 1)} />
            <WorkSessionList auth={auth} isAdmin={isAdmin} key={reloadSessions} />
          </>
        )}
    {nav === 'abwesenheiten' && (
          <div className="dashboard-card">
            <h2>Abwesenheits‑Übersicht</h2>
      <AbsenceOverview absences={absences} isAdmin={isAdmin} auth={auth} users={users} />
          </div>
        )}
        {isAdmin && nav === 'admin' && (
          <div className="dashboard-card">
            <AdminPanel auth={auth} onAbsenceChanged={async ()=>{
              try {
                const abs = await fetchAbsences();
                setAbsences(abs);
              } catch { /* ignore */ }
            }} />
          </div>
        )}
        {isAdmin && nav === 'mitarbeiter' && (
          <MitarbeiterVerwaltung auth={auth} users={users} entries={entries} absences={absences} />
        )}
      </main>
    </div>
  );
}
