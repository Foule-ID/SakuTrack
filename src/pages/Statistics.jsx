import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { money, fmtTick, getLocale } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { range, inRange, sum, byCategory, series, compare, r2 } from '../lib/stats';
import { PAGE_ART } from '../assets';
import StatCard from '../components/StatCard';
const pctText = (n) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(n);
const COLORS = ['#4CAF73', '#A8D5B5', '#7A8A7E', '#E47777', '#DCEFE1', '#26352B', '#8BC9A0', '#C9A0A0'];

function Cmp({ label, kind, tx, period, cur }) {
  const { t } = useTranslation();
  const now = sum(inRange(tx, range(period)), kind, cur), prev = sum(inRange(tx, range(period, -1)), kind, cur);
  const c = compare(now, prev); const exp = kind === 'expense';
  const per = t('cmp.period.' + period); let msg = t('cmp.noPrev', { kind: t('cmp.kind.' + kind), period: per }); let good = null;
  if (c) {
    const a = pctText(Math.abs(c.pct));
    good = exp ? c.pct < 0 : c.pct > 0;
    msg = c.pct === 0 ? t('cmp.same', { period: per }) : exp ? (c.pct < 0 ? t('cmp.spentLess', { pct: a, period: per }) : t('cmp.spentMore', { pct: a, period: per })) : (c.pct > 0 ? t('cmp.earnedMore', { pct: a, period: per }) : t('cmp.earnedLess', { pct: a, period: per }));
  }
  return (
    <StatCard tone={exp ? 'expense' : 'income'} label={label} value={money(now, cur)}>
      <div className={'stat-msg ' + (good === false ? 'bad' : '')}>{c && c.pct !== 0 ? (c.diff > 0 ? '▲ ' : '▼ ') : ''}{msg}</div>
      {c && <div className="stat-sub">{t('cmp.detail', { sign: c.diff > 0 ? '+' : '−', diff: money(Math.abs(c.diff), cur), prev: money(prev, cur), period: per })}</div>}</StatCard>
  );
}

// Zero-valued scale used only to keep the chart axes visible when there is no data. These rows are axis positions, not transactions.
function zeroBuckets(p) {
  const [a, b] = range(p); const out = [];
  if (p === 'year') for (let m = 1; m <= 12; m++) out.push(`${a.slice(0, 4)}-${String(m).padStart(2, '0')}`);
  else for (let d = new Date(a + 'T00:00:00'); d <= new Date(b + 'T00:00:00'); d.setDate(d.getDate() + 1)) out.push(new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10));
  return out.map((name) => ({ name, Income: 0, Expenses: 0, Net: 0 }));
}

export default function Statistics() {
  const { data, cur } = useApp(); const { t, cat } = useTranslation(); const [p, setP] = useState('month');
  const tx = inRange(data.tx, range(p));
  const inc = sum(tx, 'income', cur), exp = sum(tx, 'expense', cur);
  const flow = series(tx, cur, p === 'year' ? (d) => d.slice(0, 7) : (d) => d);
  const cats = byCategory(tx, cur);
  const noFlow = !flow.length, noCats = !cats.length;
  const catsView = cats.map((c) => ({ ...c, name: cat(c.name) })); // display names only; stored category values stay unchanged
  const chartData = noFlow ? zeroBuckets(p) : flow;
  const mtx = inRange(data.tx, range('month')); const mcats = byCategory(mtx, cur); const mexp = sum(mtx, 'expense', cur);
  const dayOfMonth = new Date().getDate();
  const top = mcats[0];
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.statistics} alt="" /><h1>{t('nav.statistics')}</h1></div><div className="seg">{['day', 'week', 'month', 'year'].map((x) => <button key={x} className={p === x ? 'on' : ''} onClick={() => setP(x)}>{t('period.' + x)}</button>)}</div></header>
      <p className="muted small">{t('stats.onlyCur', { cur })}</p>
      <div className="summary">
        <StatCard tone={inc - exp > 0 ? 'income' : inc - exp < 0 ? 'expense' : 'neutral'} label={t('stats.net')} value={money(r2(inc - exp), cur)} />
        <StatCard tone="income" label={t('type.income')} value={money(inc, cur)} />
        <StatCard tone="expense" label={t('type.expenses')} value={money(exp, cur)} />
      </div>
      <div className="grid2">
        <div className="card"><h2>{t('stats.cashflow')}</h2>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickFormatter={fmtTick} />
                <YAxis width={60} domain={noFlow ? [0, 100] : undefined} ticks={noFlow ? [0, 25, 50, 75, 100] : undefined} tickFormatter={noFlow ? (v) => (v === 0 ? '0' : '') : undefined} />
                {!noFlow && <Tooltip formatter={(v) => money(v, cur)} labelFormatter={fmtTick} />}
                <Legend />
                <Bar dataKey="Income" name={t('type.income')} fill="#4CAF73" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" name={t('type.expenses')} fill="#E47777" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Net" name={t('chart.net')} fill="#A8D5B5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {noFlow && <div className="chart-empty"><span>{t('stats.noFlow', { cur, when: t('periodThis.' + p) })}</span></div>}
          </div></div>
        <div className="card"><h2>{t('stats.byCategory')}</h2>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={noCats ? [{ name: t('stats.noSpending'), value: 1 }] : catsView} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke={noCats ? 'none' : undefined} isAnimationActive={!noCats}>
                  {noCats ? <Cell fill="#D9E0DB" /> : cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                {!noCats && <Tooltip formatter={(v) => money(v, cur)} />}
                {!noCats && <Legend />}
              </PieChart>
            </ResponsiveContainer>
            {noCats && <div className="chart-empty hole"><span>{t('stats.noSpending')}</span></div>}
          </div></div>
      </div>
      <h2>{t('stats.compare')}</h2>
      <div className="grid2">
        <Cmp label={t('stats.expWeek')} kind="expense" period="week" tx={data.tx} cur={cur} />
        <Cmp label={t('stats.expMonth')} kind="expense" period="month" tx={data.tx} cur={cur} />
        <Cmp label={t('stats.incWeek')} kind="income" period="week" tx={data.tx} cur={cur} />
        <Cmp label={t('stats.incMonth')} kind="income" period="month" tx={data.tx} cur={cur} />
      </div>
      <h2>{t('ins.title')}</h2>
      <div className="grid2">
        <div className="card"><h3>{t('ins.calc')}</h3>
          {top ? <ul className="plain">
            <li>{t('ins.topA')}<b>{cat(top.name)}</b>{t('ins.topB', { amount: money(top.value, cur), pct: Math.round((top.value / mexp) * 100) })}</li>
            <li>{t('ins.perDay', { amount: money(r2(mexp / dayOfMonth), cur) })}</li>
            <li>{t('ins.cut', { cat: cat(top.name), amount: money(r2(top.value * 0.1), cur) })}</li>
            {mcats[1] && <li>{t('ins.next', { cat: cat(mcats[1].name), amount: money(mcats[1].value, cur) })}</li>}
          </ul> : <p className="muted">{t('ins.none', { cur })}</p>}</div>
        <div className="card"><h3>{t('ins.tips')}</h3><ul className="plain"><li>{t('ins.tip1')}</li><li>{t('ins.tip2')}</li><li>{t('ins.tip3')}</li></ul></div>
      </div>
    </>
  );
}
