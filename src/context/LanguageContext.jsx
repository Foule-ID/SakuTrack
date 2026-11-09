import { createContext, useCallback, useMemo, useState } from 'react';
import id from '../locales/id.json';
import en from '../locales/en.json';
import { setFormatLocale } from '../lib/format';

// To add a language: create src/locales/<code>.json with the same keys as en.json and register it here.
export const LANGUAGES = {
  id: { name: 'Bahasa Indonesia', short: 'ID', locale: 'id-ID', dict: id },
  en: { name: 'English', short: 'EN', locale: 'en-US', dict: en },
};
export const DEFAULT_LANG = 'id';
export const STORAGE_KEY = 'saku.lang';
const read = () => { try { const s = localStorage.getItem(STORAGE_KEY); return LANGUAGES[s] ? s : DEFAULT_LANG; } catch { return DEFAULT_LANG; } };

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(read);
  // Set before children render so money() and date helpers use the right locale in this very render.
  setFormatLocale(LANGUAGES[lang].locale);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;

  const setLang = useCallback((l) => {
    if (!LANGUAGES[l]) return;
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage unavailable: still switch for this session */ }
    setLangState(l);
  }, []);

  const value = useMemo(() => {
    const { dict, locale } = LANGUAGES[lang];
    // t('key', { var }) ; with { count } it picks key_one / key_other and also fills {n}. Falls back to English, then to the key.
    const t = (key, vars = {}) => {
      let k = key;
      if (vars.count != null) { const p = key + (vars.count === 1 ? '_one' : '_other'); if (dict[p] ?? en[p]) k = p; }
      const s = dict[k] ?? en[k] ?? key;
      return s.replace(/\{(\w+)\}/g, (m, name) => (name === 'n' && vars.count != null && vars.n == null ? vars.count : vars[name] ?? m));
    };
    // Predefined category and account names are stored in English; only their display text is translated. Custom names pass through.
    const cat = (name) => dict['cat.' + name] ?? name;
    const acct = (name) => dict['acct.' + name] ?? name;
    const syncText = (s) => (s.state === 'saving' ? t('sync.saving') : s.state === 'ok' ? t('sync.ok', { time: new Date(s.at || Date.now()).toLocaleTimeString(locale) }) : s.state === 'error' ? s.msg : t('sync.idle'));
    return { lang, setLang, locale, languages: LANGUAGES, t, cat, acct, syncText };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
