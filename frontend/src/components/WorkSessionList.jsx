import React, { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";
import { confirmWorkSession } from "../api-worksession";
// Projekte-Integration entfernt
import { addOvertimeAdjustment } from "../api-overtime";

// Locale für DatePicker registrieren
registerLocale("de", de);

export default function WorkSessionList({ auth, isAdmin }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState('Monat');
  const [userFilter, setUserFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Projekte-Filter entfernt

  async function loadData() {
    setLoading(true);
    const url = isAdmin ? "/api/worksessions" : "/api/worksessions/me";
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      const data = await r.json();
      setSessions(Array.isArray(data) ? data : []);
      setError("");
      if (isAdmin) {
        const ru = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${auth.token}` } });
        if (ru.ok) {
          const us = await ru.json();
          setUsers(Array.isArray(us) ? us : []);
        }
      }
  // keine Projekte laden
    } catch (e) {
      setError(`Fehler beim Laden der Sessions: ${e.message}`);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [auth, isAdmin]);

  function getUserInfo(ws) {
  if (!isAdmin) return { username: auth.username, imageUrl: auth.imageUrl, userId: auth.userId };
  return { username: ws.username || "?", imageUrl: ws.imageUrl, userId: ws.userId || ws.user_id };
  }

  function formatTime(dt) {
    if (!dt) return "-";
    return dt.replace("T", " ").substring(0, 19);
  }

  // Gruppierung nach Jahr, Monat, Tag
  function groupSessions(sessions, mode) {
    const groups = {};
    sessions.forEach(ws => {
      const date = ws.startTime ? ws.startTime.substring(0, 10) : "";
      if (!date) return;
      const [year, month, day] = date.split("-");
      let key = year;
      if (mode === 'Monat') key = `${year}-${month}`;
      if (mode === 'Tag') key = `${year}-${month}-${day}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ws);
    });
    // Sortiere Keys absteigend (neueste zuerst)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }
  function formatDuration(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function isUserOnline(userId) {
    // Ein Benutzer ist online, wenn es eine Session ohne endTime gibt
    return sessions.some(s => s.userId === userId && !s.endTime);
  }

  function getUserStatus(userId) {
    // Finde die letzte offene Session für diesen User
    const openSessions = sessions.filter(s => s.userId === userId && !s.endTime);
    if (openSessions.length > 0) {
      // Nehme die zuletzt gestartete offene Session
      const open = openSessions.reduce((a, b) => new Date(a.startTime) > new Date(b.startTime) ? a : b);
  // Nur echte Pause-Logik: rely solely on pauseActive
  if (open.pauseActive) return 'pause';
      return 'online';
    }
    return 'offline';
  }

  function netSeconds(ws){
    if(!ws.startTime || !ws.endTime) return 0;
    const start = new Date(ws.startTime); const end = new Date(ws.endTime);
    const gross = Math.max(0, Math.floor((end-start)/1000));
    const pause = ws.pauseSeconds||0;
    return Math.max(0, gross - pause);
  }
  const selectedTotalSeconds = useMemo(()=>{
    let sum = 0; sessions.forEach(ws=>{ if(selected.has(ws.id)) sum += netSeconds(ws); }); return sum;
  }, [sessions, selected]);

  // Überstunden (Netto) nur über SOLL (8h an Werktagen) – pro Tag und Benutzer getrennt
  const selectedOvertimeSeconds = useMemo(() => {
    // Map key: `${date}|${userId}` -> sumNetSeconds
    const perDayUser = new Map();
    for (const ws of sessions) {
      if (!selected.has(ws.id)) continue;
      if (!ws.startTime) continue;
      const dateStr = ws.startTime.substring(0, 10);
      const uid = ws.userId || ws.user_id || 0;
      const key = `${dateStr}|${uid}`;
      const prev = perDayUser.get(key) || 0;
      perDayUser.set(key, prev + netSeconds(ws));
    }
    let overtime = 0;
    for (const [key, secs] of perDayUser) {
      const datePart = key.split('|')[0];
      const d = new Date(`${datePart}T00:00:00`);
      const day = d.getDay(); // 0=So, 6=Sa
      const expected = (day >= 1 && day <= 5) ? 8 * 3600 : 0; // einfache SOLL-Regel
      if (secs > expected) overtime += (secs - expected);
    }
    return overtime;
  }, [sessions, selected]);

  return (
    <div className="work-session-list" style={{
      background:'var(--color-bg-card)',
      borderRadius:16,
      padding:'2em',
      boxShadow:'0 2px 16px 0 var(--color-shadow)',
      maxWidth:900,
      margin:'2em auto',
      color:'var(--color-text)',
  overflow:'hidden'
    }}>
    <h2 style={{color:'var(--color-accent)',marginBottom:'1.2em'}}>Arbeitszeit-Sessions</h2>
  <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:18, flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8}}>
          {['Jahr','Monat','Tag'].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              background: 'var(--color-bg)',
              color: 'var(--color-accent)',
              border: '1.5px solid var(--color-accent2)',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              fontWeight: 600,
              fontSize: '1em',
              cursor: 'pointer',
              opacity: tab===t ? 1 : 0.7,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 6px 0 var(--color-shadow-btn)',
              outline: tab===t ? '2px solid var(--color-accent)' : 'none',
              transition: 'outline 0.2s, border 0.2s',
            }}>{t}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <label htmlFor="wsFrom" style={{fontSize:'1em',color:'var(--color-accent2)',marginBottom:0,whiteSpace:'nowrap',height:'40px',display:'flex',alignItems:'center'}}>Von</label>
          <DatePicker
            id="wsFrom"
            selected={fromDate}
            onChange={(d) => setFromDate(d)}
            dateFormat="P"
            placeholderText="tt.mm.jjjj"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
          <label htmlFor="wsTo" style={{fontSize:'1em',color:'var(--color-accent2)',marginBottom:0,whiteSpace:'nowrap',height:'40px',display:'flex',alignItems:'center'}}>Bis</label>
          <DatePicker
            id="wsTo"
            selected={toDate}
            onChange={(d) => setToDate(d)}
            dateFormat="P"
            placeholderText="tt.mm.jjjj"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
          <label htmlFor="wsStatus" style={{fontSize:'1em',color:'var(--color-accent2)',marginBottom:0,whiteSpace:'nowrap',height:'40px',display:'flex',alignItems:'center'}}>Status</label>
          <select
            id="wsStatus"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding:'0.5em 1.2em',
              borderRadius:8,
              border:'1.5px solid var(--color-accent2)',
              fontSize:'1.08em',
              fontWeight:600,
              background:'var(--color-bg)',
              color:'var(--color-accent)',
              boxShadow:'0 1px 6px 0 var(--color-shadow-btn)',
              outline:'none',
              minWidth:150,
              width:'auto',
              cursor:'pointer',
              height:'40px'
            }}
          >
            <option value="ALL">Alle</option>
            <option value="bestätigt">bestätigt</option>
            <option value="unbestätigt">unbestätigt</option>
          </select>
        </div>
  {/* Projekt-Filter entfernt */}
  {isAdmin && (
          <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:16}}>
            <label htmlFor="userFilter" style={{fontSize:'1em',color:'var(--color-accent2)',marginBottom:0,marginLeft:2,whiteSpace:'nowrap',height:'40px',display:'flex',alignItems:'center'}}>Mitarbeiter filtern</label>
            <select
              id="userFilter"
              value={userFilter}
              onChange={e=>setUserFilter(e.target.value)}
              style={{
                padding:'0.5em 1.2em',
                borderRadius:8,
                border:'1.5px solid var(--color-accent2)',
                fontSize:'1.08em',
                fontWeight:600,
                background:'var(--color-bg)',
                color:'var(--color-accent)',
                boxShadow:'0 1px 6px 0 var(--color-shadow-btn)',
                outline:'none',
                minWidth:170,
                maxWidth:220,
                width:'auto',
                cursor:'pointer',
                transition:'border 0.2s, box-shadow 0.2s',
                height:'40px',
                textAlign:'left',
                whiteSpace:'nowrap',
                overflow:'hidden',
                textOverflow:'ellipsis',
                display:'block'
              }}
            >
              <option value="ALL">Alle Mitarbeiter</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
            <button onClick={loadData} title="Neu laden" style={{
              padding:'0.5em 1.0em',
              borderRadius:8,
              border:'1.5px solid var(--color-accent2)',
              background:'var(--color-bg)',
              color:'var(--color-accent)',
              fontWeight:600,
              cursor:'pointer',
              height:'40px',
              boxShadow:'0 1px 6px 0 var(--color-shadow-btn)'
            }}>Neu laden</button>
            <button onClick={() => { setUserFilter('ALL'); setFromDate(null); setToDate(null); setStatusFilter('ALL'); }} title="Filter zurücksetzen" style={{
               padding:'0.5em 1.0em',
               borderRadius:8,
               border:'1.5px solid var(--color-accent2)',
               background:'var(--color-bg)',
               color:'var(--color-accent)',
               fontWeight:600,
               cursor:'pointer',
               height:'40px',
               boxShadow:'0 1px 6px 0 var(--color-shadow-btn)'
             }}>Filter zurücksetzen</button>
          </div>
        )}
      </div>
  {loading ? <div>Lade...</div> : error ? <div style={{color:'red',whiteSpace:'pre-wrap'}}>{error}</div> : (
    <div style={{maxHeight: '340px', overflowY: 'auto', overflowX: 'auto', borderRadius: 12, paddingRight: 4}}>
          {groupSessions(
            (Array.isArray(sessions) ? sessions : []).filter(ws => {
              // User-Filter (nur Admin)
              if (isAdmin && userFilter !== 'ALL') {
                const selected = Number(userFilter);
                if (!(ws.userId === selected || ws.user_id === selected)) return false;
              }
              // Datumsbereich (Überlappung)
              if (!fromDate && !toDate) {
                // continue
              } else {
                const toStartOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
                const toEndOfDay = (d) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : null;
                const from = toStartOfDay(fromDate);
                const to = toEndOfDay(toDate);
                const s = ws.startTime ? new Date(ws.startTime) : null;
                const en = ws.endTime ? new Date(ws.endTime) : s;
                const afterFrom = !from || (en && en >= from);
                const beforeTo = !to || (s && s <= to);
                if (!(afterFrom && beforeTo)) return false;
              }
              // Status-Filter
              if (statusFilter !== 'ALL') {
                const st = (ws.status || 'unbestätigt').toLowerCase();
                if (st !== statusFilter) return false;
              }
              // kein Projekt-Filter
              return true;
            }),
            tab
          ).map(([group, groupItems]) => (
            <div key={group} style={{marginBottom:24}}>
              <div style={{fontWeight:700,color:'var(--color-accent2)',fontSize:'1.1em',margin:'12px 0 6px 0'}}>{group}</div>
      {/* Bulk actions */}
      <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0'}}>
        <div style={{color:'var(--color-accent2)'}}>Ausgewählt: {selected.size} | Überstunden (Netto): {(()=>{ 
          const m = Math.floor(selectedOvertimeSeconds/60); const h = Math.floor(m/60); const mm = m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;})()}</div>
        <button disabled={selected.size===0}
          className="btn-secondary"
          onClick={async()=>{
            try{
              const ids = sessions.filter(s=>selected.has(s.id) && (s.status||'unbestätigt')!=='bestätigt').map(s=>s.id);
              for (const id of ids) {
                await confirmWorkSession(id, auth.token);
              }
              setSessions(prev => prev.map(s => selected.has(s.id) ? { ...s, status: 'bestätigt' } : s));
              setSelected(new Set());
            }catch(e){ alert('Fehler beim Bestätigen: '+(e.message||e)); }
          }}>Auswahl bestätigen</button>
        <button disabled={selected.size===0}
          className="btn-secondary"
          onClick={async()=>{
            try{
              const minutes = Math.floor(selectedOvertimeSeconds/60);
              if(minutes<=0) return alert('Keine Überstunden in der Auswahl.');
              await addOvertimeAdjustment(auth.token, { minutes, type:'payout', note:'Sammelaktion Auszahlung' });
              alert('Überstunden zur Auszahlung markiert.');
              setSelected(new Set());
            }catch(e){ alert('Fehler Auszahlung: '+(e.message||e)); }
          }}>Auszahlen</button>
        <button disabled={selected.size===0}
          className="btn-secondary"
          onClick={async()=>{
            try{
              const minutes = Math.floor(selectedOvertimeSeconds/60);
              if(minutes<=0) return alert('Keine Überstunden in der Auswahl.');
              await addOvertimeAdjustment(auth.token, { minutes, type:'comp_time', note:'Sammelaktion Freizeit' });
              alert('Überstunden in Freizeit umgewandelt.');
              setSelected(new Set());
            }catch(e){ alert('Fehler Freizeit: '+(e.message||e)); }
          }}>In Freizeit umwandeln</button>
      </div>

      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 0.5em',background:'transparent'}}>
        <thead>
          <tr>
            <th style={{position:'sticky',top:0,background:'var(--color-bg-card)'}}>
              <input type="checkbox" checked={selected.size>0 && selected.size === (Array.isArray(groupItems)?groupItems.length:0)}
                onChange={e=>{
                  if(e.target.checked){ setSelected(new Set(groupItems.map(g=>g.id))); }
                  else setSelected(new Set());
                }} />
            </th>
            {isAdmin && <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'left', padding:'0.5em 0.5em 0.5em 0.2em'}}>Mitarbeiter</th>}
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Zeitspanne</th>
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Dauer</th>
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Pause</th>
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Dauer (netto)</th>
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Erfasst von</th>
            <th style={{color:'var(--color-accent)', position:'sticky', top:0, background:'var(--color-bg-card)', zIndex:1, textAlign:'center', padding:'0.5em'}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {groupItems.map(ws => {
            const user = getUserInfo(ws);
            // Zeitspanne
            const von = ws.startTime ? ws.startTime.substring(11,16) : '-';
            const bis = ws.endTime ? ws.endTime.substring(11,16) : '-';
            // Dauer brutto
            let dauer = '-';
            if(ws.startTime && ws.endTime) {
              const start = new Date(ws.startTime);
              const end = new Date(ws.endTime);
              dauer = formatDuration(Math.max(0, Math.floor((end-start)/1000)));
            }
            // Pause
            const pause = formatDuration(ws.pauseSeconds||0);
            // Netto
            let netto = '-';
            if(typeof ws.pauseSeconds === 'number' && ws.startTime && ws.endTime) {
              const start = new Date(ws.startTime);
              const end = new Date(ws.endTime);
              netto = formatDuration(Math.max(0, Math.floor((end-start)/1000) - ws.pauseSeconds));
            }
            // Erfasst von
            const createdBy = ws.createdBy || user?.username || '';
            // Status
            const status = ws.status || 'unbestätigt';
            const badgeColor = status === 'bestätigt' ? '#2ecc40' : '#e74c3c';
            const badgeText = status === 'bestätigt' ? 'bestätigt' : 'unbestätigt';
            return (
              <tr key={ws.id} style={{verticalAlign:'middle'}}>
                <td style={{textAlign:'center'}}>
                  <input type="checkbox" checked={selected.has(ws.id)} onChange={e=>{
                    setSelected(prev=>{
                      const n = new Set(prev);
                      if(e.target.checked) n.add(ws.id); else n.delete(ws.id);
                      return n;
                    });
                  }} />
                </td>
                {isAdmin && <td style={{padding:'0.5em 0.5em 0.5em 0.2em', verticalAlign:'middle'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    {user?.imageUrl ? <img src={user.imageUrl} alt="avatar" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'1px solid var(--color-border)'}} /> : <span style={{width:36,height:36,display:'inline-block',borderRadius:'50%',background:'#222',color:'#fff',textAlign:'center',lineHeight:'36px'}}>👤</span>}
                    {/* Live-Indikator */}
                    {user?.userId && (() => {
  const status = getUserStatus(user.userId);
  if (status === 'online') {
    return <span title="Online" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#2ecc40',marginLeft:4,boxShadow:'0 0 4px #2ecc40'}} />;
  } else if (status === 'pause') {
    return <span title="Pause" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#ff9800',marginLeft:4,boxShadow:'0 0 4px #ff9800'}} />;
  } else {
    return <span title="Offline" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#e74c3c',marginLeft:4,boxShadow:'0 0 4px #e74c3c'}} />;
  }
})()}
                    <span style={{fontWeight:700,fontSize:'1.08em'}}>{user?.username}</span>
                  </div>
                </td>}
                <td style={{textAlign:'center',fontWeight:500}}>{von} – {bis}</td>
                <td style={{textAlign:'center'}}>{dauer}</td>
                <td style={{textAlign:'center'}}>{pause}</td>
                <td style={{textAlign:'center'}}>{netto}</td>
                <td style={{textAlign:'center'}}>{createdBy}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{
                    display:'inline-block',
                    minWidth:80,
                    padding:'0.25em 1.1em',
                    borderRadius:14,
                    background:badgeColor,
                    color:'#fff',
                    fontWeight:600,
                    textAlign:'center',
                    fontSize:'1em',
                    letterSpacing:'0.5px',
                    boxShadow:'0 1px 4px 0 #0002',
                    margin:'0 auto',
                  }}>{badgeText}</span>
                  {isAdmin && status !== 'bestätigt' && (
                    <button
                      style={{
                        marginLeft: 12,
                        padding: '0.18em 0.9em',
                        borderRadius: 10,
                        background: '#2ecc40',
                        color: '#fff',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.98em',
                        boxShadow: '0 1px 4px 0 #0002',
                        transition: 'background 0.2s',
                      }}
                      title="Zeit bestätigen"
                      onClick={async () => {
                        try {
                          await confirmWorkSession(ws.id, auth.token);
                          // Nach Bestätigung neu laden
                          setSessions(sessions => sessions.map(s => s.id === ws.id ? { ...s, status: 'bestätigt' } : s));
                        } catch (e) {
                          alert('Fehler beim Bestätigen: ' + (e.message || e));
                        }
                      }}
                    >Bestätigen</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
