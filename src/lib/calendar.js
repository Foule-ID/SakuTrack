// Calendar logic. Transactions are placed by their stored 'YYYY-MM-DD' date string, which is used as-is:
// it is never parsed through Date/UTC, so a transaction can never shift to the neighbouring day in any timezone.
// Pure calendar arithmetic (weekday of the 1st, days in a month) uses UTC so it is identical in every timezone, including
// zones that once skipped a calendar day. Only "today" comes from the user's local clock. Month is 0-based throughout.
import { r2 } from './stats';
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const monthPrefix = (y, m) => `${y}-${pad(m + 1)}-`;
export const todayKey = (now = new Date()) => dateKey(now.getFullYear(), now.getMonth(), now.getDate());

// Monday-first grid: null = padding cell. Rows are always full weeks (4 to 6 rows).
export function monthCells(y, m) {
  const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Sunday=0 -> 6, Monday=0 -> 0
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();      // day 0 of next month = last day of this one (handles leap years)
  const cells = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push({ key: dateKey(y, m, d), day: d });
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function shiftMonth({ y, m }, delta) {
  const t = y * 12 + m + delta;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}
// { 'YYYY-MM-DD': [tx, ...] } for the visible month only
export function groupByDate(tx, y, m) {
  const prefix = monthPrefix(y, m), out = {};
  for (const t of tx) if (typeof t.date === 'string' && t.date.startsWith(prefix)) (out[t.date] = out[t.date] || []).push(t);
  return out;
}
// Per-currency income / expense / net. Different currencies are never added together and no rates are used.
// Exchange transactions are counted separately and are NOT part of income or expenses.
export function summarize(txs) {
  const byCur = {}; let exchanges = 0;
  for (const t of txs) {
    if (t.type === 'exchange') { exchanges++; continue; }
    const c = (byCur[t.currency] = byCur[t.currency] || { income: 0, expense: 0 });
    c[t.type === 'income' ? 'income' : 'expense'] = r2(c[t.type === 'income' ? 'income' : 'expense'] + t.amount);
  }
  for (const c of Object.values(byCur)) c.net = r2(c.income - c.expense);
  return { byCur, exchanges, count: txs.length };
}
