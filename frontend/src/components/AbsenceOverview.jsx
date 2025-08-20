// Gibt das Enddatum, wenn man ab start X Werktage (Mo-Fr) zählt
export function addWorkingDays(start, days) {
  let d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // 0=So, 6=Sa
      added++;
    }
  }
  return d;
}

// Zählt die Werktage (Mo-Fr) zwischen zwei Daten inkl. Start/Ende
export function countWorkingDays(start, end) {
  let d = new Date(start);
  let e = new Date(end);
  let count = 0;
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
import React, { useMemo, useState, useEffect } from "react";
import { fetchUserAllowances, upsertUserAllowances, fetchAllowances } from "../api";

// Einfache Donut-Chart als SVG ohne externe Abhängigkeiten
function Donut({ size=120, thickness=14, segments=[], total=0, title }){
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : segments.reduce((a,s)=>a+s.value,0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const len = (s.value / safeTotal) * circumference;
        const circle = (
          <circle key={i}
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${circumference - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return circle;
      })}
      {/* Nur die Gesamtsumme zentriert anzeigen */}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: 'var(--color-accent)', fontWeight: 700, fontSize: 18 }}>
        {total}
      </text>
    </svg>
  );
}

function daysBetweenInclusive(a, b){
  const MS = 24*3600*1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.floor((db - da) / MS) + 1);
}

function AllowancesEditor({ users=[], getAllowance, setAllowance, selectedId="", onSelect }){
  const current = useMemo(() => {
    const id = selectedId ? Number(selectedId) : null;
    return (Array.isArray(users) ? users : []).find(u => u.id === id) || null;
  }, [users, selectedId]);
  const vals = current ? {
    Urlaub: getAllowance(current.id, 'Urlaub'),
    Krank: getAllowance(current.id, 'Krank'),
    Sonderurlaub: getAllowance(current.id, 'Sonderurlaub'),
  } : { Urlaub: '', Krank: '', Sonderurlaub: '' };
  const initials = (name) => {
    if (!name) return '';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const init = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    return init.toUpperCase();
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto auto auto', gap:8, alignItems:'center' }}>
      {/* Avatar-Zelle: immer sichtbar; zeigt Standard-Icon oder ausgewähltes Avatar */}
      <div style={{ width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {current && current.imageUrl ? (
          <img src={current.imageUrl} alt="avatar" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', border:'1.5px solid var(--color-border)' }} />
        ) : (
          <span role="img" aria-label="avatar" style={{ width:42, height:42, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', background:'#222', color:'#fff', fontSize:'18px', lineHeight:'42px' }}>👤</span>
        )}
      </div>
  <select className="input" value={selectedId} onChange={e=> onSelect && onSelect(e.target.value)} style={{ minWidth: 260 }}>
        <option value="">— Mitarbeiter wählen —</option>
        {(Array.isArray(users)?users:[]).map(u => (
          <option key={u.id} value={String(u.id)}>{u.username}</option>
        ))}
      </select>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ color:'var(--color-accent2)' }}>Urlaub</span>
        <input type="number" min={0} value={vals.Urlaub}
          disabled={!current}
          onChange={e=> current && setAllowance(current.id, 'Urlaub', e.target.value)}
          className="input" style={{ width: 90 }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ color:'var(--color-accent2)' }}>Krank</span>
        <input type="number" min={0} value={vals.Krank}
          disabled={!current}
          onChange={e=> current && setAllowance(current.id, 'Krank', e.target.value)}
          className="input" style={{ width: 90 }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ color:'var(--color-accent2)' }}>Sonder</span>
        <input type="number" min={0} value={vals.Sonderurlaub}
          disabled={!current}
          onChange={e=> current && setAllowance(current.id, 'Sonderurlaub', e.target.value)}
          className="input" style={{ width: 90 }} />
      </div>
      <span style={{ color:'var(--color-accent2)', whiteSpace:'nowrap' }}>Tage</span>
    </div>
  );
}

