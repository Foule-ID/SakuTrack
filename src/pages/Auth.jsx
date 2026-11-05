import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
export default function Auth() {
  const { notify } = useApp();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); let r;
    if (mode === 'login') r = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    else if (mode === 'register') {
      if (f.password.length < 8) { notify('Use a password with at least 8 characters', 'err'); setBusy(false); return; }
      r = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name } } });
      if (!r.error && !r.data.session) notify('Check your email to confirm your account');
    } else {
      r = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: window.location.origin });
      if (!r.error) notify('Reset link sent. Check your email');
    }
    if (r.error) notify(r.error.message, 'err');
    setBusy(false);
  };
  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1>SakuTrack</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Create your account' : 'Reset your password'}</p>
        {mode === 'register' && <label>Name<input value={f.name} onChange={set('name')} /></label>}
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        {mode !== 'reset' && <label>Password<input type="password" required value={f.password} onChange={set('password')} /></label>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</button>
        <div className="links">
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>Sign in</button>}
          {mode !== 'register' && <button type="button" className="link" onClick={() => setMode('register')}>Create account</button>}
          {mode === 'login' && <button type="button" className="link" onClick={() => setMode('reset')}>Forgot password</button>}
        </div>
      </form>
    </div>
  );
}
