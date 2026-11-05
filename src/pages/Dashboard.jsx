import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { money } from '../lib/format';
import { range, inRange, balance, sum, currencies, cmpTx, series } from '../lib/stats';
import TxRow from '../components/TxRow';
export default function Dashboard() {
  const { data, loading, cur } = useApp(); const nav = useNavigate();
  if (loading && !data.tx.length) return <p className="muted">Loading your data…</p>;
  const mtx = inRange(data.tx, range('month'));
  const others = currencies(data.tx).filter((c) => c !== cur).map((c) => [c, balance(data.tx, c)]).filter(([, b]) => b);
  const recent = [...data.tx].sort(cmpTx).slice(0, 5);
  const start = range('month', -5)[0];
  const flow = series(data.tx.filter((t) => t.date >= start), cur, (d) => d.slice(0, 7));
  return (
    <>
      <header className="head"><h1>Dashboard</h1><button className="btn" onClick={() => nav('/transactions?new=1')}>Add transaction</button></header>
      <div className="grid3">
        <div className="card"><div className="muted">Total balance ({cur})</div><div className="big">{money(balance(data.tx, cur), cur)}</div>
          {others.map(([c, b]) => <div key={c} className="muted small">{money(b, c)}</div>)}</div>
        <div className="card"><div className="muted">Income this month</div><div className="big pos">{money(sum(mtx, 'income', cur), cur)}</div></div>
        <div className="card"><div className="muted">Expenses this month</div><div className="big neg">{money(sum(mtx, 'expense', cur), cur)}</div></div>
      </div>
      <div className="grid2">
        <div className="card"><h2>Cash flow, last 6 months</h2>
          {flow.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={flow}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis width={60} /><Tooltip formatter={(v) => money(v, cur)} /><Bar dataKey="Income" fill="#4CAF73" radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill="#E47777" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            : <p className="muted">Add a transaction in {cur} to see your cash flow.</p>}</div>
        <div className="card"><h2>Savings progress</h2>
          {data.goals.length ? data.goals.slice(0, 3).map((g) => <div key={g.id} className="goalmini"><div className="between"><span>{g.name}</span><span className="muted small">{Math.min(100, Math.round((g.saved / g.target_amount) * 100))}%</span></div><div className="bar"><i style={{ width: Math.min(100, (g.saved / g.target_amount) * 100) + '%' }} /></div></div>)
            : <p className="muted">No goals yet. Create one under Savings Goals.</p>}</div>
      </div>
      <div className="card"><h2>Recent transactions</h2>
        {recent.length ? <ul className="list">{recent.map((t) => <TxRow key={t.id} t={t} />)}</ul> : <p className="muted">Nothing recorded yet. Add your first transaction.</p>}</div>
    </>
  );
}
