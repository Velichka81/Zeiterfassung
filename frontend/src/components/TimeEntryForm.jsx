import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("de", de);

export default function TimeEntryForm({ onAdd }) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");

  const categories = [
    "Arbeit",
    "Meeting",
    "Pause",
    "Kunde",
    "Entwicklung",
    "Testing",
    "Support",
    "Recherche",
    "Verwaltung",
  ];

  function handleSubmit(e) {
    e.preventDefault();
    const finalCategory = selectedCategory === "__custom__" ? customCategory.trim() : selectedCategory;
    if (!start || !end || !finalCategory) return;
    onAdd({ start: start ? start.toISOString() : "", end: end ? end.toISOString() : "", category: finalCategory, note });
    setStart(null);
    setEnd(null);
    setSelectedCategory("");
    setCustomCategory("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start-datetime">Start</label>
          <DatePicker
            id="start-datetime"
            selected={start}
            onChange={setStart}
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Datum & Zeit wählen"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
        </div>
        <div className="form-group">
          <label htmlFor="end-datetime">Ende</label>
          <DatePicker
            id="end-datetime"
            selected={end}
            onChange={setEnd}
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Datum & Zeit wählen"
            className="input datepicker-input"
            calendarClassName="dashboard-datepicker"
            locale="de"
            isClearable
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category-select">Kategorie</label>
          <select
            id="category-select"
            name="category"
            className="input"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            required
          >
            <option value="" disabled>Bitte wählen</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">Eigene Kategorie…</option>
          </select>
        </div>
        {selectedCategory === "__custom__" && (
          <div className="form-group">
            <label htmlFor="category-custom">Eigene Kategorie</label>
            <input
              id="category-custom"
              name="categoryCustom"
              type="text"
              className="input"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="note-input">Notiz</label>
          <input id="note-input" name="note" type="text" className="input" value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Speichern</button>
      </div>
    </form>
  );
}
