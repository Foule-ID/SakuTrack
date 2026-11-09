import { useTranslation } from '../hooks/useTranslation';
import './LanguageSwitcher.css';
// Compact two-button toggle (keyboard accessible, announces the pressed language).
export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useTranslation();
  return (
    <div className="langsw" role="group" aria-label={t('lang.label')}>
      {Object.entries(languages).map(([code, l]) => (
        <button key={code} type="button" lang={code} className={lang === code ? 'on' : ''} aria-pressed={lang === code} title={l.name} aria-label={l.name} onClick={() => setLang(code)}>{l.short}</button>
      ))}
    </div>
  );
}
