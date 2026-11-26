export default function OverviewPage({ user, isStaff, openView, refreshMembers }) {
  return <>
    <div className="welcome"><div>
      <div className="eyebrow light">{isStaff ? 'CYBERTIME OPERATIONS' : 'YOUR CYBERTIME ACCOUNT'}</div>
      <h2>{isStaff ? 'Everything running smoothly.' : 'Your time, your game.'}</h2>
      <p>{isStaff ? 'Manage patron accounts and record in-person cash top-ups.' : 'Keep track of your prepaid balance and ask staff about adding more time.'}</p>
    </div><div className="spark">{'\u2736'}</div></div>
    <div className="cards">
      <article className="card"><div className="cardtop"><span>ACCOUNT ROLE</span><b>{'\u20b1'}</b></div><strong className="roletext">{user.role==='PATRON'?'Cafe Patron':user.role==='CASHIER'?'Shop Cashier':'Cafe Admin'}</strong><p>Access follows your assigned account role.</p></article>
      <article className="card balance"><div className="cardtop"><span>PREPAID BALANCE</span><b>{'\u20b1'}</b></div><strong>{'\u20b1'}{Number(user.balance).toLocaleString('en-PH',{minimumFractionDigits:2})}</strong><p>Available credit on your member account</p></article>
      <article className="card"><div className="cardtop"><span>ACCOUNT ID</span><b>#</b></div><strong>CT-{String(user.id).padStart(5,'0')}</strong><p>{user.studentId?`Student ID · ${user.studentId}`:'CyberTime member'}</p></article>
    </div>
    <section className="panel"><div className="panelhead"><div><h3>Account overview</h3><p>Your secure CyberTime member profile</p></div><span className="tag">{'\u25cf'} Active</span></div>
      <div className="details"><div><span>USERNAME</span><b>{user.username}</b></div><div><span>STUDENT ID</span><b>{user.studentId||'Not linked'}</b></div><div><span>ACCOUNT TYPE</span><b>{user.role}</b></div></div>
    </section>
    {isStaff&&<section className="panel"><div className="panelhead"><div><h3>Staff tools</h3><p>Cashier and admin account operations</p></div></div><div className="tools">
      <button onClick={()=>openView('register')}>+ Register a member <span>with initial cash deposit {'\u2192'}</span></button>
      <button onClick={()=>{openView('accounts');refreshMembers()}}>{'\u2659'} Browse accounts <span>record manual top-ups {'\u2192'}</span></button>
    </div></section>}
  </>;
}
