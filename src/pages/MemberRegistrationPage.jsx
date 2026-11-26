import { useState } from 'react';

export default function MemberRegistrationPage({ onCreate }) {
  const [generatedPassword,setGeneratedPassword]=useState('');
  function generatePassword(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';const values=new Uint32Array(16);crypto.getRandomValues(values);const value=Array.from(values,n=>chars[n%chars.length]).join('');setGeneratedPassword(value);const input=document.querySelector('input[name="password"]');if(input){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}))}}
  return <section className="panel formpanel"><div className="panelhead"><div><h3>New patron account</h3><p>Register a member and optionally record their initial cash deposit.</p></div></div>
    <form className="memberform" onSubmit={onCreate}>
      <label>Full name <span className="optional">(optional)</span><input name="fullName" maxLength="100" placeholder="Member's name"/></label>
      <label>Username<input required minLength="3" maxLength="40" name="username" autoComplete="off" placeholder="e.g. alexgamer"/></label>
      <label>Email address <span className="optional">(recommended for password recovery)</span><input name="email" type="email" maxLength="254" placeholder="member@example.com"/></label>
      <label>Student ID <span className="optional">(optional)</span><input name="studentId" maxLength="40" placeholder="e.g. 2026-01234"/></label>
      <label>Temporary password<input required minLength="8" maxLength="72" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters"/></label>
      <button type="button" className="smallbutton passwordgenerate" onClick={generatePassword}>Generate secure temporary password</button>{generatedPassword&&<div className="formnote generatednote">Generated password: <b>{generatedPassword}</b> — share it securely with the member.</div>}
      <label>Initial cash deposit <span className="optional">(PHP, optional)</span><input name="initialDeposit" type="number" min="0" step="0.01" defaultValue="0"/></label>
      <div className="formnote">The member signs in with their username or Student ID. Adding an email helps them recover their account.</div>
      <button className="primary">Create patron account {'\u2192'}</button>
    </form>
  </section>;
}
