import { useEffect, useState } from 'react';
import { apiRequest } from './api/client.js';
import { getCurrentUser, signIn, signOut, signUp } from './api/auth.js';
import { addCashTopUp, createMember, listMembers } from './api/members.js';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshMembers() {
    if (user && ['CASHIER', 'ADMIN'].includes(user.role)) setUsers(await listMembers());
  }

  useEffect(() => { getCurrentUser().then(({ user: current })=>setUser(current)).catch(()=>{}); }, []);
  useEffect(() => { if(user&&['CASHIER','ADMIN'].includes(user.role)) refreshMembers().catch(e=>setError(e.message)); }, [user?.id]);

  async function authenticate({ mode, identifier, username, studentId, password }) {
    const result = mode==='register' ? await signUp(username, studentId, password) : await signIn(identifier, password);
    setUser(result.user);
    setView('overview');
  }

  async function registerMember(event) {
    event.preventDefault(); setError(''); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      await createMember({ username:form.get('username'), studentId:form.get('studentId'), password:form.get('password'), initialDeposit:Number(form.get('initialDeposit')||0), role:'PATRON' });
      event.currentTarget.reset(); setNotice('Patron account created.'); await refreshMembers();
    } catch(error) { setError(error.message); }
  }

  async function topUp(memberId) {
    const amount = window.prompt('Cash top-up amount (PHP):');
    if(amount===null) return;
    try { await addCashTopUp(memberId, Number(amount)); setNotice('Cash top-up recorded.'); await refreshMembers(); }
    catch(error) { setError(error.message); }
  }

  async function logout() {
    try { await signOut(); } finally { setUser(null); setUsers([]); setView('overview'); }
  }

  if(!user) return <AuthPage onSubmit={authenticate}/>;
  return <DashboardPage user={user} users={users} view={view} setView={setView} error={error} setError={setError} notice={notice} setNotice={setNotice} onCreateMember={registerMember} onRefresh={refreshMembers} onTopUp={topUp} onLogout={logout}/>;
}
