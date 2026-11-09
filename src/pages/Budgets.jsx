import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCIES, money, fmtDate } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { r2 } from '../lib/stats';
import { track, periodRange } from '../lib/budget';
import { CATS } from './Transactions';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import { PAGE_ART, EMPTY_ART, STATUS_ICONS } from '../assets';

function BudgetForm({ edit, onClose }) {
  const { api, notify, cur } = useApp(); const { t, cat } = useTranslation();
  const [id] = useState(() => crypto.randomUUID()); // a double submit hits a primary-key conflict instead of duplicating
  const [f, setF] = useState(edit ? { ...edit, name: edit.name || '', amount: String(edit.amount) } : { name: '', category: CATS.expense[0], amount: '', currency: cur, period: 'monthly' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!(Number(f.amount) > 0)) return notify(t('bud.errAmount'), 'err');
    const row = { name: f.name.trim() || null, category: f.category, amount: Number(f.amount), currency: f.currency, period: f.period };
    setBusy(true);
    try { edit ? await api.updBudget(edit.id, row) : await api.addBudget({ id, ...row }); onClose(); } catch { /* error already shown */ }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}><form className="card sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
      <h2>{edit ? t('bud.edit') : t('bud.new')}</h2>
      <label>{t('bud.name')}<input value={f.name} onChange={set('name')} placeholder={t('bud.namePh')} /></label>
      <div className="two">
        <label>{t('bud.category')}<select value={f.category} onChange={set('category')}>{CATS.expense.map((c) => <option key={c} value={c}>{cat(c)}</option>)}</select></label>
        <label>{t('bud.period')}<select value={f.period} onChange={set('period')}><option value="monthly">{t('period.monthly')}</option><option value="weekly">{t('period.weekly')}</option></select></label>
      </div>
      <div className="two">
        <label>{t('bud.amount')}<input type="number" step="any" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></label>
        <label>{t('common.currency')}<select value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="between"><button type="button" className="ghost" onClick={onClose}>{t('common.cancel')}</button><button className="btn" disabled={busy}>{busy ? t('common.saving') : t('bud.save')}</button></div>
    </form></div>
  );
}

export default function Budgets() {
  const { data, api, cur, budgetsError, loading } = useApp(); const { t, cat } = useTranslation();
  const [view, setView] = useState('monthly'); const [form, setForm] = useState(null);
  const [a, b] = periodRange(view);
  const list = data.budgets.filter((x) => x.period === view).map((x) => track(x, data.tx));
  const main = list.filter((x) => x.currency === cur);
  const total = r2(main.reduce((s, x) => s + x.amount, 0)), spent = r2(main.reduce((s, x) => s + x.spent, 0));
  const exceeded = list.filter((x) => x.lv === 'over').length; const other = list.length - main.length;
  const del = (x) => { if (confirm(t('bud.deleteConfirm', { name: x.name || cat(x.category) }))) api.delBudget(x.id).catch(() => {}); };

  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.budgets} alt="" /><h1>{t('nav.budgets')}</h1></div><div className="acts"><div className="seg">{['weekly', 'monthly'].map((p) => <button key={p} className={view === p ? 'on' : ''} onClick={() => setView(p)}>{t('period.' + p)}</button>)}</div>
        <button className="btn" onClick={() => setForm({})} disabled={!!budgetsError}>{t('bud.new')}</button></div></header>
      {budgetsError && <div className="card"><h2>{t('bud.needsDb')}</h2><p className="muted">{t('bud.needsDbA')}<code>supabase/migrations/001_create_budgets.sql</code>{t('bud.needsDbB', { msg: budgetsError })}</p></div>}
      <p className="muted small">{t('bud.rangeLine', { a: fmtDate(a, { year: 'numeric', month: 'short', day: 'numeric' }), b: fmtDate(b, { year: 'numeric', month: 'short', day: 'numeric' }), cur, other: other ? t('bud.other', { count: other }) : '' })}</p>
      <div className="grid4">
        <StatCard tone="balance" label={t('bud.total')} value={money(total, cur)} />
        <StatCard tone="expense" label={t('bud.spent')} value={money(spent, cur)} />
        <StatCard tone={total - spent < 0 ? 'expense' : 'income'} label={t('bud.remaining')} value={money(r2(total - spent), cur)} />
        <StatCard tone={exceeded ? 'warn' : 'neutral'} label={t('bud.exceeded')} value={exceeded} />
      </div>
      {loading && !data.tx.length ? <Loading rows /> : !list.length ? <div className="card"><EmptyState art={EMPTY_ART.budgets} title={t('bud.emptyT', { period: t('period.' + view).toLowerCase() })} text={t('bud.emptyB')} /></div> : (
        <div className="grid2">{list.map((x) => (
          <div className="card" key={x.id}>
            <div className="between"><div><h2 style={{ margin: 0 }}>{x.name || cat(x.category)}</h2><div className="muted small">{cat(x.category)}, {t('period.' + x.period)}, {x.currency}</div></div>
              <div className="acts"><button className="ghost" onClick={() => setForm(x)}>{t('common.edit')}</button><button className="ghost danger" onClick={() => del(x)}>{t('common.delete')}</button></div></div>
            <div className="bar"><i className={x.lv} style={{ width: Math.min(100, x.pct) + '%' }} /></div>
            <div className="between"><span>{t('common.of', { a: money(x.spent, x.currency), b: money(x.amount, x.currency) })}</span><b>{Math.floor(x.pct)}%</b></div>
            <div className="between"><span className={'pill ' + x.lv}><img className="pill-icon" src={STATUS_ICONS[x.lv]} alt="" />{t('bud.' + x.lv)}</span><span className="muted small">{x.left >= 0 ? t('bud.left', { amount: money(x.left, x.currency) }) : t('bud.overBy', { amount: money(-x.left, x.currency) })}</span></div>
          </div>))}</div>
      )}
      {form && <BudgetForm key={form.id || 'new'} edit={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  );
}
