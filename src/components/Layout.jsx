import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { BRAND, NAV_ICONS } from '../assets';
// group key, then [path, translation key suffix] (label = nav.<suffix>, short mobile label = navs.<suffix>)
const groups = [
  ['menu', [['/', 'dashboard'], ['/transactions', 'transactions'], ['/statistics', 'statistics'], ['/calendar', 'calendar']]],
  ['planning', [['/budgets', 'budgets'], ['/savings', 'savings']]],
  ['preferences', [['/settings', 'settings']]],
];
const Brand = () => <div className="brand"><img className="brand-logo" src={BRAND.icon} alt="" /><span className="brand-text">SakuTrack</span></div>;
export default function Layout() {
  const { sync } = useApp(); const { t, syncText } = useTranslation();
  return (
    <div className="shell">
      <header className="topbar">
        <Brand />
        <NavLink to="/settings" className="topbtn" aria-label={t('nav.settings')}><img src={NAV_ICONS['/settings'][0]} alt="" /></NavLink>
      </header>
      <nav className="nav" aria-label={t('nav.main')}>
        <Brand />
        {groups.map(([group, links]) => (
          <div className={'navgroup g-' + group} key={group}>
            <div className="navlabel">{t('nav.' + group)}</div>
            {links.map(([to, k]) => (
              <NavLink key={to} to={to} end={to === '/'} title={t('nav.' + k)} className={'navlink' + (to === '/settings' ? ' settings-link' : '')}>
                {({ isActive }) => <><img className="navicon" src={NAV_ICONS[to][isActive ? 1 : 0]} alt="" /><span className="lbl">{t('nav.' + k)}</span><span className="lbl-s">{t('navs.' + k)}</span></>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className={'sync ' + sync.state}>{syncText(sync)}</div>
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}
