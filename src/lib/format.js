export const CURRENCIES = ['IDR','USD','EUR','JPY','GBP','SGD','AUD','MYR','CNY','KRW','SAR','CHF'];
const zero = ['IDR','JPY','KRW'];
export const money = (v, c) => new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: zero.includes(c) ? 0 : 2 }).format(v || 0);
export const weekday = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' }) : '');
const local = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString();
export const today = () => local().slice(0, 10);
export const nowTime = () => local().slice(11, 16);
