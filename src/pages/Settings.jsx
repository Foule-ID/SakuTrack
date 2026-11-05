import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../lib/format';

const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function Settings() {
  const { session, data, sync, cur, setCur, api, notify } = useApp();
  const [name, setName] = useState(session.user.user_metadata?.name || '');
  const [acc, setAcc] = useState(''); const [backups, setBackups] = useState([]); const [busy, setBusy] = useState(false);
  const loadBackups = () => api.listBackups().then(({ data: d, error }) => (error ? notify('Could not list backups: ' + error.message, 'err') : setBackups(d)));
  useEffect(() => { loadBackups(); }, []); // eslint-disable-line
  const guard = (fn) => async () => { setBusy(true); try { await fn(); } catch { /* shown */ } setBusy(false); };

  const saveName = async () => { const { error } = await supabase.auth.updateUser({ data: { name } }); error ? notify(error.message, 'err') : notify('Profile saved'); };
  const addAcc = async () => { const n = acc.trim(); if (!n) return; try { await api.addAccount(n); setAcc(''); } catch { /* shown */ } };
  const exportCsv = () => {
    const cols = ['date', 'time', 'type', 'title', 'amount', 'currency', 'category', 'account', 'to_currency', 'to_amount', 'rate', 'notes'];
    download('sakutrack-transactions.csv', [cols.join(','), ...data.tx.map((t) => cols.map((c) => csvCell(t[c])).join(','))].join('\n'), 'text/csv');
  };
  return (
    <>
      <header className="head"><h1>Settings</h1></header>
      <div className="card"><h2>Profile</h2>
        <p className="muted">{session.user.email}</p>
        <div className="two"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" /><button className="btn" onClick={saveName}>Save profile</button></div>
        <label>Main currency for totals and charts<select value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <button className="ghost danger" onClick={api.signOut}>Log out</button></div>
      <div className="card"><h2>Accounts</h2>
        <p className="muted small">Cash, Bank Account and E-Wallet are always available. Add your own below.</p>
        <ul className="list">{data.accounts.map((a) => <li className="row" key={a.id}><span className="grow">{a.name}</span><button className="ghost danger" onClick={() => api.delAccount(a.id).catch(() => {})}>Remove</button></li>)}</ul>
        <div className="two"><input value={acc} onChange={(e) => setAcc(e.target.value)} placeholder="e.g. GoPay, BCA" /><button className="btn" onClick={addAcc}>Add account</button></div></div>
      <div className="card"><h2>Backup and export</h2>
        <p className={'sync ' + sync.state}>Status: {sync.msg}</p>
        <div className="acts wrap"><button className="btn" disabled={busy} onClick={guard(async () => { await api.backup(); await loadBackups(); })}>Back up now</button>
          <button className="ghost" onClick={() => download('sakutrack-backup.json', JSON.stringify(data, null, 2), 'application/json')}>Export JSON</button>
          <button className="ghost" onClick={exportCsv}>Export CSV</button></div>
        <h3>Restore</h3><p className="muted small">Restoring writes the backup's records back by ID. Records created after the backup are kept.</p>
        {backups.length ? <ul className="list">{backups.map((b) => <li className="row" key={b.id}><span className="grow">{new Date(b.created_at).toLocaleString()}</span><button className="ghost" disabled={busy} onClick={guard(async () => { if (confirm('Restore this backup?')) await api.restore(b.id); })}>Restore</button></li>)}</ul> : <p className="muted">No backups yet.</p>}</div>
    </>
  );
}
