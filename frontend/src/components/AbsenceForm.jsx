import React, { useState } from "react";
import { addWorkingDays, countWorkingDays } from "./AbsenceOverview";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("de", de);

export default function AbsenceForm({ onAdd }) {
  const [type, setType] = useState("");
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [note, setNote] = useState("");
  const [hasATest, setHasATest] = useState(false);

  function submit(e){
    e.preventDefault();
    if(!type || !start) return;
    const fmt = d => {
      if(!d) return "";
      const x = new Date(d);
      const y = x.getFullYear();
      const m = String(x.getMonth()+1).padStart(2,'0');
      const day = String(x.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    };
    let realEnd = end;
    // Nur für Urlaub: Wenn Enddatum leer und User gibt "14" Tage Urlaub ein, rechne Enddatum als 14 Werktage ab Start
    if(type === "Urlaub" && start && !end) {
      // Prompt für Anzahl der Urlaubstage (Werktage)
      const days = window.prompt("Wie viele Urlaubstage (Werktage) möchtest du nehmen?", "1");
      const n = Number(days);
      if(n > 0) {
        realEnd = addWorkingDays(start, n-1); // inkl. Starttag
      }
    }
    // Wenn Enddatum gesetzt, prüfe Werktage
    if(type === "Urlaub" && start && realEnd) {
      const n = countWorkingDays(start, realEnd);
      // Optional: Hinweis, wie viele Werktage es wirklich sind
      if(end && n > 0) {
        window.alert(`Im gewählten Zeitraum sind das ${n} Urlaubstage (Werktage).`);
      }
    }
    onAdd({ type, startDate: fmt(start), endDate: realEnd ? fmt(realEnd) : null, note, hasATest });
    setType(""); setStart(null); setEnd(null); setNote(""); setHasATest(false);
  }

  return (
    <form onSubmit={submit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label>Art</label>
          <select
            className="input"
            value={type}
            onChange={e=>{
              const v = e.target.value;
              setType(v);
              if (v === "Krank mit A-test") setHasATest(true);
              else if (v === "Krank- ohne A-test") setHasATest(false);
              else setHasATest(false);
            }}
            required
          >
            <option value="" disabled>Bitte wählen</option>
            <option value="Urlaub">Urlaub</option>
            <option value="Krank mit A-test">Krank mit A-test</option>
            <option value="Krank- ohne A-test">Krank- ohne A-test</option>
            <option value="Sonderurlaub">Sonderurlaub</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="absence-start">Start (Datum)</label>
          <DatePicker
            id="absence-start"
            selected={start}
            onChange={setStart}
            dateFormat="P"
            placeholderText="Datum wählen"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
        </div>
        <div className="form-group">
          <label htmlFor="absence-end">Ende (optional)</label>
          <DatePicker
            id="absence-end"
            selected={end}
            onChange={setEnd}
            dateFormat="P"
            placeholderText="Datum wählen"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Notiz</label>
          <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
        </div>
        <div className="form-group" style={{alignSelf:'end'}}>
          <label title="Wird automatisch anhand der Art gesetzt">
            <input type="checkbox" checked={hasATest} readOnly disabled />
            <span style={{marginLeft:8}}>A-test (automatisch)</span>
          </label>
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Speichern</button>
      </div>
    </form>
  );
}
