import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { money, fmtTick } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { range, inRange, balance, sum, currencies, cmpTx, series } from '../lib/stats';
import TxRow from '../components/TxRow';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import { PAGE_ART, EMPTY_ART, HERO_ART } from '../assets';
export default function Dashboard() {
  const { data, loading, cur } = useApp(); const nav = useNavigate(); const { t } = useTranslation();
  if (loading && !data.tx.length) return <Loading />;
  const mtx = inRange(data.tx, range('month'));
  const others = currencies(data.tx).filter((c) => c !== cur).map((c) => [c, balance(data.tx, c)]).filter(([, b]) => b);
  const recent = [...data.tx].sort(cmpTx).slice(0, 5);
  const start = range('month', -5)[0];
  const flow = series(data.tx.filter((t) => t.date >= start), cur, (d) => d.slice(0, 7));
  // Zero rows for the same six months keep the axes visible when there is no data. They are axis positions, not transactions.
  const noFlow = !flow.length;
  const chartData = noFlow ? [-5, -4, -3, -2, -1, 0].map((o) => ({ name: range('month', o)[0].slice(0, 7), Income: 0, Expenses: 0 })) : flow;
  return (
    <>
      <header className="head"><div className="titlebox"><img className="page-art" src={PAGE_ART.dashboard} alt="" /><h1>{t('nav.dashboard')}</h1></div><button className="btn" onClick={() => nav('/transactions?new=1')}>{t('dash.addTx')}</button></header>
      {!data.tx.length && !data.goals.length && !data.budgets.length && (
        <div className="card hero">
          {[[HERO_ART.manage, t('dash.hero1T'), t('dash.hero1D'), '/transactions?new=1'], [HERO_ART.budget, t('dash.hero2T'), t('dash.hero2D'), '/budgets'], [HERO_ART.goal, t('dash.hero3T'), t('dash.hero3D'), '/savings']].map(([img, title, d, to]) => (
            <button key={to} className="hero-item" onClick={() => nav(to)}><img src={img} alt="" /><strong>{title}</strong><span className="muted small">{d}</span></button>
          ))}
        </div>
      )}
      <div className="summary">
        <StatCard tone="balance" label={t('dash.totalBalance', { cur })} value={money(balance(data.tx, cur), cur)}>
          {others.map(([c, b]) => <div key={c} className="stat-sub">{money(b, c)}</div>)}</StatCard>
        <StatCard tone="income" label={t('dash.incomeMonth')} value={money(sum(mtx, 'income', cur), cur)} />
        <StatCard tone="expense" label={t('dash.expenseMonth')} value={money(sum(mtx, 'expense', cur), cur)} />
      </div>
      <div className="grid2">
        <div className="card"><h2>{t('dash.cashflow6')}</h2>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickFormatter={fmtTick} />
                <YAxis width={60} domain={noFlow ? [0, 100] : undefined} ticks={noFlow ? [0, 25, 50, 75, 100] : undefined} tickFormatter={noFlow ? (v) => (v === 0 ? '0' : '') : undefined} />
                {!noFlow && <Tooltip formatter={(v) => money(v, cur)} labelFormatter={fmtTick} />}
                <Bar dataKey="Income" name={t('type.income')} fill="#4CAF73" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" name={t('type.expenses')} fill="#E47777" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {noFlow && <div className="chart-empty"><span>{t('dash.noTxCur', { cur })}</span></div>}
          </div></div>
        <div className="card"><h2>{t('dash.savingsProgress')}</h2>
          {data.goals.length ? data.goals.slice(0, 3).map((g) => <div key={g.id} className="goalmini"><div className="between"><span>{g.name}</span><span className="muted small">{Math.min(100, Math.round((g.saved / g.target_amount) * 100))}%</span></div><div className="bar"><i style={{ width: Math.min(100, (g.saved / g.target_amount) * 100) + '%' }} /></div></div>)
            : <EmptyState compact art={EMPTY_ART.goals} title={t('dash.noGoals')} text={t('dash.noGoalsHint')} />}</div>
      </div>
      <div className="card"><h2>{t('dash.recent')}</h2>
        {recent.length ? <ul className="list">{recent.map((t) => <TxRow key={t.id} t={t} />)}</ul> : <EmptyState art={EMPTY_ART.transactions} title={t('dash.noTx')} text={t('dash.noTxHint')} />}</div>
    </>
  );
}
