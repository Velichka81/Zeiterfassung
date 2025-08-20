import React, { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
import 'react-datepicker/dist/react-datepicker.css';
import { setUserWorkModel } from '../api';
import { addOvertimeAdjustment, listOvertimeAdjustments } from '../api-overtime';
import { fetchOpenWorkSessions } from '../api-worksession';

registerLocale('de', de);

function fmtHM(mins){
	const sign = mins < 0 ? '-' : '';
	const m = Math.abs(mins); const h = Math.floor(m/60); const mm = m%60;
	return `${sign}${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0); }
function endOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999); }
function minutesOverlap(start, end, dayStart, dayEnd) {
	if (!start) return 0; const s = new Date(start); const e = end ? new Date(end) : null; const realEnd = e || s;
	const a = Math.max(s.getTime(), dayStart.getTime()); const b = Math.min(realEnd.getTime(), dayEnd.getTime());
	return b > a ? Math.floor((b - a) / 60000) : 0;
}

export default function MitarbeiterVerwaltung({ auth, users, entries, absences }){
	const [from, setFrom] = useState(null);
	const [to, setTo] = useState(null);
	const [selUser, setSelUser] = useState('ALL');
	const [saving, setSaving] = useState(false);
	const [overtime, setOvertime] = useState({}); // userId -> list
	const [userLiveStatus, setUserLiveStatus] = useState({}); // userId -> 'online'|'pause'|'offline'

	useEffect(() => {
		let ignore = false;
		async function loadLiveStatus() {
			try {
				const openSessions = await fetchOpenWorkSessions(auth.token);
				const statusMap = {};
				// Für alle User bestimmen
				(users || []).forEach(u => {
					const sessions = openSessions.filter(s => s.userId === u.id);
					if (sessions.length > 0) {
						// Nehme die zuletzt gestartete offene Session
						const open = sessions.reduce((a, b) => new Date(a.startTime) > new Date(b.startTime) ? a : b);
						if (open.pauseActive) statusMap[u.id] = 'pause';
						else statusMap[u.id] = 'online';
					} else {
						statusMap[u.id] = 'offline';
					}
				});
				if (!ignore) setUserLiveStatus(statusMap);
			} catch {
				if (!ignore) setUserLiveStatus({});
			}
		}
		loadLiveStatus();
		const interval = setInterval(loadLiveStatus, 15000); // alle 15s aktualisieren
		return () => { ignore = true; clearInterval(interval); };
	}, [auth, users]);

	const filteredUsers = useMemo(()=> users || [], [users]);
	const selectedUserId = useMemo(()=> selUser==='ALL' ? null : Number(selUser), [selUser]);

	useEffect(()=>{
		let ignore=false;
		(async()=>{
			try{
				const map={};
				for (const u of filteredUsers){
					const data = await listOvertimeAdjustments(auth.token, { userId: u.id });
					if(!ignore) map[u.id]=data;
				}
				if(!ignore) setOvertime(map);
			}catch{ /* ignore */ }
		})();
		return ()=>{ ignore=true; };
	}, [auth, filteredUsers]);

	function calcKpisForUser(u){
		const byUserEntries = (entries||[]).filter(e => e.userId === u.id);
		const byUserAbsences = (absences||[]).filter(a => a.userId === u.id);
		const rangeFilter = (arr, getterStart, getterEnd) => {
			if (!from && !to) return arr;
			const f = from ? startOfDay(from) : null; const t = to ? endOfDay(to) : null;
			return arr.filter(x => {
				const s = getterStart(x); const e = getterEnd(x) || s;
				const afterF = !f || (e && e >= f); const beforeT = !t || (s && s <= t);
				return afterF && beforeT;
			});
		};
		const eFiltered = rangeFilter(byUserEntries, x=> x.start ? new Date(x.start) : null, x=> x.end ? new Date(x.end) : null);
		const aFiltered = rangeFilter(byUserAbsences, x=> x.startDate ? new Date(x.startDate) : null, x=> x.endDate ? new Date(x.endDate) : null);
		// Period days
		let days=[];
		const s = from ? startOfDay(from) : (eFiltered[0]?.start ? startOfDay(new Date(eFiltered[0].start)) : null);
		const e = to ? endOfDay(to) : (eFiltered[eFiltered.length-1]?.end ? endOfDay(new Date(eFiltered[eFiltered.length-1].end)) : null);
		if (s && e){
			const d0 = new Date(s); const d1 = new Date(e);
			for (let d = new Date(d0); d <= d1; d.setDate(d.getDate()+1)) days.push(new Date(d));
		}
		// daily SOLL from weekly minutes; default 2400
		const weekly = u.weeklyHoursMinutes ?? 2400;
		const workdays = 5; // MON-FRI
		const daily = Math.floor(weekly / workdays);
		let soll = 0, ist = 0;
		for (const d of days){
			const dow = d.getDay(); // 0 So..6 Sa
			let daySoll = (dow>=1 && dow<=5) ? daily : 0;
			// Approved absence cancels soll
			const hasApprovedAbs = aFiltered.some(a => a.status==='APPROVED' && !(new Date(a.endDate||a.startDate) < startOfDay(d) || new Date(a.startDate) > endOfDay(d)));
			if (hasApprovedAbs) daySoll = 0;
			soll += daySoll;
			ist += eFiltered.reduce((acc, en) => acc + minutesOverlap(en.start, en.end, startOfDay(d), endOfDay(d)), 0);
		}
		const adj = (overtime[u.id]||[]).reduce((sum,a)=> sum + (a.minutes||0), 0);
		const saldo = ist - soll + adj;
		return { soll, ist, adj, saldo };
	}

	async function saveWorkModel(u, nextWeeklyMinutes, nextModel){
		setSaving(true);
		try{
			await setUserWorkModel(u.id, { workModel: nextModel, weeklyHoursMinutes: nextWeeklyMinutes }, auth.token);
			alert('Arbeitszeitmodell gespeichert');
		}catch(e){ alert('Fehler: '+(e.message||e)); }
		finally{ setSaving(false); }
	}

	async function useOvertime(u, minutes, type){
		if (!minutes || minutes<=0) return alert('Bitte Minuten > 0 eingeben');
		if (!confirm(`Sicher ${minutes} Minuten für ${u.username} als ${type==='payout'?'Auszahlung':'Freizeitausgleich'} verbuchen?`)) return;
		try{
			await addOvertimeAdjustment(auth.token, { userId: u.id, date: new Date().toISOString().slice(0,10), minutes, type, note: 'Admin-Aktion' });
			alert('Erfasst.');
		}catch(e){ alert('Fehler: '+(e.message||e)); }
	}

	const uiUsers = useMemo(()=> selectedUserId ? filteredUsers.filter(u => u.id === selectedUserId) : filteredUsers, [filteredUsers, selectedUserId]);

	return (
		<div className="dashboard-card">
			<h2 style={{ color: 'var(--color-accent)', marginTop: 0 }}>Mitarbeiter</h2>
			<div className="toolbar" style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:12 }}>
				<div style={{ display:'flex', alignItems:'center', gap:8 }}>
					<label htmlFor="selUser" style={{ color:'var(--color-accent)', fontWeight:600 }}>Mitarbeiter:</label>
					<select id="selUser" value={selUser} onChange={e=>setSelUser(e.target.value)} className="input" style={{ maxWidth: 260 }}>
						<option value="ALL">Alle</option>
						{filteredUsers.map(u=> <option key={u.id} value={String(u.id)}>{u.username}</option>)}
					</select>
				</div>
				<div style={{ display:'flex', alignItems:'center', gap:8 }}>
					<label style={{ color:'var(--color-accent)', fontWeight:600 }}>Von:</label>
					<DatePicker selected={from} onChange={setFrom} dateFormat="P" placeholderText="tt.mm.jjjj" className="input datepicker-input" calendarClassName="dashboard-datepicker" locale="de" isClearable />
					<label style={{ color:'var(--color-accent)', fontWeight:600 }}>Bis:</label>
					<DatePicker selected={to} onChange={setTo} dateFormat="P" placeholderText="tt.mm.jjjj" className="input datepicker-input" calendarClassName="dashboard-datepicker" locale="de" isClearable />
				</div>
				<div style={{ marginLeft:'auto' }}>
					<button className="btn-secondary" onClick={()=>{ setSelUser('ALL'); setFrom(null); setTo(null); }}>Zurücksetzen</button>
				</div>
			</div>

			<div className="table-scroll-3" style={{ maxHeight: 460 }}>
				<table className="dashboard-table">
					<thead>
						<tr>
							<th>Mitarbeiter</th>
							<th>Modell</th>
							<th>Woche SOLL</th>
							<th>IST (Zeitraum)</th>
							<th>Überst.-Adj.</th>
							<th>Saldo</th>
							<th>Aktionen</th>
						</tr>
					</thead>
					<tbody>
									{uiUsers.map(u => {
										const k = calcKpisForUser(u);
										return (
											<MitarbeiterRow key={u.id} u={u} k={k} auth={auth} onSave={saveWorkModel} onUseOvertime={useOvertime} saving={saving} liveStatus={userLiveStatus[u.id] || 'offline'} />
										);
									})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function MitarbeiterRow({ u, k, auth, onSave, onUseOvertime, saving, liveStatus }){
	const [minutes, setMinutes] = useState(u.weeklyHoursMinutes ?? 2400);
	const [model, setModel] = useState(u.workModel || (minutes>=2400? 'FULLTIME' : 'PARTTIME'));
	const [useMin, setUseMin] = useState('');
	const expected = model==='FULLTIME' ? 2400 : model==='PARTTIME' ? 1200 : minutes;
	const mismatch = Number(minutes) !== Number(expected);
	return (
		<tr>
			<td>
				<div style={{ display:'flex', alignItems:'center', gap:10 }}>
					{u.imageUrl ? <img src={u.imageUrl} alt="avatar" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'1px solid var(--color-border)' }} /> : <span style={{ width:32, height:32, display:'inline-block', borderRadius:'50%', background:'#222', color:'#fff', textAlign:'center', lineHeight:'32px' }}>👤</span>}
					{/* Live-Indikator */}
					{liveStatus === 'online' && <span title="Online" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#2ecc40',marginLeft:2,boxShadow:'0 0 4px #2ecc40'}} />}
					{liveStatus === 'pause' && <span title="Pause" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#ff9800',marginLeft:2,boxShadow:'0 0 4px #ff9800'}} />}
					{liveStatus === 'offline' && <span title="Offline" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:'#e74c3c',marginLeft:2,boxShadow:'0 0 4px #e74c3c'}} />}
					<div style={{ fontWeight:700 }}>{u.username}</div>
				</div>
			</td>
			<td>
				<select className="input" value={model} onChange={e=>{ const v = e.target.value; setModel(v); if(v==='FULLTIME') setMinutes(2400); if(v==='PARTTIME') setMinutes(1200); }} style={{ maxWidth: 170 }}>
					<option value="FULLTIME">Vollzeit (40h)</option>
					<option value="PARTTIME">Teilzeit (20h)</option>
					<option value="CUSTOM">Individuell</option>
				</select>
			</td>
			<td>
				<div style={{ display:'flex', gap:6, alignItems:'center' }}>
					<input type="number" className="input" value={minutes} onChange={e=> setMinutes(Number(e.target.value)||0)} style={{ maxWidth: 120 }} />
					<span style={{ color: mismatch ? '#e67e22' : 'var(--color-text-dim)', fontSize:'0.9em' }}>{mismatch ? `Erwartet: ${expected} min` : 'min/Woche'}</span>
				</div>
				<div>
					<button className="btn-primary" disabled={saving} onClick={()=> onSave(u, minutes, model)} title={mismatch ? `Minuten weichen vom Modell ab (${expected})` : undefined}>Speichern</button>
				</div>
			</td>
			<td className="numeric">{fmtHM(k.ist)}</td>
			<td className="numeric">{fmtHM(k.adj)}</td>
			<td className="numeric" style={{ color: k.saldo<0?'#e74c3c':k.saldo>0?'#2ecc71':'inherit', fontWeight:700 }}>{fmtHM(k.saldo)}</td>
			<td>
				<div className="action-row" style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
					<input type="number" className="input" placeholder="Minuten" value={useMin} onChange={e=> setUseMin(e.target.value)} style={{ maxWidth: 120 }} />
					<button className="btn-secondary" onClick={()=> onUseOvertime(u, Number(useMin)||0, 'payout')}>Auszahlen</button>
					<button className="btn-secondary" onClick={()=> onUseOvertime(u, Number(useMin)||0, 'comp_time')}>Freizeit</button>
				</div>
			</td>
		</tr>
	);
}

