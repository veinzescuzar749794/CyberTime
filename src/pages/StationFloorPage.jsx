import { useState } from 'react';

function formatTime(totalSeconds){if(totalSeconds===null||totalSeconds===undefined)return '—';const n=Math.max(0,totalSeconds);const mins=Math.floor(n/60);const secs=n%60;return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`}

export default function StationFloorPage({stations,isAdmin,onRegister,onTopUp,onRefresh,loading}){
  const [name,setName]=useState('');const [ip,setIp]=useState('');const [formError,setFormError]=useState('');const [saving,setSaving]=useState(false);
  async function submit(event){event.preventDefault();setFormError('');setSaving(true);try{await onRegister(name,ip);setName('');setIp('')}catch(e){setFormError(e.message)}finally{setSaving(false)}}
  return <section className="panel stationpanel">
    <div className="panelhead"><div><h3>PC station floor</h3><p>Live terminal status and active session time. Refreshes automatically.</p></div><button className="smallbutton" onClick={onRefresh} disabled={loading}>{loading?'Refreshing...':'Refresh'}</button></div>
    {isAdmin&&<form className="station-add" onSubmit={submit}><label>PC name<input required maxLength="60" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. PC-01"/></label><label>IP address <span className="optional">(optional)</span><input maxLength="45" value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.101"/></label><button className="smallbutton" disabled={saving}>{saving?'Adding...':'Add terminal'}</button>{formError&&<span className="field-error">{formError}</span>}</form>}
    {!stations.length?<div className="station-empty">{isAdmin?'No terminals registered yet. Add a PC above to begin.':'No terminals have been registered yet.'}</div>:<div className="station-grid">{stations.map(s=><article className={`station-card ${s.status.toLowerCase()}`} key={s.pcId}>
      <div className="station-cardtop"><h4>{s.pcName}</h4><span className={`status-pill ${s.status.toLowerCase()}`}>{s.status.replace('_',' ')}</span></div>
      <div className="station-ip">{s.ipAddress||'IP not set'}</div>
      <div className="station-time"><span>TIME REMAINING</span><b>{formatTime(s.remainingSeconds)}</b></div>
      <div className="station-patron"><span>ACTIVE MEMBER</span><b>{s.patronUsername||'No active session'}</b></div>
      {s.patronUsername&&<div className="station-patron"><span>PREPAID BALANCE</span><b>?{Number(s.patronBalance).toFixed(2)}</b></div>}
      {s.patronUsername&&<button className="smallbutton topup-station" onClick={()=>onTopUp(s.pcId,s.pcName)}>Record cash top-up</button>}
    </article>)}</div>}
    <div className="station-note">Cash top-ups are recorded against the patron in the selected PC's active session and linked to that PC in transaction history.</div>
  </section>;
}
