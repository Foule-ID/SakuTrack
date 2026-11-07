import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { money } from '../lib/format';
import { range, inRange, balance, sum, currencies, cmpTx, series } from '../lib/stats';
import TxRow from '../components/TxRow';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import { PAGE_ART, EMPTY_ART, HERO_ART } from '../assets';
export default function Dashboard() {
  const { data, loading, cur } = useApp(); const nav = useNavigate();
  if (loading && !data.tx.length) return <Loading />;
  const mtx = inRange(data.tx, range('month'));
  const others = currencies(data.tx).filter((c) => c !== cur).map((c) => [c, balance(data.tx, c)]).filter(([, b]) => b);
  const recent = [...data.tx].sort(cmpTx).slice(0, 5);
  const start = range('month', -5)[0];
  const flow = series(data.tx.filter((t) => t.date >= start), cur, (d) => d.slice(0, 7));
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.dashboard} alt="" /><h1>Dashboard</h1></div><button className="btn" onClick={() => nav('/transactions?new=1')}>Add transaction</button></header>
      {!data.tx.length && !data.goals.length && !data.budgets.length && (
        <div className="card hero">
          {[[HERO_ART.manage, 'Track your money', 'Record income, expenses and exchanges.', '/transactions?new=1'], [HERO_ART.budget, 'Set a budget', 'Limit spending for each category.', '/budgets'], [HERO_ART.goal, 'Reach your goal', 'Save towards what matters.', '/savings']].map(([img, t, d, to]) => (
            <button key={to} className="hero-item" onClick={() => nav(to)}><img src={img} alt="" /><strong>{t}</strong><span className="muted small">{d}</span></button>
          ))}
        </div>
      )}
      <div className="summary">
        <StatCard tone="balance" label={`Total balance (${cur})`} value={money(balance(data.tx, cur), cur)}>
          {others.map(([c, b]) => <div key={c} className="stat-sub">{money(b, c)}</div>)}</StatCard>
        <StatCard tone="income" label="Income this month" value={money(sum(mtx, 'income', cur), cur)} />
        <StatCard tone="expense" label="Expenses this month" value={money(sum(mtx, 'expense', cur), cur)} />
      </div>
      <div className="grid2">
        <div className="card"><h2>Cash flow, last 6 months</h2>
          {flow.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={flow}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis width={60} /><Tooltip formatter={(v) => money(v, cur)} /><Bar dataKey="Income" fill="#4CAF73" radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill="#E47777" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            : <p className="muted">Add a transaction in {cur} to see your cash flow.</p>}</div>
        <div className="card"><h2>Savings progress</h2>
          {data.goals.length ? data.goals.slice(0, 3).map((g) => <div key={g.id} className="goalmini"><div className="between"><span>{g.name}</span><span className="muted small">{Math.min(100, Math.round((g.saved / g.target_amount) * 100))}%</span></div><div className="bar"><i style={{ width: Math.min(100, (g.saved / g.target_amount) * 100) + '%' }} /></div></div>)
            : <EmptyState compact art={EMPTY_ART.goals} title="No savings goals yet" text="Create one under Savings Goals." />}</div>
      </div>
      <div className="card"><h2>Recent transactions</h2>
        {recent.length ? <ul className="list">{recent.map((t) => <TxRow key={t.id} t={t} />)}</ul> : <EmptyState art={EMPTY_ART.transactions} title="No transactions yet" text="Record your first transaction to start tracking your spending." />}</div>
    </>
  );
}
