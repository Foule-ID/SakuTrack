import { range, inRange, r2 } from './stats';
// Below 80% ok, 80-99.99% warn, 100%+ over
export const level = (pct) => (pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok');
export const periodRange = (period) => range(period === 'weekly' ? 'week' : 'month');
// Counts only expense transactions that match the budget's category and currency, inside the budget's current period
export function track(b, tx) {
  const spent = r2(inRange(tx, periodRange(b.period)).filter((t) => t.type === 'expense' && t.category === b.category && t.currency === b.currency).reduce((s, t) => s + t.amount, 0));
  const pct = (spent / b.amount) * 100;
  return { ...b, spent, pct, left: r2(b.amount - spent), lv: level(pct) };
}
