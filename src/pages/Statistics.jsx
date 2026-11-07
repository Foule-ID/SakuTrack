import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { money } from '../lib/format';
import { range, inRange, sum, byCategory, series, compare, r2 } from '../lib/stats';
import { PAGE_ART } from '../assets';
import StatCard from '../components/StatCard';
const COLORS = ['#4CAF73', '#A8D5B5', '#7A8A7E', '#E47777', '#DCEFE1', '#26352B', '#8BC9A0', '#C9A0A0'];

function Cmp({ label, kind, tx, period, cur }) {
  const now = sum(inRange(tx, range(period)), kind, cur), prev = sum(inRange(tx, range(period, -1)), kind, cur);
  const c = compare(now, prev); const exp = kind === 'expense';
  let msg = `No ${kind} recorded in the previous ${period} to compare with.`; let good = null;
  if (c) {
    const a = Math.abs(c.pct);
    good = exp ? c.pct < 0 : c.pct > 0;
    msg = c.pct === 0 ? `Same as last ${period}.` : exp ? (c.pct < 0 ? `You spent ${a}% less than last ${period}` : `Your expenses increased by ${a}% compared to last ${period}`) : (c.pct > 0 ? `You earned ${a}% more than last ${period}` : `You earned ${a}% less than last ${period}`);
  }
  return (
    <StatCard tone={exp ? 'expense' : 'income'} label={label} value={money(now, cur)}>
      <div className={'stat-msg ' + (good === false ? 'bad' : '')}>{c && c.pct !== 0 ? (c.diff > 0 ? '▲ ' : '▼ ') : ''}{msg}</div>
      {c && <div className="stat-sub">{c.diff > 0 ? '+' : '−'}{money(Math.abs(c.diff), cur)} vs {money(prev, cur)} last {period}. The current {period} is not finished yet.</div>}</StatCard>
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
  const { data, cur } = useApp(); const [p, setP] = useState('month');
  const tx = inRange(data.tx, range(p));
  const inc = sum(tx, 'income', cur), exp = sum(tx, 'expense', cur);
  const flow = series(tx, cur, p === 'year' ? (d) => d.slice(0, 7) : (d) => d);
  const cats = byCategory(tx, cur);
  const noFlow = !flow.length, noCats = !cats.length;
  const chartData = noFlow ? zeroBuckets(p) : flow;
  const mtx = inRange(data.tx, range('month')); const mcats = byCategory(mtx, cur); const mexp = sum(mtx, 'expense', cur);
  const dayOfMonth = new Date().getDate();
  const top = mcats[0];
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.statistics} alt="" /><h1>Statistics</h1></div><div className="seg">{['day', 'week', 'month', 'year'].map((x) => <button key={x} className={p === x ? 'on' : ''} onClick={() => setP(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}</div></header>
      <p className="muted small">Showing {cur} transactions only. Change the main currency in Settings.</p>
      <div className="summary">
        <StatCard tone={inc - exp > 0 ? 'income' : inc - exp < 0 ? 'expense' : 'neutral'} label="Net cash flow" value={money(r2(inc - exp), cur)} />
        <StatCard tone="income" label="Income" value={money(inc, cur)} />
        <StatCard tone="expense" label="Expenses" value={money(exp, cur)} />
      </div>
      <div className="grid2">
        <div className="card"><h2>Cash flow</h2>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis width={60} domain={noFlow ? [0, 100] : undefined} ticks={noFlow ? [0, 25, 50, 75, 100] : undefined} tickFormatter={noFlow ? (v) => (v === 0 ? '0' : '') : undefined} />
                {!noFlow && <Tooltip formatter={(v) => money(v, cur)} />}
                <Legend />
                <Bar dataKey="Income" fill="#4CAF73" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#E47777" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Net" fill="#A8D5B5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {noFlow && <div className="chart-empty"><span>No {cur} transactions in this {p} yet</span></div>}
          </div></div>
        <div className="card"><h2>Spending by category</h2>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={noCats ? [{ name: 'No spending data', value: 1 }] : cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke={noCats ? 'none' : undefined} isAnimationActive={!noCats}>
                  {noCats ? <Cell fill="#D9E0DB" /> : cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                {!noCats && <Tooltip formatter={(v) => money(v, cur)} />}
                {!noCats && <Legend />}
              </PieChart>
            </ResponsiveContainer>
            {noCats && <div className="chart-empty hole"><span>No spending data yet</span></div>}
          </div></div>
      </div>
      <h2>Compared with the previous period</h2>
      <div className="grid2">
        <Cmp label="Expenses this week" kind="expense" period="week" tx={data.tx} cur={cur} />
        <Cmp label="Expenses this month" kind="expense" period="month" tx={data.tx} cur={cur} />
        <Cmp label="Income this week" kind="income" period="week" tx={data.tx} cur={cur} />
        <Cmp label="Income this month" kind="income" period="month" tx={data.tx} cur={cur} />
      </div>
      <h2>Saving recommendations</h2>
      <div className="grid2">
        <div className="card"><h3>Calculated from your data</h3>
          {top ? <ul className="plain">
            <li>Your biggest expense category this month is <b>{top.name}</b>: {money(top.value, cur)} ({Math.round((top.value / mexp) * 100)}% of spending).</li>
            <li>You spend about {money(r2(mexp / dayOfMonth), cur)} per day this month.</li>
            <li>Cutting {top.name} by 10% would save about {money(r2(top.value * 0.1), cur)} a month.</li>
            {mcats[1] && <li>Next largest: {mcats[1].name} at {money(mcats[1].value, cur)}.</li>}
          </ul> : <p className="muted">Record some {cur} expenses this month to get personal insights.</p>}</div>
        <div className="card"><h3>General tips</h3><ul className="plain"><li>Move money to savings right after income arrives.</li><li>Wait 24 hours before non-essential purchases.</li><li>Review subscriptions and recurring bills monthly.</li></ul></div>
      </div>
    </>
  );
}
