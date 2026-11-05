export const r2 = (n) => Math.round(n * 100) / 100;
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export function range(p, off = 0) {
  const n = new Date(); const y = n.getFullYear(), m = n.getMonth(), d = n.getDate(); let s, e;
  if (p === 'day') { s = new Date(y, m, d + off); e = s; }
  else if (p === 'week') { s = new Date(y, m, d - ((n.getDay() + 6) % 7) + 7 * off); e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6); }
  else if (p === 'month') { s = new Date(y, m + off, 1); e = new Date(y, m + off + 1, 0); }
  else { s = new Date(y + off, 0, 1); e = new Date(y + off, 11, 31); }
  return [iso(s), iso(e)];
}
export const inRange = (tx, [a, b]) => tx.filter((t) => t.date >= a && t.date <= b);
export const cmpTx = (a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || (b.created_at || '').localeCompare(a.created_at || '');
// Signed effect of one transaction on the balance of currency c
export const delta = (t, c) =>
  t.type === 'income' ? (t.currency === c ? t.amount : 0)
  : t.type === 'expense' ? (t.currency === c ? -t.amount : 0)
  : (t.currency === c ? -t.amount : 0) + (t.to_currency === c ? t.to_amount || 0 : 0);
export const balance = (tx, c) => r2(tx.reduce((s, t) => s + delta(t, c), 0));
export const sum = (tx, type, c) => r2(tx.filter((t) => t.type === type && t.currency === c).reduce((s, t) => s + t.amount, 0));
export const currencies = (tx) => [...new Set(tx.flatMap((t) => [t.currency, t.to_currency].filter(Boolean)))];
export function byCategory(tx, c) {
  const m = {};
  tx.filter((t) => t.type === 'expense' && t.currency === c).forEach((t) => (m[t.category] = (m[t.category] || 0) + t.amount));
  return Object.entries(m).map(([name, value]) => ({ name, value: r2(value) })).sort((a, b) => b.value - a.value);
}
export function series(tx, c, keyOf) {
  const m = {};
  tx.forEach((t) => {
    if (t.currency !== c || t.type === 'exchange') return;
    const k = keyOf(t.date); m[k] = m[k] || { name: k, Income: 0, Expenses: 0 };
    if (t.type === 'income') m[k].Income = r2(m[k].Income + t.amount); else m[k].Expenses = r2(m[k].Expenses + t.amount);
  });
  return Object.values(m).sort((a, b) => a.name.localeCompare(b.name)).map((x) => ({ ...x, Net: r2(x.Income - x.Expenses) }));
}
// Returns null when there is no previous data, so the UI never shows a misleading percentage
export const compare = (now, prev) => (prev > 0 ? { pct: r2(((now - prev) / prev) * 100), diff: r2(now - prev) } : null);
