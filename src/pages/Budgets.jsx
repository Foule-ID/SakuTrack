import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCIES, money } from '../lib/format';
import { r2 } from '../lib/stats';
import { track, periodRange, LABEL } from '../lib/budget';
import { CATS } from './Transactions';

function BudgetForm({ edit, onClose }) {
  const { api, notify, cur } = useApp();
  const [id] = useState(() => crypto.randomUUID()); // a double submit hits a primary-key conflict instead of duplicating
  const [f, setF] = useState(edit ? { ...edit, name: edit.name || '', amount: String(edit.amount) } : { name: '', category: CATS.expense[0], amount: '', currency: cur, period: 'monthly' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!(Number(f.amount) > 0)) return notify('Budget amount must be greater than zero', 'err');
    const row = { name: f.name.trim() || null, category: f.category, amount: Number(f.amount), currency: f.currency, period: f.period };
    setBusy(true);
    try { edit ? await api.updBudget(edit.id, row) : await api.addBudget({ id, ...row }); onClose(); } catch { /* error already shown */ }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}><form className="card sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
      <h2>{edit ? 'Edit budget' : 'New budget'}</h2>
      <label>Budget name (optional)<input value={f.name} onChange={set('name')} placeholder="e.g. Eating out" /></label>
      <div className="two">
        <label>Expense category<select value={f.category} onChange={set('category')}>{CATS.expense.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Period<select value={f.period} onChange={set('period')}><option value="monthly">Monthly</option><option value="weekly">Weekly</option></select></label>
      </div>
      <div className="two">
        <label>Budget amount<input type="number" step="any" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></label>
        <label>Currency<select value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="between"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save budget'}</button></div>
    </form></div>
  );
}

export default function Budgets() {
  const { data, api, cur, budgetsError, loading } = useApp();
  const [view, setView] = useState('monthly'); const [form, setForm] = useState(null);
  const [a, b] = periodRange(view);
  const list = data.budgets.filter((x) => x.period === view).map((x) => track(x, data.tx));
  const main = list.filter((x) => x.currency === cur);
  const total = r2(main.reduce((s, x) => s + x.amount, 0)), spent = r2(main.reduce((s, x) => s + x.spent, 0));
  const exceeded = list.filter((x) => x.lv === 'over').length; const other = list.length - main.length;
  const del = (x) => { if (confirm(`Delete "${x.name || x.category}" budget?`)) api.delBudget(x.id).catch(() => {}); };

  return (
    <>
      <header className="head"><h1>Budget Planner</h1><div className="acts"><div className="seg">{['weekly', 'monthly'].map((p) => <button key={p} className={view === p ? 'on' : ''} onClick={() => setView(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}</div>
        <button className="btn" onClick={() => setForm({})} disabled={!!budgetsError}>New budget</button></div></header>
      {budgetsError && <div className="card"><h2>Budget Planner needs one database step</h2><p className="muted">Run <code>supabase/migrations/001_create_budgets.sql</code> in the Supabase SQL editor, then reload. Details: {budgetsError}</p></div>}
      <p className="muted small">Spending for {a} to {b}. Totals are in {cur}{other ? `; ${other} budget${other > 1 ? 's' : ''} in other currencies ${other > 1 ? 'are' : 'is'} not included in the totals` : ''}.</p>
      <div className="grid4">
        <div className="card"><div className="muted">Total budget</div><div className="big">{money(total, cur)}</div></div>
        <div className="card"><div className="muted">Total spent</div><div className="big neg">{money(spent, cur)}</div></div>
        <div className="card"><div className="muted">Remaining</div><div className={'big ' + (total - spent < 0 ? 'neg' : 'pos')}>{money(r2(total - spent), cur)}</div></div>
        <div className="card"><div className="muted">Exceeded budgets</div><div className={'big ' + (exceeded ? 'neg' : 'pos')}>{exceeded}</div></div>
      </div>
      {loading && !data.tx.length ? <p className="muted">Loading…</p> : !list.length ? <div className="card"><p className="muted">No {view} budgets yet. Create one to set a spending limit for a category.</p></div> : (
        <div className="grid2">{list.map((x) => (
          <div className="card" key={x.id}>
            <div className="between"><div><h2 style={{ margin: 0 }}>{x.name || x.category}</h2><div className="muted small">{x.category}, {x.period}, {x.currency}</div></div>
              <div className="acts"><button className="ghost" onClick={() => setForm(x)}>Edit</button><button className="ghost danger" onClick={() => del(x)}>Delete</button></div></div>
            <div className="bar"><i className={x.lv} style={{ width: Math.min(100, x.pct) + '%' }} /></div>
            <div className="between"><span>{money(x.spent, x.currency)} of {money(x.amount, x.currency)}</span><b>{Math.floor(x.pct)}%</b></div>
            <div className="between"><span className={'pill ' + x.lv}>{LABEL[x.lv]}</span><span className="muted small">{x.left >= 0 ? `${money(x.left, x.currency)} left` : `${money(-x.left, x.currency)} over`}</span></div>
          </div>))}</div>
      )}
      {form && <BudgetForm key={form.id || 'new'} edit={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  );
}
