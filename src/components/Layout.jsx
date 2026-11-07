import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BRAND, NAV_ICONS } from '../assets';
// [path, label, short label for the mobile tab bar]
const groups = [
  ['Menu', [['/', 'Dashboard', 'Dashboard'], ['/transactions', 'Transactions', 'Transactions'], ['/statistics', 'Statistics', 'Stats']]],
  ['Planning', [['/budgets', 'Budget Planner', 'Budget'], ['/savings', 'Savings Goals', 'Savings']]],
  ['Preferences', [['/settings', 'Settings', 'Settings']]],
];
const Brand = () => <div className="brand"><img className="brand-logo" src={BRAND.icon} alt="" /><span className="brand-text">SakuTrack</span></div>;
export default function Layout() {
  const { sync } = useApp();
  return (
    <div className="shell">
      <header className="topbar">
        <Brand />
        <NavLink to="/settings" className="topbtn" aria-label="Settings"><img src={NAV_ICONS['/settings'][0]} alt="" /></NavLink>
      </header>
      <nav className="nav" aria-label="Main">
        <Brand />
        {groups.map(([group, links]) => (
          <div className={'navgroup g-' + group.toLowerCase()} key={group}>
            <div className="navlabel">{group}</div>
            {links.map(([to, label, short]) => (
              <NavLink key={to} to={to} end={to === '/'} title={label} className={'navlink' + (to === '/settings' ? ' settings-link' : '')}>
                {({ isActive }) => <><img className="navicon" src={NAV_ICONS[to][isActive ? 1 : 0]} alt="" /><span className="lbl">{label}</span><span className="lbl-s">{short}</span></>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className={'sync ' + sync.state}>{sync.msg}</div>
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}
