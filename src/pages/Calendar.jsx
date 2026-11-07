import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { money } from '../lib/format';
import { r2, cmpTx } from '../lib/stats';
import { monthCells, shiftMonth, todayKey, dateKey, monthPrefix, groupByDate, summarize } from '../lib/calendar';
import { TYPE_FILTERS, matchType } from '../lib/txFilter';
import { categoryIcon, EMPTY_ART, CALENDAR_ART } from '../assets';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_LABEL = { income: 'Income', expense: 'Expense', exchange: 'Exchange' };
const compact = (v) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
// Labels are formatted from UTC fields so the shown weekday/date can never shift with the viewer's timezone.
const utcDate = (y, m, d) => new Date(Date.UTC(y, m, d));
const longDate = (key) => { const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key); return p ? utcDate(+p[1], +p[2] - 1, +p[3]).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : key; };
const selFor = ({ y, m }) => (todayKey().startsWith(monthPrefix(y, m)) ? todayKey() : dateKey(y, m, 1));

// Short per-day indicator lines: main currency first, other currencies tagged with their code. Exchange gets its own marker.
function cellLines(sum, cur) {
  const lines = [];
  for (const c of Object.keys(sum.byCur).sort((a, b) => (a === cur ? -1 : b === cur ? 1 : a.localeCompare(b)))) {
    const tag = c === cur ? '' : ' ' + c, { income, expense } = sum.byCur[c];
    if (income > 0) lines.push({ kind: 'inc', text: `+${compact(income)}${tag}` });
    if (expense > 0) lines.push({ kind: 'exp', text: `−${compact(expense)}${tag}` });
  }
  if (sum.exchanges) lines.push({ kind: 'exch', text: `⇄ ${sum.exchanges}` });
  return lines;
}
function describe(key, sum) {
  const parts = [];
  for (const [c, v] of Object.entries(sum.byCur)) { if (v.income) parts.push(`income ${money(v.income, c)}`); if (v.expense) parts.push(`expenses ${money(v.expense, c)}`); }
  if (sum.exchanges) parts.push(`${sum.exchanges} exchange${sum.exchanges > 1 ? 's' : ''}`);
  return `${longDate(key)}${parts.length ? ': ' + parts.join(', ') : ': no transactions'}`;
}

function DayRow({ t }) {
  const x = t.type === 'exchange';
  const amt = x ? `${money(t.amount, t.currency)} → ${money(t.to_amount, t.to_currency)}` : (t.type === 'income' ? '+' : '−') + money(t.amount, t.currency);
  return (
    <li className="row">
      <img className="cat-icon" src={categoryIcon(t.category)} alt="" />
      <div className="grow">
        <strong>{t.title}</strong>
        <div className="muted small">{t.category}{t.account ? `, ${t.account}` : ''}, {t.currency}{x && t.to_currency ? ` → ${t.to_currency}` : ''} · {(t.time || '').slice(0, 5)}</div>
        {x && t.rate ? <div className="muted small">Rate: 1 {t.currency} = {t.rate} {t.to_currency}</div> : null}
        {t.notes && <div className="muted small">{t.notes}</div>}
      </div>
      <div className="rowright"><span className={'tag ' + t.type}>{TYPE_LABEL[t.type]}</span><div className={'amt ' + (x ? '' : t.type)}>{amt}</div></div>
    </li>
  );
}

