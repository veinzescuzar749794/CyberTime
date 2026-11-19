export default function MemberAccountsPage({ users, onRefresh, onTopUp }) {
  return <section className="panel"><div className="panelhead"><div><h3>Member accounts</h3><p>Registered users and their current prepaid balance.</p></div><button className="smallbutton" onClick={onRefresh}>? Refresh</button></div>
    <div className="tablewrap"><table><thead><tr><th>MEMBER</th><th>STUDENT ID</th><th>ROLE</th><th>BALANCE</th><th></th></tr></thead>
      <tbody>{users.map((user)=><tr key={user.id}><td><b>{user.username}</b><small>CT-{String(user.id).padStart(5,'0')}</small></td><td>{user.studentId||'—'}</td><td><span className="rolebadge">{user.role}</span></td><td><b>?{Number(user.balance).toFixed(2)}</b></td><td>{user.role==='PATRON'&&<button className="smallbutton" onClick={()=>onTopUp(user.id)}>+ Cash top-up</button>}</td></tr>)}</tbody>
    </table>{!users.length&&<div className="empty">No accounts yet.</div>}</div>
  </section>;
}
