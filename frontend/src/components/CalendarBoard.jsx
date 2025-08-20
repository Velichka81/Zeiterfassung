import React, { useMemo, useState } from "react";

function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1,0); x.setHours(23,59,59,999); return x; }
function startOfWeek(d){
  // Montag als Wochenanfang
  const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x;
}
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function formatMonth(d){ return d.toLocaleDateString('de-DE',{month:'long',year:'numeric'}); }
function hoursBetween(a,b){ const ms=(b-a); return ms>0? ms/36e5 : 0; }
function dateOnly(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }

function absenceCss(type, note, hasATest){
  const t = (type||'').toLowerCase();
  const n = (note||'').toLowerCase();
  if (t.startsWith('krank')) {
  const a = (hasATest === true) ? true : (n.includes('a-test') || n.includes('a test') || n.includes('atest') || n.includes('a‑test'));
  return a ? 'abs-krank-atest' : 'abs-krank';
  }
  if (t.startsWith('urlaub')) return 'abs-urlaub';
  if (t.startsWith('sonderurlaub')) return 'abs-sonderurlaub';
  return 'abs-default';
}

export default function CalendarBoard({ entries=[], absences=[], onDayClick=()=>{}, onEntryClick=()=>{}, onAbsenceClick=()=>{} }){
  const [cursor, setCursor] = useState(() => new Date());
  const [expanded, setExpanded] = useState(false);
  const monthStart = useMemo(()=>startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(()=>endOfMonth(cursor), [cursor]);
  const gridStart = useMemo(()=>startOfWeek(monthStart), [monthStart]);
  const days = useMemo(()=>Array.from({length:42},(_,i)=>addDays(gridStart,i)), [gridStart]);
  const visibleDays = useMemo(() => expanded ? days : days.slice(0, 7), [days, expanded]);

  // Abwesenheiten als Segmente je Tag (für Balken über mehrere Tage)
  const absenceSegments = useMemo(()=>{
    const map = new Map();
    for(const a of absences){
      if(!a.startDate) continue;
      const s = dateOnly(new Date(a.startDate));
      const e = a.endDate ? dateOnly(new Date(a.endDate)) : s;
      for(let d=new Date(s); d<=e; d=addDays(d,1)){
        const key = d.toISOString().slice(0,10);
        const pos = isSameDay(d,s) && isSameDay(d,e) ? 'single' : isSameDay(d,s) ? 'start' : isSameDay(d,e) ? 'end' : 'mid';
    if(!map.has(key)) map.set(key, []);
  map.get(key).push({ id:a.id, type:a.type, note:a.note, hasATest:a.hasATest, pos });
      }
    }
    return map;
  }, [absences]);

  // Zeiteinträge: Halbtag wenn <= 4h, sonst "full"
  const entryTiles = useMemo(()=>{
    const map = new Map();
    for(const e of entries){
      if(!e.start) continue;
      const s = new Date(e.start);
      const end = e.end ? new Date(e.end) : null;
      const key = dateOnly(s).toISOString().slice(0,10);
      const dur = end ? hoursBetween(s,end) : 0;
      const size = dur>0 && dur<=4 ? 'half' : 'full';
      if(!map.has(key)) map.set(key, []);
  map.get(key).push({ id:e.id, category:e.category, note:e.note, size });
    }
    return map;
  }, [entries]);

  return (
    <div>
      <div className="cal-header">
        <button className="cal-nav" aria-label="Voriger Monat" onClick={()=>setCursor(addDays(monthStart,-1))}>{'‹'}</button>
        <div className="cal-title">{formatMonth(monthStart)}</div>
        <div style={{display:'flex', gap:8}}>
          <button
            className="cal-nav"
            aria-label={expanded ? "Kalender einklappen" : "Kalender aufklappen"}
            onClick={()=>setExpanded(v=>!v)}
            title={expanded ? "Kalender einklappen" : "Kalender aufklappen"}
          >{expanded ? '▲' : '▼'}</button>
          <button className="cal-nav" aria-label="Nächster Monat" onClick={()=>setCursor(addDays(monthEnd,1))}>{'›'}</button>
        </div>
      </div>
      <div className="cal-grid cal-weekdays">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map((w)=> <div key={w} className="cal-weekday">{w}</div>)}
      </div>
      <div className="cal-grid">
        {visibleDays.map((d,idx)=>{
          const inMonth = d.getMonth()===monthStart.getMonth();
          const key = d.toISOString().slice(0,10);
          const segs = absenceSegments.get(key) || [];
          const tiles = entryTiles.get(key) || [];
          return (
            <div key={idx} className={`cal-cell ${inMonth?'':'cal-cell-dim'}`}>
              <button className="cal-daynum" onClick={()=>onDayClick(new Date(d))} title="Neuen Eintrag für diesen Tag beginnen">{d.getDate()}</button>
              <div className="cal-absences">
        {segs.map((s,i)=> (
                  <div
                    key={i}
                    className={`cal-abs ${s.pos} ${absenceCss(s.type,s.note,s.hasATest)}`}
          title={`${(s.type||'').toLowerCase().startsWith('krank') ? (s.hasATest? 'Krank mit A-test' : 'Krank- ohne A-test') : (s.type || 'Abwesenheit')}${s.note? ' – '+s.note:''}`}
                    onClick={()=> s.id && onAbsenceClick(s.id)}
                  ></div>
                ))}
              </div>
              <div className="cal-entries">
                {tiles.map((t,i)=> (
                  <div key={i} className={`cal-entry ${t.size}`} title={`${t.category || 'Eintrag'}${t.note? ' – '+t.note:''}`} onClick={()=> t.id && onEntryClick(t.id)}></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    {expanded && (
        <div className="cal-legend">
          <span className="legend-item"><span className="cal-abs start abs-urlaub"></span> Urlaub</span>
      <span className="legend-item"><span className="cal-abs start abs-krank"></span> Krank- ohne A-test</span>
      <span className="legend-item"><span className="cal-abs start abs-krank-atest"></span> Krank mit A-test</span>
          <span className="legend-item"><span className="cal-abs start abs-sonderurlaub"></span> Sonderurlaub</span>
          <span className="legend-item"><span className="cal-entry half"></span> Halbtägiger Eintrag</span>
          <span className="legend-item"><span className="cal-entry full"></span> Ganztägiger/mehrstündiger Eintrag</span>
        </div>
      )}
    </div>
  );
}
