export default function MemberRegistrationPage({ onCreate }) {
  return <section className="panel formpanel"><div className="panelhead"><div><h3>New patron account</h3><p>Register a member and optionally record their initial cash deposit.</p></div></div>
    <form className="memberform" onSubmit={onCreate}>
      <label>Username<input required minLength="3" maxLength="40" name="username" autoComplete="off" placeholder="e.g. alexgamer" /></label>
      <label>Student ID <span className="optional">(optional)</span><input name="studentId" placeholder="e.g. 2026-01234" /></label>
      <label>Temporary password<input required minLength="8" maxLength="72" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" /></label>
      <label>Initial cash deposit <span className="optional">(PHP, optional)</span><input name="initialDeposit" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <div className="formnote">The member can sign in using their username or Student ID. Share their temporary password securely.</div>
      <button className="primary">Create patron account ?</button>
    </form>
  </section>;
}
