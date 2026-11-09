import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../lib/format';
import { displayNameOf, socialProviderOf } from '../lib/profile';
import { useTranslation } from '../hooks/useTranslation';

const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function Settings() {
  const { session, data, sync, cur, setCur, api, notify } = useApp();
  const { t, lang, setLang, languages, locale, syncText, acct } = useTranslation();
  const [name, setName] = useState(displayNameOf(session.user));
  const [acc, setAcc] = useState(''); const [backups, setBackups] = useState([]); const [busy, setBusy] = useState(false);
  const loadBackups = () => api.listBackups().then(({ data: d, error }) => (error ? notify(t('settings.backupsFailed', { msg: error.message }), 'err') : setBackups(d)));
  useEffect(() => { loadBackups(); }, []); // eslint-disable-line
  const guard = (fn) => async () => { setBusy(true); try { await fn(); } catch { /* shown */ } setBusy(false); };

  const saveName = async () => { const { error } = await supabase.auth.updateUser({ data: { name } }); error ? notify(error.message, 'err') : notify(t('settings.profileSaved')); };
  const addAcc = async () => { const n = acc.trim(); if (!n) return; try { await api.addAccount(n); setAcc(''); } catch { /* shown */ } };
  const exportCsv = () => {
    const cols = ['date', 'time', 'type', 'title', 'amount', 'currency', 'category', 'account', 'to_currency', 'to_amount', 'rate', 'notes'];
    download('sakutrack-transactions.csv', [cols.join(','), ...data.tx.map((t) => cols.map((c) => csvCell(t[c])).join(','))].join('\n'), 'text/csv');
  };
  return (
    <>
      <header className="head"><h1>{t('nav.settings')}</h1></header>
      <div className="card"><h2>{t('settings.profile')}</h2>
        <p className="muted">{session.user.email}</p>
        {socialProviderOf(session.user) && <p className="muted small">{t('settings.signedInWith', { provider: socialProviderOf(session.user) === 'google' ? 'Google' : 'Apple' })}</p>}
        <div className="two"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('common.name')} aria-label={t('common.name')} /><button className="btn" onClick={saveName}>{t('settings.saveProfile')}</button></div>
        <label>{t('settings.language')}<select value={lang} onChange={(e) => setLang(e.target.value)}>{Object.entries(languages).map(([code, l]) => <option key={code} value={code} lang={code}>{l.name}</option>)}</select></label>
        <p className="muted small">{t('settings.languageHint')}</p>
        <label>{t('settings.mainCurrency')}<select value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <button className="ghost danger" onClick={api.signOut}>{t('settings.logout')}</button></div>
      <div className="card"><h2>{t('settings.accounts')}</h2>
        <p className="muted small">{t('settings.accountsHint')}</p>
        <ul className="list">{data.accounts.map((a) => <li className="row" key={a.id}><span className="grow">{acct(a.name)}</span><button className="ghost danger" onClick={() => api.delAccount(a.id).catch(() => {})}>{t('common.remove')}</button></li>)}</ul>
        <div className="two"><input value={acc} onChange={(e) => setAcc(e.target.value)} placeholder={t('settings.accountPh')} aria-label={t('settings.accountPh')} /><button className="btn" onClick={addAcc}>{t('settings.addAccount')}</button></div></div>
      <div className="card"><h2>{t('settings.backup')}</h2>
        <p className={'sync ' + sync.state}>{t('settings.status', { msg: syncText(sync) })}</p>
        <div className="acts wrap"><button className="btn" disabled={busy} onClick={guard(async () => { await api.backup(); await loadBackups(); })}>{t('settings.backupNow')}</button>
          <button className="ghost" onClick={() => download('sakutrack-backup.json', JSON.stringify(data, null, 2), 'application/json')}>{t('settings.exportJson')}</button>
          <button className="ghost" onClick={exportCsv}>{t('settings.exportCsv')}</button></div>
        <h3>{t('settings.restore')}</h3><p className="muted small">{t('settings.restoreHint')}</p>
        {backups.length ? <ul className="list">{backups.map((b) => <li className="row" key={b.id}><span className="grow">{new Date(b.created_at).toLocaleString(locale)}</span><button className="ghost" disabled={busy} onClick={guard(async () => { if (confirm(t('settings.restoreConfirm'))) await api.restore(b.id); })}>{t('settings.restore')}</button></li>)}</ul> : <p className="muted">{t('settings.noBackups')}</p>}</div>
    </>
  );
}