export default function CalendarPage() {
  const { data, loading, cur } = useApp(); const nav = useNavigate();
  const today = todayKey();
  const [view, setView] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [sel, setSel] = useState(today);
  const [filter, setFilter] = useState('all');
  const cells = monthCells(view.y, view.m);
  const byDate = useMemo(() => groupByDate(data.tx.filter((t) => matchType(t, filter)), view.y, view.m), [data.tx, filter, view]);
  const go = (d) => { const v = shiftMonth(view, d); setView(v); setSel(selFor(v)); };
  const goToday = () => { const n = new Date(); setView({ y: n.getFullYear(), m: n.getMonth() }); setSel(todayKey(n)); };

  const dayTx = (byDate[sel] || []).slice().sort(cmpTx);
  const sum = summarize(dayTx);
  const curs = Object.keys(sum.byCur).length ? Object.keys(sum.byCur) : [cur]; // no activity: show zero totals, no invented records
  const anyOnDate = data.tx.some((t) => t.date === sel);
  const title = utcDate(view.y, view.m, 1).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const emptyText = filter !== 'all' && anyOnDate ? `No ${TYPE_LABEL[filter].toLowerCase()} transactions on this date.` : 'No transactions on this date yet.';

  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={CALENDAR_ART} alt="" /><h1>Transaction Calendar</h1></div><button className="btn" onClick={() => nav('/transactions?new=1')}>Add transaction</button></header>
      <div className="calpage">
        <section className="card cal" aria-label="Calendar">
          <div className="cal-bar">
            <div className="acts">
              <button className="ghost cal-nav" aria-label="Previous month" onClick={() => go(-1)}>‹</button>
              <h2 className="cal-title" aria-live="polite">{title}</h2>
              <button className="ghost cal-nav" aria-label="Next month" onClick={() => go(1)}>›</button>
            </div>
            <div className="acts"><button className="ghost" onClick={goToday}>Today</button></div>
          </div>
          <div className="seg cal-filter" role="group" aria-label="Transaction type">{TYPE_FILTERS.map(([k, label]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}</div>
          <div className="cal-week" aria-hidden="true">{WEEK.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="cal-grid">
            {cells.map((c, i) => {
              if (!c) return <div key={'b' + i} className="cal-blank" aria-hidden="true" />;
              const txs = byDate[c.key]; const s = txs ? summarize(txs) : null; const lines = s ? cellLines(s, cur) : [];
              const kinds = [...new Set(lines.map((l) => l.kind))];
              return (
                <button key={c.key} type="button" className={'cal-cell' + (c.key === sel ? ' sel' : '') + (c.key === today ? ' today' : '')} aria-pressed={c.key === sel} aria-label={describe(c.key, s || { byCur: {}, exchanges: 0 })} onClick={() => setSel(c.key)}>
                  <span className="cal-day">{c.day}</span>
                  {lines.length > 0 && <span className="cal-amts">{lines.slice(0, 2).map((l, k) => <span key={k} className={'cal-amt ' + l.kind}>{l.text}</span>)}{lines.length > 2 && <span className="cal-more">+{lines.length - 2} more</span>}</span>}
                  {kinds.length > 0 && <span className="cal-dots">{kinds.map((k) => <i key={k} className={k} />)}</span>}
                </button>
              );
            })}
          </div>
          <div className="cal-legend muted small"><span><i className="inc" />Income</span><span><i className="exp" />Expenses</span><span><i className="exch" />Exchange (not counted as income or expenses)</span></div>
          {loading && !data.tx.length && <p className="muted small">Loading transactions…</p>}
        </section>

        <section className="card daypanel" aria-label="Selected day">
          <h2>{longDate(sel)}</h2>
          {curs.map((c) => { const v = sum.byCur[c] || { income: 0, expense: 0, net: 0 }; return (
            <div className="daysum" key={c}>
              {curs.length > 1 && <div className="daysum-cur">{c}</div>}
              <div className="daygrid">
                <StatCard tone="income" label="Total income" value={money(v.income, c)} />
                <StatCard tone="expense" label="Total expenses" value={money(v.expense, c)} />
                <StatCard tone={v.net > 0 ? 'income' : v.net < 0 ? 'expense' : 'neutral'} label="Net cash flow" value={money(r2(v.net), c)} />
              </div>
            </div>); })}
          {sum.exchanges > 0 && <p className="muted small">{sum.exchanges} currency exchange{sum.exchanges > 1 ? 's' : ''} listed below, not included in income or expenses.</p>}
          {dayTx.length ? <ul className="list">{dayTx.map((t) => <DayRow key={t.id} t={t} />)}</ul> : <EmptyState compact art={EMPTY_ART.transactions} title={emptyText} text="Use Add transaction to record one." />}
        </section>
      </div>
    </>
  );
}
