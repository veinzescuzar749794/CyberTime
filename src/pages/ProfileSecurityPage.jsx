import { useState } from 'react';

export default function ProfileSecurityPage({ user, onSaveProfile, onChangePassword }) {
  const [profileBusy,setProfileBusy]=useState(false);const [passwordBusy,setPasswordBusy]=useState(false);const [profileError,setProfileError]=useState('');const [profileNotice,setProfileNotice]=useState('');const [passwordError,setPasswordError]=useState('');const [passwordNotice,setPasswordNotice]=useState('');
  async function saveProfile(event){event.preventDefault();setProfileBusy(true);setProfileError('');setProfileNotice('');const f=new FormData(event.currentTarget);try{await onSaveProfile({username:f.get('username'),email:f.get('email'),studentId:f.get('studentId'),fullName:f.get('fullName')});setProfileNotice('Profile saved.')}catch(e){setProfileError(e.message)}finally{setProfileBusy(false)}}
  async function changePassword(event){event.preventDefault();setPasswordBusy(true);setPasswordError('');setPasswordNotice('');const f=new FormData(event.currentTarget);try{const result=await onChangePassword(f.get('currentPassword'),f.get('newPassword'),f.get('confirmPassword'));setPasswordNotice(result.message);event.currentTarget.reset()}catch(e){setPasswordError(e.message)}finally{setPasswordBusy(false)}}
  return <div className="settings-grid"><section className="panel formpanel"><div className="panelhead"><div><h3>Your profile</h3><p>Edit details for your own CyberTime account.</p></div></div>
    {profileError&&<div className="alert formmessage">{profileError}</div>}{profileNotice&&<div className="success formmessage">{profileNotice}</div>}
    <form className="memberform" onSubmit={saveProfile}>
      <label>Full name<input name="fullName" maxLength="100" defaultValue={user.fullName||''} placeholder="Your name"/></label>
      <label>Username<input name="username" required minLength="3" maxLength="40" defaultValue={user.username} autoComplete="username"/></label>
      <label>Email address<input name="email" type="email" required maxLength="254" defaultValue={user.email||''} autoComplete="email"/></label>
      <label>Student ID<input name="studentId" maxLength="40" defaultValue={user.studentId||''} placeholder="Optional"/></label>
      <div className="formnote">Keep your email current so you can receive password reset links.</div><button className="primary" disabled={profileBusy}>{profileBusy?'Saving...':'Save profile'}</button>
    </form>
  </section><section className="panel formpanel"><div className="panelhead"><div><h3>Change password</h3><p>Confirm your current password to set a new one.</p></div></div>
    {passwordError&&<div className="alert formmessage">{passwordError}</div>}{passwordNotice&&<div className="success formmessage">{passwordNotice}</div>}
    <form className="memberform singlecol" onSubmit={changePassword}>
      <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password"/></label>
      <label>New password<input name="newPassword" type="password" required minLength="8" maxLength="72" autoComplete="new-password"/></label>
      <label>Confirm new password<input name="confirmPassword" type="password" required minLength="8" maxLength="72" autoComplete="new-password"/></label>
      <div className="formnote">After a successful change, all active sign-ins are ended. Sign in again using your new password.</div><button className="primary" disabled={passwordBusy}>{passwordBusy?'Updating...':'Change password'}</button>
    </form>
  </section></div>;
}
