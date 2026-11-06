import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CURRENCIES, money, weekday, today, nowTime } from '../lib/format';
import { cmpTx } from '../lib/stats';
import TxRow from '../components/TxRow';

export const CATS = {
  expense: ['Food', 'Transportation', 'Education', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
  income: ['Salary', 'Allowance', 'Gift', 'Freelance', 'Other'],
  exchange: ['Exchange'],
};
const DEFAULT_ACCOUNTS = ['Cash', 'Bank Account', 'E-Wallet'];

function TxForm({ edit, onClose }) {
  const { data, api, notify, cur } = useApp();
  const [id] = useState(() => crypto.randomUUID()); // fixed per form: a double submit hits a primary-key conflict instead of duplicating
  const [f, setF] = useState(() => edit
    ? { ...edit, amount: String(edit.amount), rate: edit.rate ?? '', time: (edit.time || '').slice(0, 5), notes: edit.notes || '', to_currency: edit.to_currency || 'USD' }
    : { type: 'expense', title: '', amount: '', currency: cur, category: 'Food', account: 'Cash', date: today(), time: nowTime(), notes: '', to_currency: 'USD', rate: '' });
  const [busy, setBusy] = useState(false); const [rateMsg, setRateMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const accounts = [...new Set([...DEFAULT_ACCOUNTS, ...data.accounts.map((a) => a.name)])];
  const x = f.type === 'exchange';
  const converted = x && Number(f.amount) > 0 && Number(f.rate) > 0 ? Math.round(Number(f.amount) * Number(f.rate) * 100) / 100 : null;

  const fetchRate = async () => {
    setRateMsg('Fetching…');
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${f.currency}&to=${f.to_currency}`);
      const j = await r.json(); const v = j.rates?.[f.to_currency];
      if (!r.ok || !v) throw new Error();
      setF((p) => ({ ...p, rate: String(v) })); setRateMsg(`Rate from ${j.date}`);
    } catch { setRateMsg('Could not fetch a rate. Enter it manually.'); }
  };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    const amount = Number(f.amount);
    if (!f.title.trim()) return notify('Enter a title', 'err');
    if (!(amount > 0)) return notify('Amount must be greater than zero', 'err');
    if (!f.date || isNaN(new Date(f.date))) return notify('Choose a valid date', 'err');
    if (x && (f.to_currency === f.currency || !(Number(f.rate) > 0))) return notify('Choose two different currencies and a rate above zero', 'err');
    const row = { type: f.type, title: f.title.trim(), amount, currency: f.currency, category: f.category, account: f.account, date: f.date, time: f.time || '00:00', notes: f.notes.trim() || null, to_currency: x ? f.to_currency : null, rate: x ? Number(f.rate) : null, to_amount: x ? converted : null };
    setBusy(true);
    try { edit ? await api.updTx(edit.id, row) : await api.addTx({ id, ...row }); onClose(); } catch { /* error already shown */ }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}>
      <form className="card sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{edit ? 'Edit transaction' : 'New transaction'}</h2>
        <div className="seg">{['expense', 'income', 'exchange'].map((t) => <button type="button" key={t} className={f.type === t ? 'on' : ''} onClick={() => setF({ ...f, type: t, category: CATS[t][0] })}>{t === 'exchange' ? 'Currency exchange' : t[0].toUpperCase() + t.slice(1)}</button>)}</div>
        <label>Title<input value={f.title} onChange={set('title')} /></label>
        <div className="two">
          <label>{x ? 'Amount to exchange' : 'Amount'}<input type="number" step="any" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></label>
          <label>{x ? 'From' : 'Currency'}<select value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        {x && <>
          <div className="two">
            <label>To<select value={f.to_currency} onChange={set('to_currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Rate (1 {f.currency} = ? {f.to_currency})<input type="number" step="any" min="0" value={f.rate} onChange={set('rate')} /></label>
          </div>
          <div className="between"><button type="button" className="ghost" onClick={fetchRate}>Get current rate</button><span className="muted small">{rateMsg}</span></div>
          {converted && <p className="note">You receive {money(converted, f.to_currency)}</p>}
        </>}
        <div className="two">
          {!x && <label>Category<select value={f.category} onChange={set('category')}>{CATS[f.type].map((c) => <option key={c}>{c}</option>)}</select></label>}
          <label>Account<select value={f.account} onChange={set('account')}>{accounts.map((a) => <option key={a}>{a}</option>)}</select></label>
        </div>
        <div className="two">
          <label>Date<input type="date" value={f.date} onChange={set('date')} /><span className="muted small">{weekday(f.date)}</span></label>
          <label>Time<input type="time" value={f.time} onChange={set('time')} /></label>
        </div>
        <label>Notes<textarea rows="2" value={f.notes} onChange={set('notes')} /></label>
        <div className="between"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save transaction'}</button></div>
      </form>
    </div>
  );
}

export default function Transactions() {
  const { data, loading, api } = useApp();
  const [sp, setSp] = useSearchParams();
  const [form, setForm] = useState(null); const [q, setQ] = useState(''); const [type, setType] = useState('all');
  useEffect(() => { if (sp.get('new')) { setForm({}); setSp({}, { replace: true }); } }, [sp, setSp]);
  const list = [...data.tx].sort(cmpTx).filter((t) => (type === 'all' || t.type === type) && (t.title + t.category + t.account).toLowerCase().includes(q.toLowerCase()));
  const del = (t) => { if (confirm(`Delete "${t.title}"?`)) api.delTx(t.id).catch(() => {}); };
  return (
    <>
      <header className="head"><h1>Transactions</h1><button className="btn" onClick={() => setForm({})}>Add transaction</button></header>
      <div className="filters"><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option><option value="exchange">Exchange</option></select></div>
      <div className="card">
        {loading && !data.tx.length ? <p className="muted">Loading…</p> : list.length ? <ul className="list">{list.map((t) => <TxRow key={t.id} t={t} onEdit={setForm} onDelete={del} />)}</ul> : <p className="muted">{data.tx.length ? 'No transactions match your filters.' : 'No transactions yet. Add one to get started.'}</p>}
      </div>
      {form && <TxForm key={form.id || 'new'} edit={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  );
}