export default function AbsenceOverview({ absences=[], isAdmin=false, auth, users=[] }){
  // Hilfsfunktion: Resturlaub Vorjahr für UserId
  const getPrevYearRest = (userId) => {
    // Hole Allowance und genehmigten Urlaub für Vorjahr
    const prevYear = year - 1;
    // Allowance für Vorjahr
    let allowance = DEFAULTS.Urlaub;
    if (allowances && allowances[String(userId)] && allowances[String(userId)]._prevYearUrlaub != null) {
      allowance = allowances[String(userId)]._prevYearUrlaub;
    }
    // Abwesenheiten im Vorjahr
    const start = new Date(prevYear, 0, 1);
    const end = new Date(prevYear, 11, 31);
    const taken = (absences||[]).filter(a => a.userId === userId && a.type === 'Urlaub' && a.status === 'APPROVED')
      .reduce((sum, a) => {
        const s0 = new Date(a.startDate);
        const e0 = a.endDate ? new Date(a.endDate) : s0;
        // Nur Tage im Vorjahr zählen
        const s = new Date(Math.max(s0, start));
        const e = new Date(Math.min(e0, end));
        if (e < start || s > end) return sum;
        return sum + daysBetweenInclusive(s, e);
      }, 0);
    return Math.max(0, allowance - taken);
  };
  // Kontingente pro User und Typ (Urlaub/Krank/Sonderurlaub) mit Migration aus Legacy-Storage
  const TYPES = ['Urlaub','Krank','Sonderurlaub'];
  const DEFAULTS = { Urlaub: 30, Krank: 0, Sonderurlaub: 0 };
  // Jahr und serverseitige Kontingente
  const [year, setYear] = useState(()=> new Date().getFullYear());
  const [allowances, setAllowances] = useState({}); // { [userId]: { Urlaub,Krank,Sonderurlaub } }
  useEffect(() => {
    setAllowances({});
    if (isAdmin) {
      // Für Admin: alle Allowances für das Jahr laden
      fetchAllowances(year).then(list => {
        // list: [{userId, type, days}]
        const grouped = {};
        (list || []).forEach(a => {
          const id = String(a.userId);
          if (!grouped[id]) grouped[id] = { Urlaub: DEFAULTS.Urlaub, Krank: DEFAULTS.Krank, Sonderurlaub: DEFAULTS.Sonderurlaub };
          grouped[id][a.type] = a.days;
        });
        setAllowances(grouped);
      }).catch(() => {/* ignore */});
    }
  }, [year, isAdmin]);
  const getAllowance = (type, userId)=>{
    const id = String(userId ?? '');
    const byUser = allowances[id];
    if (!byUser) return DEFAULTS[type];
    const v = byUser[type];
    return (v==null ? DEFAULTS[type] : Number(v));
  };
  const setAllowance = async (userId, type, value)=>{
    const id = String(userId);
    // Optimistic Update
    setAllowances(prev => {
      const cur = prev[id] || {};
      const next = { Urlaub: cur.Urlaub ?? DEFAULTS.Urlaub, Krank: cur.Krank ?? DEFAULTS.Krank, Sonderurlaub: cur.Sonderurlaub ?? DEFAULTS.Sonderurlaub };
      next[type] = Math.max(0, Number(value||0));
      return { ...prev, [id]: next };
    });
    try{
      const payload = allowances[id] ? { ...allowances[id], [type]: Math.max(0, Number(value||0)) } : { Urlaub: DEFAULTS.Urlaub, Krank: DEFAULTS.Krank, Sonderurlaub: DEFAULTS.Sonderurlaub, [type]: Math.max(0, Number(value||0)) };
      await upsertUserAllowances(year, userId, payload);
    }catch{/* ignore network errors for now */}
  };
  // Laden der Kontingente eines Users bei Auswahl (für Editor)
  const ensureUserLoaded = async (userId) => {
    const id = String(userId);
    if (allowances[id]) return;
    try{
      const list = await fetchUserAllowances(year, userId);
      const map = { Urlaub: DEFAULTS.Urlaub, Krank: DEFAULTS.Krank, Sonderurlaub: DEFAULTS.Sonderurlaub };
      (list||[]).forEach(a => { map[a.type] = a.days; });
      setAllowances(prev => ({ ...prev, [id]: map }));
    }catch{/* ignore */}
  };
  const getTotalAllowance = (type)=>{
    if (!Array.isArray(users) || users.length===0) return null;
    return users.reduce((sum,u)=> sum + getAllowance(type, u.id), 0);
  };
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year, 11, 31), [year]);

  // Aggregator für eine Liste Abwesenheiten
  const buildData = (list, allowancesByType=null) => {
    const CAT = ['Urlaub', 'Krank', 'Sonderurlaub'];
    const res = {};
    for(const type of CAT){
      res[type] = { genehmigt: 0, geplant: 0, genommen: 0, resttage: null, allowance: null };
    }
    for(const a of list){
      const t = a.type || '';
      if (!['Urlaub','Krank','Sonderurlaub'].includes(t)) continue;
      if (!a.startDate) continue;
      const s0 = new Date(a.startDate);
      const e0 = a.endDate ? new Date(a.endDate) : s0;
      const s = new Date(Math.max(s0, yearStart));
      const e = new Date(Math.min(e0, yearEnd));
      if (e < yearStart || s > yearEnd) continue;
      const status = a.status || 'PENDING';
      const totalDaysInYear = countWorkingDays(s, e);
      if (status === 'PENDING') res[t].geplant += totalDaysInYear;
      if (status === 'APPROVED') {
        res[t].genehmigt += totalDaysInYear;
        const endTaken = new Date(Math.min(e.getTime(), today.getTime() - 24*3600*1000));
        if (endTaken >= s) {
          res[t].genommen += countWorkingDays(s, endTaken);
        }
      }
    }
    if (allowancesByType && typeof allowancesByType === 'object') {
      for (const t of CAT) {
        const al = allowancesByType[t];
        if (al != null) {
          res[t].allowance = al;
          res[t].resttage = Math.max(0, al - res[t].genehmigt);
        }
      }
    }
    return res;
  };

  // Listen für Aggregation
  const allList = useMemo(() => Array.isArray(absences) ? absences : [], [absences]);
  const myList = useMemo(() => {
    const uid = auth?.userId;
    return allList.filter(a => a.userId === uid);
  }, [allList, auth]);

  // Auswahlzustand für Admin-Filter (oben links im Editor)
  const [selectedUserId, setSelectedUserId] = useState("");
  useEffect(()=>{
    if (selectedUserId) ensureUserLoaded(Number(selectedUserId));
  }, [selectedUserId, year]);

  const calcAll = useMemo(() => {
    if (!isAdmin) return null;
    // Wenn ein Mitarbeiter ausgewählt ist, zeige dessen Übersicht statt der Gesamtansicht
    if (selectedUserId) {
      const uid = Number(selectedUserId);
      const mine = {
        Urlaub: getAllowance('Urlaub', uid),
        Krank: getAllowance('Krank', uid),
        Sonderurlaub: getAllowance('Sonderurlaub', uid),
      };
      const list = allList.filter(a => a.userId === uid);
      return buildData(list, mine);
    }
    const totals = {
      Urlaub: getTotalAllowance('Urlaub'),
      Krank: getTotalAllowance('Krank'),
      Sonderurlaub: getTotalAllowance('Sonderurlaub'),
    };
    return buildData(allList, totals);
  }, [isAdmin, allList, users, allowances, selectedUserId]);

  const calcMine = useMemo(() => {
    const uid = auth?.userId;
    const mine = {
      Urlaub: getAllowance('Urlaub', uid),
      Krank: getAllowance('Krank', uid),
      Sonderurlaub: getAllowance('Sonderurlaub', uid),
    };
    return buildData(myList, mine);
  }, [myList, auth, allowances]);

  const cards = [
    { key:'Urlaub', color:'#00b894' },
    { key:'Krank', color:'#0984e3' },
    { key:'Sonderurlaub', color:'#e17055' },
  ];


  function Section({ title, data, year }){
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ color:'var(--color-accent)', fontWeight:700, margin:'0 0 8px 0' }}>{title}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {cards.map(c => {
            const d = data[c.key];
            const isVacation = c.key === 'Urlaub';
            let segments;
            let total;
            if (c.key === 'Urlaub') {
              const restVorjahr = getPrevYearRest(auth?.userId);
              segments = [
                { label: 'Rest Vorjahr', value: restVorjahr, color: '#6366f1' },
                { label: 'Resttage', value: d.resttage, color: '#00b894' },
                { label: 'genehmigt', value: d.genehmigt, color: '#00cec9' },
                { label: 'geplant', value: d.geplant, color: '#f1c40f' },
                { label: 'genommen', value: d.genommen, color: '#d35400' },
              ];
              total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
            } else {
              segments = [
                { label: 'Resttage', value: d.resttage, color: c.color },
                { label: 'genehmigt', value: d.genehmigt, color: '#00cec9' },
                { label: 'geplant', value: d.geplant, color: '#f1c40f' },
                { label: 'genommen', value: d.genommen, color: '#d35400' },
              ];
              total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
            }
            // UserId für Einzelübersicht, sonst null (Gesamt)
            let userId = null;
            if (title && title.startsWith('Übersicht:')) {
              const match = title.match(/\((\d+)\)$/);
              if (match) userId = Number(match[1]);
            }
            return (
              <div key={c.key} style={{
                background:'var(--color-bg-card)',
                borderRadius:12,
                padding:'1rem',
                boxShadow:'0 2px 12px 0 var(--color-shadow)'
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ color:'var(--color-accent)', fontWeight:700 }}>{c.key}</div>
                  <div style={{ fontSize:12, color:'var(--color-text-dim)' }}>{year}</div>
                </div>
                <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                  <Donut size={120} thickness={16} segments={segments} total={total} />
                  {/* Legende unter dem Donut */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:'0.95em', marginTop:8 }}>
                    {segments.map(seg => (
                      <div key={seg.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ display:'inline-block', width:14, height:14, borderRadius:3, background:seg.color, marginRight:4 }}></span>
                        <span style={{ color:'var(--color-accent2)', minWidth:80 }}>{seg.label}</span>
                        <span style={{ fontWeight:700 }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status-Filter im Dashboard entfernt */}
      {isAdmin && (
        <div style={{
          background:'var(--color-bg-card)',
          borderRadius:12,
          padding:'1rem',
          boxShadow:'0 2px 12px 0 var(--color-shadow)',
          marginBottom:16
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ color:'var(--color-accent)', fontWeight:700 }}>Urlaubskontingente (pro Mitarbeiter)</div>
            <button
              className="btn-secondary"
              onClick={()=> setAllowances({})}
              title="Alle Kontingente auf Standard (30) zurücksetzen"
            >Zurücksetzen</button>
          </div>
          {/* Jahr + Dropdown */}
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
            <label style={{ color:'var(--color-accent2)' }}>Jahr</label>
            <select className="input" value={year} onChange={e=> setYear(Number(e.target.value))} style={{ width: 110 }}>
              {Array.from({length:5}).map((_,i)=>{
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
          <AllowancesEditor
            users={users}
            getAllowance={(uid, type)=>getAllowance(type, uid)}
            setAllowance={(uid, type, val)=>setAllowance(uid, type, val)}
            selectedId={selectedUserId}
            onSelect={val => setSelectedUserId(val)}
          />
        </div>
      )}
      {isAdmin && calcAll && (
        <Section
          title={selectedUserId ? `Übersicht: ${((users||[]).find(u=>String(u.id)===String(selectedUserId))||{}).username || 'Mitarbeiter'}` : 'Gesamt (alle Mitarbeiter)'}
          data={calcAll}
          year={year}
        />
      )}
      <Section title={isAdmin ? 'Meine Übersicht' : 'Übersicht'} data={calcMine} year={year} />
    </div>
  );
}
