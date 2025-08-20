import React, { useState, useEffect, useRef } from "react";
import { fetchWithRetry } from "../api";

export default function LiveStempeluhr({ auth, onSessionChanged }) {
  const [workActive, setWorkActive] = useState(false);
  const [pauseActive, setPauseActive] = useState(false);
  const [workTime, setWorkTime] = useState(0); // in seconds
  const [pauseTime, setPauseTime] = useState(0); // in seconds
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [error, setError] = useState("");
  const intervalRef = useRef();
  // Projekt-Auswahl deaktiviert

    useEffect(() => {
      if (workActive && !pauseActive) {
        intervalRef.current = setInterval(() => {
          setWorkTime(t => t + 1);
        }, 1000);
      } else if (workActive && pauseActive) {
        intervalRef.current = setInterval(() => {
          setPauseTime(t => t + 1);
        }, 1000);
      } else {
        clearInterval(intervalRef.current);
      }
      return () => clearInterval(intervalRef.current);
    }, [workActive, pauseActive]);

  // Beim Mount prüfen, ob eine Session läuft und Zeiten initialisieren
  useEffect(() => {
    let abort = false;
    async function loadActive() {
      try {
  const res = await fetchWithRetry('/api/worksessions/me', { headers: { Authorization: `Bearer ${auth.token}` } });
  const list = await res.json();
        if (!Array.isArray(list)) return;
        const active = list.find(ws => !ws.endTime);
        if (active && !abort) {
          setCurrentSessionId(active.id);
          // Arbeitszeit (netto) seit Start in Sekunden = elapsed - (akkumulierte Pausen + ggf. laufende Pause)
          const started = new Date(active.startTime);
          const now = new Date();
          const elapsed = Math.max(0, Math.floor((now - started) / 1000));
          const paused = Number(active.pauseSeconds || 0);
          const isPaused = !!active.pauseActive;
          let ongoing = 0;
          if (isPaused && active.updatedAt) {
            const upd = new Date(active.updatedAt);
            ongoing = Math.max(0, Math.floor((now - upd) / 1000));
          }
          const totalPaused = paused + ongoing;
          setWorkTime(Math.max(0, elapsed - totalPaused));
          setPauseTime(totalPaused);
          setWorkActive(true);
          // Aktuellen Pausenstatus aus dem Backend übernehmen
          setPauseActive(isPaused);
        }
  } catch { /* ignore */ }
    }
    if (auth?.token) loadActive();
    return () => { abort = true; };
  }, [auth?.token]);

  // keine Projekte laden

  async function handleStartStop() {
    setError("");
    try {
      if (workActive) {
        // Stoppen
        if (!currentSessionId) {
          throw new Error("Keine laufende Session-ID gefunden");
        }
    const res = await fetchWithRetry(`/api/worksessions/stop/${currentSessionId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}` }
        });
    // ok
  setWorkActive(false);
  setPauseActive(false);
  setCurrentSessionId(null);
  if (onSessionChanged) onSessionChanged();
      } else {
        // Starten
  const res = await fetchWithRetry(`/api/worksessions/start`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const ws = await res.json();
  setCurrentSessionId(ws.id);
  setWorkTime(0);
  setPauseTime(0);
  setWorkActive(true);
  setPauseActive(false);
  if (onSessionChanged) onSessionChanged();
      }
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  async function handlePause() {
    if (!workActive || !currentSessionId) return;
    const next = !pauseActive;
    setPauseActive(next);
    setError("");
    try {
      const url = `/api/worksessions/pause/${currentSessionId}?pause=${next}&seconds=${pauseTime}`;
      await fetchWithRetry(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` }
      });
  // Liste aktualisieren (Statuspunkt sofort orange/grün)
  if (onSessionChanged) onSessionChanged();
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  function formatTime(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  return (
    <div className="live-stempeluhr-card" style={{
      background: 'var(--color-bg-card)',
      borderRadius: 16,
      padding: '2em',
      boxShadow: '0 2px 16px 0 var(--color-shadow)',
      maxWidth: 420,
      margin: '2em auto',
      color: 'var(--color-text)',
      fontWeight: 500,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.2em'
    }}>
      <h2 style={{
        color: 'var(--color-accent)',
        marginBottom: 0,
        fontWeight: 700,
        fontSize: '1.5em',
        letterSpacing: 0.2,
        textAlign: 'center'
      }}>Live‑Stempeluhr</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '2.5em',
        fontSize: '1.25em',
        margin: '0.5em 0 0.5em 0',
        fontWeight: 600
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{color:'var(--color-accent2)',fontSize:'0.95em'}}>Arbeitszeit</div>
          <div style={{fontFamily:'monospace',fontSize:'1.3em',marginTop:2}}>{formatTime(workTime)}</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{color:'var(--color-accent2)',fontSize:'0.95em'}}>Pausenzeit</div>
          <div style={{fontFamily:'monospace',fontSize:'1.3em',marginTop:2}}>{formatTime(pauseTime)}</div>
        </div>
      </div>
  {/* Projekt-Auswahl entfernt */}
      <div style={{display:'flex',gap:'1em',margin:'0.5em 0 0.5em 0',width:'100%',justifyContent:'center'}}>
        <button
          onClick={handleStartStop}
          style={{
            background: workActive ? 'var(--color-accent2)' : 'var(--color-accent)',
            color: 'var(--color-btn-text)',
            border: 'none',
            borderRadius: 8,
            padding: '0.7em 1.5em',
            fontWeight: 700,
            fontSize: '1.1em',
            cursor: 'pointer',
            boxShadow: '0 1px 6px 0 var(--color-shadow-btn)',
            transition: 'background 0.2s'
          }}
        >
          {workActive ? 'Arbeitszeit stoppen' : 'Arbeitszeit starten'}
        </button>
        <button
          onClick={handlePause}
          disabled={!workActive}
          style={{
            background: pauseActive ? 'var(--color-accent)' : 'var(--color-accent2)',
            color: 'var(--color-btn-text)',
            border: 'none',
            borderRadius: 8,
            padding: '0.7em 1.5em',
            fontWeight: 700,
            fontSize: '1.1em',
            cursor: !workActive ? 'not-allowed' : 'pointer',
            opacity: !workActive ? 0.6 : 1,
            boxShadow: '0 1px 6px 0 var(--color-shadow-btn)',
            transition: 'background 0.2s'
          }}
        >
          {pauseActive ? 'Pause beenden' : 'Pause starten'}
        </button>
      </div>
      {error && <div style={{color:'red',marginBottom:'0.8em',whiteSpace:'pre-wrap'}}>{error}</div>}
      <div style={{fontSize:'0.97em',color:'var(--color-text-dim)',marginTop:'0.5em',textAlign:'center'}}>
        Laufende Zeiten werden automatisch gespeichert.
      </div>
    </div>
  );
}
