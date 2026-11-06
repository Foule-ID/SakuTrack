import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { money } from '../lib/format';
import { range, inRange, sum, byCategory, series, compare, r2 } from '../lib/stats';
import { PAGE_ART } from '../assets';
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
    <div className="card"><div className="muted">{label}</div><div className="big">{money(now, cur)}</div>
      <div className={good === null ? 'muted' : good ? 'pos' : 'neg'}>{c && c.pct !== 0 ? (c.diff > 0 ? '▲ ' : '▼ ') : ''}{msg}</div>
      {c && <div className="muted small">{c.diff > 0 ? '+' : '−'}{money(Math.abs(c.diff), cur)} vs {money(prev, cur)} last {period}. The current {period} is not finished yet.</div>}</div>
  );
}

export default function Statistics() {
  const { data, cur } = useApp(); const [p, setP] = useState('month');
  const tx = inRange(data.tx, range(p));
  const inc = sum(tx, 'income', cur), exp = sum(tx, 'expense', cur);
  const flow = series(tx, cur, p === 'year' ? (d) => d.slice(0, 7) : (d) => d);
  const cats = byCategory(tx, cur);
  const mtx = inRange(data.tx, range('month')); const mcats = byCategory(mtx, cur); const mexp = sum(mtx, 'expense', cur);
  const dayOfMonth = new Date().getDate();
  const top = mcats[0];
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.statistics} alt="" /><h1>Statistics</h1></div><div className="seg">{['day', 'week', 'month', 'year'].map((x) => <button key={x} className={p === x ? 'on' : ''} onClick={() => setP(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}</div></header>
      <p className="muted small">Showing {cur} transactions only. Change the main currency in Settings.</p>
      <div className="grid3">
        <div className="card"><div className="muted">Income</div><div className="big pos">{money(inc, cur)}</div></div>
        <div className="card"><div className="muted">Expenses</div><div className="big neg">{money(exp, cur)}</div></div>
        <div className="card"><div className="muted">Net cash flow</div><div className={'big ' + (inc - exp >= 0 ? 'pos' : 'neg')}>{money(r2(inc - exp), cur)}</div></div>
      </div>
      <div className="grid2">
        <div className="card"><h2>Cash flow</h2>{flow.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={flow}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis width={60} /><Tooltip formatter={(v) => money(v, cur)} /><Legend /><Bar dataKey="Income" fill="#4CAF73" radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill="#E47777" radius={[6, 6, 0, 0]} /><Bar dataKey="Net" fill="#A8D5B5" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="muted">No {cur} transactions in this {p}.</p>}</div>
        <div className="card"><h2>Spending by category</h2>{cats.length ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => money(v, cur)} /><Legend /></PieChart></ResponsiveContainer> : <p className="muted">No expenses in this {p}.</p>}</div>
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
