import { useEffect, useState } from 'react';
import Brand from '../components/Brand.jsx';

export default function AuthPage({ onSubmit, onForgot, initialMessage = '', initialMode = 'login' }) {
  const [mode,setMode]=useState(initialMode);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState(initialMessage);
  useEffect(()=>setNotice(initialMessage),[initialMessage]);
  const isRegister=mode==='register';const isForgot=mode==='forgot';
  async function handleSubmit(event){event.preventDefault();setBusy(true);setError('');setNotice('');const form=new FormData(event.currentTarget);try{if(isForgot){const result=await onForgot(form.get('email'));setNotice(result.message);event.currentTarget.reset();return}if(isRegister&&form.get('password')!==form.get('confirmPassword'))throw new Error('Passwords do not match.');await onSubmit({mode,identifier:form.get('identifier'),username:form.get('username'),studentId:form.get('studentId'),email:form.get('email'),password:form.get('password')})}catch(e){setError(e.message)}finally{setBusy(false)}}
  function changeMode(next){setMode(next);setError('');setNotice('')}
  return <main className="login"><Brand/><section className="loginbox">
    {mode!=='login'&&<button type="button" className="backbutton" onClick={()=>changeMode('login')}>{'\u2190'} Go back to main</button>}
    <div className="eyebrow">{isForgot?'ACCOUNT RECOVERY':isRegister?'JOIN CYBERTIME':'WELCOME BACK'}</div><h1>{isForgot?'Forgot your password?':isRegister?'Create your member account':'Sign in to your account'}</h1>
    <p>{isForgot?'We will email you a secure, one-time reset link.':isRegister?'Register to keep your account and prepaid balance in one place.':'Manage your account and play time in one place.'}</p>
    {error&&<div className="alert">{error}</div>}{notice&&<div className="success">{notice}</div>}
    <form onSubmit={handleSubmit}>
      {isForgot?<label>Email address<input name="email" type="email" required autoComplete="email" placeholder="The email on your account"/></label>:isRegister?<><label>Username<input name="username" required minLength="3" maxLength="40" autoComplete="username" placeholder="Choose a username"/></label><label>Email address<input name="email" type="email" required maxLength="254" autoComplete="email" placeholder="Used for password recovery"/></label><label>Student ID <span className="optional">(optional)</span><input name="studentId" autoComplete="off" placeholder="Enter your student ID"/></label></>:<label>Username or Student ID<input name="identifier" required autoComplete="username" placeholder="Enter your username or ID"/></label>}
      {!isForgot&&<><label>Password<input name="password" type="password" required minLength="8" maxLength="72" autoComplete={isRegister?'new-password':'current-password'} placeholder={isRegister?'At least 8 characters':'Enter your password'}/></label>{isRegister&&<label>Confirm password<input name="confirmPassword" type="password" required minLength="8" maxLength="72" autoComplete="new-password" placeholder="Re-enter your password"/></label>}</>}
      <button disabled={busy}>{busy?(isForgot?'Sending link...':isRegister?'Creating account...':'Signing in...'):(isForgot?'Send reset link':isRegister?'Create account':'Sign in')} <span>{'\u2192'}</span></button>
    </form>
    {mode==='login'?<div className="authlinks"><button className="linkbutton" onClick={()=>changeMode('forgot')}>Forgot password?</button><small>New to CyberTime? <button className="linkbutton" onClick={()=>changeMode('register')}>Create an account</button></small></div>:isRegister?<small>Already have an account? <button className="linkbutton" onClick={()=>changeMode('login')}>Sign in</button><span className="registerhint">New member accounts start with ?0.00. Visit the cashier to add prepaid credit.</span></small>:<small>Remember your password? <button className="linkbutton" onClick={()=>changeMode('login')}>Sign in</button></small>}
  </section><footer>2026 CyberTime · Secure account access</footer></main>;
}
