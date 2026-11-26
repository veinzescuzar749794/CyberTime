import Brand from '../components/Brand.jsx';
import { ErrorMessage, SuccessMessage } from '../components/Feedback.jsx';
import OverviewPage from './OverviewPage.jsx';
import MemberRegistrationPage from './MemberRegistrationPage.jsx';
import MemberAccountsPage from './MemberAccountsPage.jsx';
import ProfileSecurityPage from './ProfileSecurityPage.jsx';
import StationFloorPage from './StationFloorPage.jsx';

export default function DashboardPage({ user, users, view, setView, error, setError, notice, setNotice, onCreateMember, onRefresh, onTopUp, onLogout, onSaveProfile, onChangePassword, stations, stationsLoading, onRefreshStations, onRegisterStation, onStationTopUp }) {
  const isStaff=['CASHIER','ADMIN'].includes(user.role);
  const title=view==='register'?'Register a member':view==='accounts'?'Member accounts':view==='profile'?'Profile & Security':view==='stations'?'PC station floor':`Good day, ${user.username}`;
  return <div className="app"><aside className="sidebar"><Brand subtitle="CAFE MANAGEMENT"/><div className="sectionlabel">WORKSPACE</div>
    <button className={view==='overview'?'nav active':'nav'} onClick={()=>setView('overview')}>? Overview</button>
    <button className={view==='profile'?'nav active':'nav'} onClick={()=>setView('profile')}>? Profile & Security</button>
    {isStaff&&<><button className={view==='stations'?'nav active':'nav'} onClick={()=>setView('stations')}>PC station floor</button><button className={view==='accounts'?'nav active':'nav'} onClick={()=>setView('accounts')}>? Member accounts</button><button className={view==='register'?'nav active':'nav'} onClick={()=>setView('register')}>+ Register member</button></>}
    <div className="sidebottom"><div className="avatar">{user.username[0].toUpperCase()}</div><div className="who"><b>{user.username}</b><span>{user.role}</span></div><button className="logout" onClick={onLogout} title="Sign out">{'\u21aa'}</button></div>
  </aside><main className="content"><header><div><div className="eyebrow">{user.role==='PATRON'?'MEMBER PORTAL':'STAFF CONSOLE'}</div><h1>{title}</h1></div><div className="pill"><i/> {user.role}</div></header>
    <ErrorMessage onClose={()=>setError('')}>{error}</ErrorMessage><SuccessMessage onClose={()=>setNotice('')}>{notice}</SuccessMessage>
    {view==='overview'&&<OverviewPage user={user} isStaff={isStaff} openView={setView} refreshMembers={onRefresh}/>}
    {view==='register'&&isStaff&&<MemberRegistrationPage onCreate={onCreateMember}/>}
    {view==='accounts'&&isStaff&&<MemberAccountsPage users={users} onRefresh={onRefresh} onTopUp={onTopUp}/>}
    {view==='profile'&&<ProfileSecurityPage user={user} onSaveProfile={onSaveProfile} onChangePassword={onChangePassword}/>}
    {view==='stations'&&isStaff&&<StationFloorPage stations={stations} isAdmin={user.role==='ADMIN'} onRegister={onRegisterStation} onTopUp={onStationTopUp} onRefresh={onRefreshStations} loading={stationsLoading}/>}
  </main></div>;
}
