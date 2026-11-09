export const CURRENCIES = ['IDR','USD','EUR','JPY','GBP','SGD','AUD','MYR','CNY','KRW','SAR','CHF'];
const zero = ['IDR','JPY','KRW'];
// Active formatting locale ('id-ID' / 'en-US'), set by LanguageProvider. Only presentation changes: amounts are never converted.
let loc = 'en-US';
export const setFormatLocale = (l) => { loc = l; };
export const getLocale = () => loc;
export const money = (v, c) => new Intl.NumberFormat(loc, { style: 'currency', currency: c, maximumFractionDigits: zero.includes(c) ? 0 : 2 }).format(v || 0);
export const compactNumber = (v) => new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
// 'YYYY-MM-DD' (or longer) -> localized text, built from UTC fields so the shown day can never shift with the viewer's timezone.
export const fmtDate = (key, opts = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) => {
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(key || '');
  return p ? new Date(Date.UTC(+p[1], +p[2] - 1, +p[3])).toLocaleDateString(loc, { timeZone: 'UTC', ...opts }) : (key || '');
};
export const weekday = (d) => (d ? fmtDate(d, { weekday: 'long' }) : '');
// Chart axis labels: 'YYYY-MM' -> "Nov 26", 'YYYY-MM-DD' -> "7 Nov" / "Nov 7" (locale order)
export const fmtTick = (name) => (/^\d{4}-\d{2}$/.test(name) ? fmtDate(name + '-01', { month: 'short', year: '2-digit' }) : fmtDate(name, { day: 'numeric', month: 'short' }));
const local = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString();
export const today = () => local().slice(0, 10);
export const nowTime = () => local().slice(11, 16);
