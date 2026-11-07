// Savings contribution planner: pure calculations, nothing stored in the database.
// Dates are handled as LOCAL calendar days (never via UTC) so the day count is right in every timezone and across DST changes.
const DAY = 86400000;
const AVG_MONTH_DAYS = 30.44;
const round2 = (n) => Math.round(n * 100) / 100;

// Strict 'YYYY-MM-DD' -> local midnight Date. Returns null for missing or impossible dates (e.g. 2027-02-31).
export function parseLocalDate(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}
export const localToday = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate());
export const dayKey = (now = new Date()) => `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

// Rounding step for recommendations: Rp100 below Rp10,000 (so small daily amounts are not inflated), otherwise Rp1,000.
const stepFor = (cur, v) => (cur === 'IDR' || cur === 'KRW' ? (v < 10000 ? 100 : 1000) : cur === 'JPY' ? (v < 1000 ? 10 : 100) : 0.01);
const ceilTo = (v, s) => Number((Math.ceil(v / s - 1e-9) * s).toFixed(2));

/**
 * status: achieved | active | today | overdue | no-deadline | invalid-target
 * remaining/progress use the real saved amount; progressPct is capped at 100 for the bar, saved itself is never altered.
 */
export function planGoal(g, today = localToday()) {
  const target = Number(g.target_amount), saved = Math.max(0, Number(g.saved) || 0);
  const deadline = parseLocalDate(g.target_date);
  const base = { deadline, daysLeft: null, overdueDays: 0, daily: null, weekly: null, monthly: null };
  if (!Number.isFinite(target) || target <= 0) return { ...base, status: 'invalid-target', remaining: null, progressPct: 0, progressLabel: 0 };

  const achieved = saved >= target || round2(target - saved) <= 0;
  const remaining = achieved ? 0 : round2(target - saved);
  const progressPct = achieved ? 100 : Math.min(100, (saved / target) * 100);
  const common = { ...base, remaining, progressPct, progressLabel: achieved ? 100 : Math.min(99, Math.floor(progressPct)) };

  const daysLeft = deadline ? Math.round((deadline - today) / DAY) : null; // round() absorbs 23h/25h DST days
  if (achieved) return { ...common, status: 'achieved', daysLeft, daily: 0, weekly: 0, monthly: 0 };
  if (daysLeft === null) return { ...common, status: 'no-deadline' };
  if (daysLeft < 0) return { ...common, status: 'overdue', daysLeft, overdueDays: -daysLeft };
  if (daysLeft === 0) return { ...common, status: 'today', daysLeft };

  const perDay = remaining / daysLeft;
  const rec = (v) => Math.min(ceilTo(v, stepFor(g.currency, v)), remaining); // rounded up, never more than what is left
  return { ...common, status: 'active', daysLeft, daily: rec(perDay), weekly: rec(perDay * 7), monthly: rec(perDay * AVG_MONTH_DAYS) };
}
