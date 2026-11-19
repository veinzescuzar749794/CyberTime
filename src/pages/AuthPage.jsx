import { useState } from 'react';
import Brand from '../components/Brand.jsx';

export default function AuthPage({ onSubmit }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      if (isRegister && form.get('password') !== form.get('confirmPassword')) {
        throw new Error('Passwords do not match.');
      }
      await onSubmit({
        mode,
        identifier: form.get('identifier'),
        username: form.get('username'),
        studentId: form.get('studentId'),
        password: form.get('password'),
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return <main className="login">
    <Brand />
    <section className="loginbox">
      {isRegister && <button type="button" className="backbutton" onClick={() => changeMode('login')}>? Go back to main</button>}
      <div className="eyebrow">{isRegister ? 'JOIN CYBERTIME' : 'WELCOME BACK'}</div>
      <h1>{isRegister ? 'Create your member account' : 'Sign in to your account'}</h1>
      <p>{isRegister ? 'Register to keep your account and prepaid balance in one place.' : 'Manage your account and play time in one place.'}</p>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        {isRegister ? <>
          <label>Username<input name="username" required minLength="3" maxLength="40" autoComplete="username" placeholder="Choose a username" /></label>
          <label>Student ID <span className="optional">(optional)</span><input name="studentId" autoComplete="off" placeholder="Enter your student ID" /></label>
        </> : <label>Username or Student ID<input name="identifier" required autoComplete="username" placeholder="Enter your username or ID" /></label>}
        <label>Password<input name="password" type="password" required minLength="8" maxLength="72" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} /></label>
        {isRegister && <label>Confirm password<input name="confirmPassword" type="password" required minLength="8" maxLength="72" autoComplete="new-password" placeholder="Re-enter your password" /></label>}
        <button disabled={busy}>{busy ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in')} <span>?</span></button>
      </form>
      <small>{isRegister ? 'Already have an account? ' : 'New to CyberTime? '}<button className="linkbutton" onClick={() => changeMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Sign in' : 'Create an account'}</button>
        {isRegister && <span className="registerhint">New member accounts start with ?0.00. Visit the cashier to add prepaid credit.</span>}
      </small>
    </section>
    <footer>2026 CyberTime · Secure account access</footer>
  </main>;
}
