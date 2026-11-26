import { useEffect, useState } from 'react';
import { getCurrentUser, requestPasswordReset, signIn, signOut, signUp, submitPasswordReset } from './api/auth.js';
import { addCashTopUp, createMember, listMembers } from './api/members.js';
import { getProfile, saveProfile, updatePassword } from './api/profile.js';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

export default function App() {
  const [user,setUser]=useState(null);const [users,setUsers]=useState([]);const [view,setView]=useState('overview');const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [resetToken,setResetToken]=useState(()=>new URLSearchParams(window.location.search).get('reset_token'));
  const [authStartMode]=useState(()=>new URLSearchParams(window.location.search).get('auth')==='forgot'?'forgot':'login');
  const [authMessage,setAuthMessage]=useState('');
  async function refreshMembers(){if(user&&['CASHIER','ADMIN'].includes(user.role))setUsers(await listMembers())}
  useEffect(()=>{getCurrentUser().then(({user:current})=>setUser(current)).catch(()=>{});},[]);
  useEffect(()=>{if(user&&['CASHIER','ADMIN'].includes(user.role))refreshMembers().catch(e=>setError(e.message));},[user?.id]);
  useEffect(()=>{if(user&&view==='profile')getProfile().then(setUser).catch(e=>setError(e.message));},[user?.id,view]);
  async function authenticate({mode,identifier,username,studentId,email,password}){const result=mode==='register'?await signUp(username,studentId,email,password):await signIn(identifier,password);setUser(result.user);setView('overview');setAuthMessage('')}
  async function saveOwnProfile(profile){const updated=await saveProfile(profile);setUser(updated)}
  async function changeOwnPassword(current,next,confirm){const result=await updatePassword(current,next,confirm);setAuthMessage(result.message);setUser(null);setUsers([]);setView('overview');return result}
  async function registerMember(event){event.preventDefault();setError('');setNotice('');const f=new FormData(event.currentTarget);try{await createMember({username:f.get('username'),studentId:f.get('studentId'),email:f.get('email'),fullName:f.get('fullName'),password:f.get('password'),initialDeposit:Number(f.get('initialDeposit')||0),role:'PATRON'});event.currentTarget.reset();setNotice('Patron account created.');await refreshMembers()}catch(e){setError(e.message)}}
  async function topUp(memberId){const amount=window.prompt('Cash top-up amount (PHP):');if(amount===null)return;try{await addCashTopUp(memberId,Number(amount));setNotice('Cash top-up recorded.');await refreshMembers()}catch(e){setError(e.message)}}
  async function logout(){try{await signOut()}finally{setUser(null);setUsers([]);setView('overview')}}
  async function completeReset(token,password,confirm){return submitPasswordReset(token,password,confirm)}
  function cancelReset(){window.history.replaceState({},'',window.location.pathname);setResetToken(null)}
  if(resetToken)return <ResetPasswordPage token={resetToken} onComplete={completeReset} onBack={cancelReset}/>;
  if(!user)return <AuthPage onSubmit={authenticate} onForgot={requestPasswordReset} initialMessage={authMessage} initialMode={authStartMode}/>;
  return <DashboardPage user={user} users={users} view={view} setView={setView} error={error} setError={setError} notice={notice} setNotice={setNotice} onCreateMember={registerMember} onRefresh={refreshMembers} onTopUp={topUp} onLogout={logout} onSaveProfile={saveOwnProfile} onChangePassword={changeOwnPassword}/>;
}
