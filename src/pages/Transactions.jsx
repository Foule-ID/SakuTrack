import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CURRENCIES, money, weekday, today, nowTime, fmtDate } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { cmpTx } from '../lib/stats';
import TxRow from '../components/TxRow';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { EMPTY_ART } from '../assets';

export const CATS = {
  expense: ['Food', 'Transportation', 'Education', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
  income: ['Salary', 'Allowance', 'Gift', 'Freelance', 'Other'],
  exchange: ['Exchange'],
};
const DEFAULT_ACCOUNTS = ['Cash', 'Bank Account', 'E-Wallet'];

function TxForm({ edit, onClose }) {
  const { data, api, notify, cur } = useApp(); const { t, cat, acct } = useTranslation();
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
    setRateMsg(t('tx.fetching'));
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${f.currency}&to=${f.to_currency}`);
      const j = await r.json(); const v = j.rates?.[f.to_currency];
      if (!r.ok || !v) throw new Error();
      setF((p) => ({ ...p, rate: String(v) })); setRateMsg(t('tx.rateFrom', { date: fmtDate(j.date, { year: 'numeric', month: 'short', day: 'numeric' }) }));
    } catch { setRateMsg(t('tx.rateFail')); }
  };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    const amount = Number(f.amount);
    if (!f.title.trim()) return notify(t('tx.errTitle'), 'err');
    if (!(amount > 0)) return notify(t('tx.errAmount'), 'err');
    if (!f.date || isNaN(new Date(f.date))) return notify(t('tx.errDate'), 'err');
    if (x && (f.to_currency === f.currency || !(Number(f.rate) > 0))) return notify(t('tx.errExchange'), 'err');
    const row = { type: f.type, title: f.title.trim(), amount, currency: f.currency, category: f.category, account: f.account, date: f.date, time: f.time || '00:00', notes: f.notes.trim() || null, to_currency: x ? f.to_currency : null, rate: x ? Number(f.rate) : null, to_amount: x ? converted : null };
    setBusy(true);
    try { edit ? await api.updTx(edit.id, row) : await api.addTx({ id, ...row }); onClose(); } catch { /* error already shown */ }
    setBusy(false);
  };
  return (
    <div className="modal" onClick={onClose}>
      <form className="card sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{edit ? t('tx.formEdit') : t('tx.formNew')}</h2>
        <div className="seg">{['expense', 'income', 'exchange'].map((ty) => <button type="button" key={ty} className={f.type === ty ? 'on' : ''} onClick={() => setF({ ...f, type: ty, category: CATS[ty][0] })}>{ty === 'exchange' ? t('type.currencyExchange') : t('type.' + ty)}</button>)}</div>
        <label>{t('common.title')}<input value={f.title} onChange={set('title')} /></label>
        <div className="two">
          <label>{x ? t('tx.amountExchange') : t('common.amount')}<input type="number" step="any" min="0" inputMode="decimal" value={f.amount} onChange={set('amount')} /></label>
          <label>{x ? t('tx.from') : t('common.currency')}<select value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        {x && <>
          <div className="two">
            <label>{t('tx.to')}<select value={f.to_currency} onChange={set('to_currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>{t('tx.rate', { from: f.currency, to: f.to_currency })}<input type="number" step="any" min="0" value={f.rate} onChange={set('rate')} /></label>
          </div>
          <div className="between"><button type="button" className="ghost" onClick={fetchRate}>{t('tx.getRate')}</button><span className="muted small">{rateMsg}</span></div>
          {converted && <p className="note">{t('tx.youReceive', { amount: money(converted, f.to_currency) })}</p>}
        </>}
        <div className="two">
          {!x && <label>{t('common.category')}<select value={f.category} onChange={set('category')}>{CATS[f.type].map((c) => <option key={c} value={c}>{cat(c)}</option>)}</select></label>}
          <label>{t('common.account')}<select value={f.account} onChange={set('account')}>{accounts.map((a) => <option key={a} value={a}>{acct(a)}</option>)}</select></label>
        </div>
        <div className="two">
          <label>{t('common.date')}<input type="date" value={f.date} onChange={set('date')} /><span className="muted small">{weekday(f.date)}</span></label>
          <label>{t('common.time')}<input type="time" value={f.time} onChange={set('time')} /></label>
        </div>
        <label>{t('common.notes')}<textarea rows="2" value={f.notes} onChange={set('notes')} /></label>
        <div className="between"><button type="button" className="ghost" onClick={onClose}>{t('common.cancel')}</button><button className="btn" disabled={busy}>{busy ? t('common.saving') : t('tx.save')}</button></div>
      </form>
    </div>
  );
}

export default function Transactions() {
  const { data, loading, api } = useApp(); const { t, cat, acct } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const [form, setForm] = useState(null); const [q, setQ] = useState(''); const [type, setType] = useState('all');
  useEffect(() => { if (sp.get('new')) { setForm({}); setSp({}, { replace: true }); } }, [sp, setSp]);
  const list = [...data.tx].sort(cmpTx).filter((t) => (type === 'all' || t.type === type) && (t.title + t.category + cat(t.category) + t.account + acct(t.account)).toLowerCase().includes(q.toLowerCase()));
  const del = (row) => { if (confirm(t('tx.deleteConfirm', { name: row.title }))) api.delTx(row.id).catch(() => {}); };
  return (
    <>
      <header className="head"><h1>{t('nav.transactions')}</h1><button className="btn" onClick={() => setForm({})}>{t('dash.addTx')}</button></header>
      <div className="filters"><input placeholder={t('common.search')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">{t('type.allTypes')}</option><option value="income">{t('type.income')}</option><option value="expense">{t('type.expense')}</option><option value="exchange">{t('type.exchange')}</option></select></div>
      <div className="card">
        {loading && !data.tx.length ? <Loading rows /> : list.length ? <ul className="list">{list.map((t) => <TxRow key={t.id} t={t} onEdit={setForm} onDelete={del} />)}</ul> : data.tx.length ? <p className="muted">{t('tx.noMatch')}</p> : <EmptyState art={EMPTY_ART.transactions} title={t('dash.noTx')} text={t('tx.emptyHint')} />}
      </div>
      {form && <TxForm key={form.id || 'new'} edit={form.id ? form : null} onClose={() => setForm(null)} />}
    </>
  );
}
