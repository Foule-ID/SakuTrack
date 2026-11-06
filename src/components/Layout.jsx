import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRAND, NAV_ICONS } from '../assets';
const items = [['/', 'Dashboard'], ['/transactions', 'Transactions'], ['/statistics', 'Statistics'], ['/budgets', 'Budget Planner'], ['/savings', 'Savings Goals'], ['/settings', 'Settings']];
export default function Layout() {
  const { sync } = useApp();
  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand"><img className="brand-logo" src={BRAND.icon} alt="" />SakuTrack</div>
        {items.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className="navlink">{({ isActive }) => <><img className="navicon" src={NAV_ICONS[to][isActive ? 1 : 0]} alt="" /><span className="lbl">{label}</span></>}</NavLink>
        ))}
        <div className={'sync ' + sync.state}>{sync.msg}</div>
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}
