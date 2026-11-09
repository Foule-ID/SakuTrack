import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import AuthShell from '../components/AuthShell';
import { GoogleIcon, AppleIcon } from '../components/SocialIcons';

// Known Supabase error codes get a translated message; anything else shows Supabase's own text.
const authMessage = (t, error) => { const k = 'auth.err.' + (error.code || ''); const s = t(k); return s === k ? error.message : s; };
const PROVIDERS = [['google', 'Google', GoogleIcon, 'auth.google'], ['apple', 'Apple', AppleIcon, 'auth.apple']];

export default function Auth() {
  const { notify } = useApp(); const { t } = useTranslation();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Returning from Google/Apple with an error (for example the user cancelled): show a friendly message and clean the URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const get = (k) => q.get(k) || h.get(k);
    const err = get('error'); if (!err) return;
    const desc = get('error_description') || err;
    const cancelled = err === 'access_denied' || /cancel/i.test(err + ' ' + desc);
    notify(cancelled ? t('auth.oauthCancelled') : t('auth.oauthFailed', { msg: desc }), cancelled ? 'ok' : 'err');
    window.history.replaceState(null, '', window.location.pathname);
  }, []); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); let r;
    if (mode === 'login') r = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    else if (mode === 'register') {
      if (f.password.length < 8) { notify(t('auth.pwShort'), 'err'); setBusy(false); return; }
      r = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name } } });
      if (!r.error && !r.data.session) notify(t('auth.confirmEmail'));
    } else {
      r = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: window.location.origin });
      if (!r.error) notify(t('auth.resetSent'));
    }
    if (r.error) notify(authMessage(t, r.error), 'err');
    setBusy(false);
  };

  // Real OAuth through the existing Supabase client. The provider must be enabled in the Supabase dashboard (see README).
  const social = async (provider, label) => {
    if (oauthBusy) return;
    setOauthBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) { notify(t('auth.oauthStartFailed', { provider: label, msg: error.message }), 'err'); setOauthBusy(null); return; }
    notify(t('auth.redirecting', { provider: label }));
    setTimeout(() => setOauthBusy(null), 8000); // if the browser stays on this page (e.g. blocked), do not leave the buttons disabled
  };

  const title = { login: 'auth.welcome', register: 'auth.createTitle', reset: 'auth.resetTitle' }[mode];
  const sub = { login: 'auth.signInSub', register: 'auth.createSub', reset: 'auth.resetSub' }[mode];
  return (
    <AuthShell>
      <h1>{t(title)}</h1>
      <p className="auth-sub">{t(sub)}</p>
      {mode !== 'reset' && (
        <>
          <div className="sbtns">
            {PROVIDERS.map(([p, label, Icon, key]) => (
              <button key={p} type="button" className={'sbtn ' + p} disabled={!!oauthBusy} onClick={() => social(p, label)}><Icon />{t(key)}</button>
            ))}
          </div>
          <div className="divider" role="separator"><span>{t('auth.or')}</span></div>
        </>
      )}
      <form onSubmit={submit}>
        {mode === 'register' && <label>{t('auth.name')}<input value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label>{t('auth.email')}<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
        {mode !== 'reset' && <label>{t('auth.password')}<input type="password" required value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}
        {mode === 'login' && <div className="auth-forgot"><button type="button" className="link" onClick={() => setMode('reset')}>{t('auth.forgot')}</button></div>}
        <button className="btn full" disabled={busy}>{busy ? t('common.pleaseWait') : mode === 'login' ? t('auth.signIn') : mode === 'register' ? t('auth.createAccount') : t('auth.sendReset')}</button>
      </form>
      <p className="auth-foot">
        {mode === 'login' && <>{t('auth.noAccount')} <button type="button" className="link" onClick={() => setMode('register')}>{t('auth.createAccount')}</button></>}
        {mode === 'register' && <>{t('auth.haveAccount')} <button type="button" className="link" onClick={() => setMode('login')}>{t('auth.signIn')}</button></>}
        {mode === 'reset' && <button type="button" className="link" onClick={() => setMode('login')}>{t('auth.backToSignIn')}</button>}
      </p>
    </AuthShell>
  );
}
