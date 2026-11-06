import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
const items = [['/', 'Dashboard', '🏠'], ['/transactions', 'Transactions', '💸'], ['/statistics', 'Statistics', '📊'], ['/budgets', 'Budget Planner', '🧾'], ['/savings', 'Savings Goals', '🎯'], ['/settings', 'Settings', '⚙️']];
export default function Layout() {
  const { sync } = useApp();
  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">SakuTrack</div>
        {items.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'} className="navlink"><span aria-hidden>{icon}</span><span className="lbl">{label}</span></NavLink>
        ))}
        <div className={'sync ' + sync.state}>{sync.msg}</div>
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}
