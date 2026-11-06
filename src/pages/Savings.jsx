import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCIES, money } from '../lib/format';
import EmptyState from '../components/EmptyState';
import { PAGE_ART, EMPTY_ART } from '../assets';

function GoalForm({ edit, onClose }) {
  const { api, notify, cur } = useApp();
  const [f, setF] = useState(edit ? { ...edit, target_amount: String(edit.target_amount), target_date: edit.target_date || '' } : { name: '', target_amount: '', currency: cur, target_date: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!f.name.trim()) return notify('Enter a goal name', 'err');
    if (!(Number(f.target_amount) > 0)) return notify('Target must be greater than zero', 'err');
    const row = { name: f.name.trim(), target_amount: Number(f.target_amount), currency: f.currency, target_date: f.target_date || null };
    setBusy(true);
    try { edit ? await api.updGoal(edit.id, row) : await api.addGoal(row); onClose(); } catch { /* shown */ }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}><form className="card sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
      <h2>{edit ? 'Edit goal' : 'New savings goal'}</h2>
      <label>Goal name<input value={f.name} onChange={set('name')} /></label>
      <div className="two"><label>Target amount<input type="number" step="any" min="0" value={f.target_amount} onChange={set('target_amount')} /></label>
        <label>Currency<select value={f.currency} onChange={set('currency')} disabled={!!edit}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label></div>
      <label>Target date<input type="date" value={f.target_date} onChange={set('target_date')} /></label>
      <div className="between"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save goal'}</button></div>
    </form></div>
  );
}

export default function Savings() {
  const { data, api, notify } = useApp();
  const [form, setForm] = useState(null); const [add, setAdd] = useState({});
  const deposit = async (g) => {
    const v = Number(add[g.id]);
    if (!(v > 0)) return notify('Enter an amount above zero', 'err');
    try { await api.updGoal(g.id, { saved: Math.round((g.saved + v) * 100) / 100 }, 'Money added to goal'); setAdd({ ...add, [g.id]: '' }); } catch { /* shown */ }
  };
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.savings} alt="" /><h1>Savings Goals</h1></div><button className="btn" onClick={() => setForm({})}>New goal</button></header>
      {!data.goals.length && <div className="card"><EmptyState art={EMPTY_ART.goals} title="No savings goals yet" text="Create a goal to track your progress." /></div>}
      <div className="grid2">{data.goals.map((g) => {
        const pct = Math.min(100, (g.saved / g.target_amount) * 100); const left = Math.max(0, g.target_amount - g.saved);
        return (
          <div className="card" key={g.id}>
            <div className="between"><h2>{g.name}</h2><div className="acts"><button className="ghost" onClick={() => setForm(g)}>Edit</button><button className="ghost danger" onClick={() => confirm(`Delete "${g.name}"?`) && api.delGoal(g.id).catch(() => {})}>Delete</button></div></div>
            <div className="bar"><i style={{ width: pct + '%' }} /></div>
            <div className="between"><span>{money(g.saved, g.currency)} of {money(g.target_amount, g.currency)}</span><b>{Math.round(pct)}%</b></div>
            <p className="muted small">{left ? `${money(left, g.currency)} to go` : 'Goal reached'}{g.target_date ? `, target ${g.target_date}` : ''}</p>
            <div className="two"><input type="number" step="any" min="0" placeholder="Amount to add" value={add[g.id] || ''} onChange={(e) => setAdd({ ...add, [g.id]: e.target.value })} /><button className="btn" onClick={() => deposit(g)}>Add money</button></div>
          </div>
        );
      })}</div>
      {form && <GoalForm key={form.id || 'new'} edit={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  );
}
