import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import AuthShell from '../components/AuthShell';
import { socialProviderOf, skipNamePrompt } from '../lib/profile';

// Shown once after a Google/Apple sign-in that did not return a name (Apple only shares it on the first authorization, and users can hide it).
export default function CompleteProfile({ onSkip }) {
  const { session, notify } = useApp(); const { t } = useTranslation();
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false);
  const provider = socialProviderOf(session.user) === 'apple' ? 'Apple' : 'Google';
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!name.trim()) return notify(t('auth.nameRequired'), 'err');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } }); // only sets the display name; nothing else is touched
    if (error) { notify(error.message, 'err'); setBusy(false); }
  };
  return (
    <AuthShell>
      <h1>{t('auth.completeTitle')}</h1>
      <p className="auth-sub">{t('auth.completeSub', { provider })}</p>
      <form onSubmit={submit}>
        <label>{t('auth.displayName')}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus /></label>
        <button className="btn full" disabled={busy}>{busy ? t('common.pleaseWait') : t('auth.continue')}</button>
      </form>
      <p className="auth-foot"><button type="button" className="link" onClick={() => { skipNamePrompt(session.user); onSkip(); }}>{t('auth.skip')}</button></p>
    </AuthShell>
  );
}
