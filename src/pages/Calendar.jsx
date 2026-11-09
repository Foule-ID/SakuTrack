import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { money, compactNumber, fmtDate, getLocale } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { r2, cmpTx } from '../lib/stats';
import { monthCells, shiftMonth, todayKey, dateKey, monthPrefix, groupByDate, summarize } from '../lib/calendar';
import { TYPE_FILTERS, matchType } from '../lib/txFilter';
import { categoryIcon, EMPTY_ART, CALENDAR_ART } from '../assets';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

// Labels are formatted from UTC fields so the shown weekday/date can never shift with the viewer's timezone.
const utcDate = (y, m, d) => new Date(Date.UTC(y, m, d));
const longDate = (key) => fmtDate(key, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const selFor = ({ y, m }) => (todayKey().startsWith(monthPrefix(y, m)) ? todayKey() : dateKey(y, m, 1));

// Short per-day indicator lines: main currency first, other currencies tagged with their code. Exchange gets its own marker.
function cellLines(sum, cur) {
  const lines = [];
  for (const c of Object.keys(sum.byCur).sort((a, b) => (a === cur ? -1 : b === cur ? 1 : a.localeCompare(b)))) {
    const tag = c === cur ? '' : ' ' + c, { income, expense } = sum.byCur[c];
    if (income > 0) lines.push({ kind: 'inc', text: `+${compactNumber(income)}${tag}` });
    if (expense > 0) lines.push({ kind: 'exp', text: `−${compactNumber(expense)}${tag}` });
  }
  if (sum.exchanges) lines.push({ kind: 'exch', text: `⇄ ${sum.exchanges}` });
  return lines;
}
function describe(key, sum, t) {
  const parts = [];
  for (const [c, v] of Object.entries(sum.byCur)) { if (v.income) parts.push(t('cal.aInc', { amount: money(v.income, c) })); if (v.expense) parts.push(t('cal.aExp', { amount: money(v.expense, c) })); }
  if (sum.exchanges) parts.push(t('cal.aExch', { count: sum.exchanges }));
  return `${longDate(key)}: ${parts.length ? parts.join(', ') : t('cal.aNone')}`;
}

function DayRow({ tx }) {
  const { t, cat, acct } = useTranslation();
  const x = tx.type === 'exchange';
  const amt = x ? `${money(tx.amount, tx.currency)} → ${money(tx.to_amount, tx.to_currency)}` : (tx.type === 'income' ? '+' : '−') + money(tx.amount, tx.currency);
  return (
    <li className="row">
      <img className="cat-icon" src={categoryIcon(tx.category)} alt="" />
      <div className="grow">
        <strong>{tx.title}</strong>
        <div className="muted small">{cat(tx.category)}{tx.account ? `, ${acct(tx.account)}` : ''}, {tx.currency}{x && tx.to_currency ? ` → ${tx.to_currency}` : ''} · {(tx.time || '').slice(0, 5)}</div>
        {x && tx.rate ? <div className="muted small">{t('cal.rate', { from: tx.currency, rate: tx.rate, to: tx.to_currency })}</div> : null}
        {tx.notes && <div className="muted small">{tx.notes}</div>}
      </div>
      <div className="rowright"><span className={'tag ' + tx.type}>{t('type.' + tx.type)}</span><div className={'amt ' + (x ? '' : tx.type)}>{amt}</div></div>
    </li>
  );
}

export default function CalendarPage() {
  const { data, loading, cur } = useApp(); const nav = useNavigate(); const { t } = useTranslation();
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
  const title = utcDate(view.y, view.m, 1).toLocaleDateString(getLocale(), { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const emptyText = filter !== 'all' && anyOnDate ? t('cal.emptyFilter', { type: t('type.' + filter).toLowerCase() }) : t('cal.emptyDate');

  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={CALENDAR_ART} alt="" /><h1>{t('nav.calendar')}</h1></div><button className="btn" onClick={() => nav('/transactions?new=1')}>{t('dash.addTx')}</button></header>
      <div className="calpage">
        <section className="card cal" aria-label={t('cal.calAria')}>
          <div className="cal-bar">
            <div className="acts">
              <button className="ghost cal-nav" aria-label={t('cal.prev')} onClick={() => go(-1)}>‹</button>
              <h2 className="cal-title" aria-live="polite">{title}</h2>
              <button className="ghost cal-nav" aria-label={t('cal.next')} onClick={() => go(1)}>›</button>
            </div>
            <div className="acts"><button className="ghost" onClick={goToday}>{t('cal.today')}</button></div>
          </div>
          <div className="seg cal-filter" role="group" aria-label={t('cal.typeGroup')}>{TYPE_FILTERS.map(([k, lk]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{t(lk)}</button>)}</div>
          <div className="cal-week" aria-hidden="true">{[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n}>{t('wd.' + n)}</span>)}</div>
          <div className="cal-grid">
            {cells.map((c, i) => {
              if (!c) return <div key={'b' + i} className="cal-blank" aria-hidden="true" />;
              const txs = byDate[c.key]; const s = txs ? summarize(txs) : null; const lines = s ? cellLines(s, cur) : [];
              const kinds = [...new Set(lines.map((l) => l.kind))];
              return (
                <button key={c.key} type="button" className={'cal-cell' + (c.key === sel ? ' sel' : '') + (c.key === today ? ' today' : '')} aria-pressed={c.key === sel} aria-label={describe(c.key, s || { byCur: {}, exchanges: 0 }, t)} onClick={() => setSel(c.key)}>
                  <span className="cal-day">{c.day}</span>
                  {lines.length > 0 && <span className="cal-amts">{lines.slice(0, 2).map((l, k) => <span key={k} className={'cal-amt ' + l.kind}>{l.text}</span>)}{lines.length > 2 && <span className="cal-more">{t('cal.more', { n: lines.length - 2 })}</span>}</span>}
                  {kinds.length > 0 && <span className="cal-dots">{kinds.map((k) => <i key={k} className={k} />)}</span>}
                </button>
              );
            })}
          </div>
          <div className="cal-legend muted small"><span><i className="inc" />{t('type.income')}</span><span><i className="exp" />{t('type.expenses')}</span><span><i className="exch" />{t('cal.legendExch')}</span></div>
          {loading && !data.tx.length && <p className="muted small">{t('cal.loading')}</p>}
        </section>

        <section className="card daypanel" aria-label={t('cal.dayAria')}>
          <h2>{longDate(sel)}</h2>
          {curs.map((c) => { const v = sum.byCur[c] || { income: 0, expense: 0, net: 0 }; return (
            <div className="daysum" key={c}>
              {curs.length > 1 && <div className="daysum-cur">{c}</div>}
              <div className="daygrid">
                <StatCard tone="income" label={t('cal.totalIncome')} value={money(v.income, c)} />
                <StatCard tone="expense" label={t('cal.totalExpenses')} value={money(v.expense, c)} />
                <StatCard tone={v.net > 0 ? 'income' : v.net < 0 ? 'expense' : 'neutral'} label={t('stats.net')} value={money(r2(v.net), c)} />
              </div>
            </div>); })}
          {sum.exchanges > 0 && <p className="muted small">{t('cal.exchNote', { count: sum.exchanges })}</p>}
          {dayTx.length ? <ul className="list">{dayTx.map((tx) => <DayRow key={tx.id} tx={tx} />)}</ul> : <EmptyState compact art={EMPTY_ART.transactions} title={emptyText} text={t('cal.addHint')} />}
        </section>
      </div>
    </>
  );
}
