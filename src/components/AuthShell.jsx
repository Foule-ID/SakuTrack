import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import './AuthShell.css';
import { BRAND, HERO_ART, DECOR, STATUS_ICONS } from '../assets';
// Shared split layout for the authentication screens: brand panel (left on desktop, compact header on mobile) + form panel.
export default function AuthShell({ children }) {
  const { t } = useTranslation();
  return (
    <div className="authshell">
      <aside className="auth-brandpanel">
        <div className="ab-top"><img src={BRAND.icon} alt="" /><span>SakuTrack</span></div>
        <div className="ab-body">
          <h2>{t('auth.headline')}</h2>
          <p className="ab-lead">{t('auth.lead')}</p>
          <img className="ab-art" src={HERO_ART.manage} alt="" />
          <ul className="ab-points">{['auth.f1', 'auth.f2', 'auth.f3'].map((k) => <li key={k}><img src={STATUS_ICONS.ok} alt="" />{t(k)}</li>)}</ul>
        </div>
        <img className="ab-sprig" src={DECOR.sprig} alt="" aria-hidden="true" />
      </aside>
      <main className="auth-formpanel">
        <div className="auth-top"><LanguageSwitcher /></div>
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
