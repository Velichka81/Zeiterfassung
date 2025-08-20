import React, { useState } from 'react';
import { login, register } from '../api';

export default function AuthPanel({ onAuth }){
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e){
    e.preventDefault();
    setError('');
    try{
  const fn = mode==='login'? login : register;
  const res = await fn(username, password);
  // user_id speichern, falls vorhanden
  // Legacy-Token bereinigen
  try { localStorage.removeItem('token'); } catch { /* ignore */ }
  localStorage.setItem('auth', JSON.stringify({ username: res.username, role: res.role, token: res.token, user_id: res.user_id || res.id }));
  onAuth({ username: res.username, role: res.role, token: res.token, user_id: res.user_id || res.id });
    }catch(err){ setError(err.message || 'Fehler'); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">{mode==='login'? 'Anmeldung' : 'Registrierung'}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit} className="form">
          <div className="form-group">
            <label htmlFor="auth-username">Benutzername</label>
            <input id="auth-username" name="username" className="input" value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Passwort</label>
            <input id="auth-password" name="password" type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} required minLength={4} autoComplete={mode==='login' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn btn-block" type="submit">{mode==='login'? 'Einloggen' : 'Registrieren'}</button>
        </form>
        <div className="auth-switch">
          {mode==='login'? (
            <button className="link" onClick={()=>setMode('register')}>Noch kein Konto? Registrieren</button>
          ) : (
            <button className="link" onClick={()=>setMode('login')}>Schon ein Konto? Anmelden</button>
          )}
        </div>
      </div>
    </div>
  );
}
