import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const num = (v) => (v == null ? null : Number(v));
const empty = { tx: [], goals: [], accounts: [], budgets: [] };

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [sync, setSync] = useState({ state: 'idle' });
  const [toast, setToast] = useState(null);
  const [budgetsError, setBudgetsError] = useState(null); // set when the budgets table is missing, so the rest of the app keeps working
  const [cur, setCurState] = useState(localStorage.getItem('saku.cur') || 'IDR');
  const setCur = (c) => { localStorage.setItem('saku.cur', c); setCurState(c); };
  // Messages are translated at the moment they are shown. A ref keeps this callback stable so switching language never re-fetches data.
  const { t } = useTranslation(); const tRef = useRef(t); tRef.current = t;
  const tt = useCallback((k, v) => tRef.current(k, v), []);
  const notify = useCallback((msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => setSession(d.session));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => l.subscription.unsubscribe();
  }, []);
  const uid = session?.user?.id;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const bp = supabase.from('budgets').select('*').order('created_at', { ascending: false });
    const [t, g, a] = await Promise.all(['transactions', 'goals', 'accounts'].map((n) => supabase.from(n).select('*').order('created_at', { ascending: false })));
    const b = await bp; setBudgetsError(b.error ? b.error.message : null);
    const err = t.error || g.error || a.error;
    if (err) { setSync({ state: 'error', msg: err.message }); notify(tt('toast.loadFailed', { msg: err.message }), 'err'); }
    else {
      setData({
        tx: t.data.map((r) => ({ ...r, amount: Number(r.amount), to_amount: num(r.to_amount), rate: num(r.rate) })),
        goals: g.data.map((r) => ({ ...r, target_amount: Number(r.target_amount), saved: Number(r.saved) })),
        accounts: a.data,
        budgets: b.error ? [] : b.data.map((r) => ({ ...r, amount: Number(r.amount) })),
      });
      setSync({ state: 'ok', at: Date.now() });
    }
    setLoading(false);
  }, [uid, notify, tt]);
  useEffect(() => { if (uid) load(); else setData(empty); }, [uid, load]);

  // Every write reloads from the database, so summaries always match what is stored. Failures are shown, never swallowed.
  const run = async (fn, okMsg) => {
    setSync({ state: 'saving' });
    const { error } = await fn();
    if (error) { setSync({ state: 'error', msg: error.message }); notify(tt('toast.notSaved', { msg: error.message }), 'err'); throw error; }
    await load(); notify(tt(okMsg));
  };
  const T = (n) => supabase.from(n);
  const api = {
    addTx: (r) => run(() => T('transactions').insert(r), 'toast.txAdded'),
    updTx: (id, r) => run(() => T('transactions').update(r).eq('id', id), 'toast.txUpdated'),
    delTx: (id) => run(() => T('transactions').delete().eq('id', id), 'toast.txDeleted'),
    addGoal: (r) => run(() => T('goals').insert(r), 'toast.goalCreated'),
    updGoal: (id, r, m = 'toast.goalUpdated') => run(() => T('goals').update(r).eq('id', id), m),
    delGoal: (id) => run(() => T('goals').delete().eq('id', id), 'toast.goalDeleted'),
    addAccount: (name) => run(() => T('accounts').insert({ name }), 'toast.accountAdded'),
    delAccount: (id) => run(() => T('accounts').delete().eq('id', id), 'toast.accountRemoved'),
    addBudget: (r) => run(() => T('budgets').insert(r), 'toast.budgetCreated'),
    updBudget: (id, r) => run(() => T('budgets').update(r).eq('id', id), 'toast.budgetUpdated'),
    delBudget: (id) => run(() => T('budgets').delete().eq('id', id), 'toast.budgetDeleted'),
    backup: () => run(() => T('backups').insert({ payload: { ...data, exported_at: new Date().toISOString() } }), 'toast.backupSaved'),
    listBackups: () => T('backups').select('id,created_at').order('created_at', { ascending: false }).limit(10),
    // Restore merges: rows in the backup are written back by id; nothing else is deleted.
    restore: async (id) => {
      const { data: b, error } = await T('backups').select('payload').eq('id', id).single();
      if (error) { notify(tt('toast.restoreFailed', { msg: error.message }), 'err'); throw error; }
      const p = b.payload;
      await run(async () => {
        for (const [n, rows] of [['transactions', p.tx], ['goals', p.goals], ['accounts', p.accounts]]) {
          if (rows?.length) { const r = await T(n).upsert(rows.map((x) => ({ ...x, user_id: uid }))); if (r.error) return r; }
        }
        return {};
      }, 'toast.restored');
    },
    signOut: () => supabase.auth.signOut(),
  };
  return (
    <Ctx.Provider value={{ session, data, loading, sync, cur, setCur, notify, api, budgetsError }}>
      {children}
      {toast && <div className={'toast ' + toast.type} role="status">{toast.msg}</div>}
    </Ctx.Provider>
  );
}
