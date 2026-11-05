import { Routes, Route, Navigate } from 'react-router-dom';
import { configured } from './lib/supabase';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Savings from './pages/Savings';
import Settings from './pages/Settings';

function Gate() {
  const { session } = useApp();
  if (session === undefined) return <div className="center muted">Loading…</div>;
  if (!session) return <Auth />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
export default function App() {
  if (!configured) return (
    <div className="center"><div className="card" style={{ maxWidth: 460 }}>
      <h1>Connect Supabase</h1>
      <p className="muted">Copy <code>.env.example</code> to <code>.env</code>, fill in your project URL and anon key, run <code>supabase/schema.sql</code>, then restart the dev server.</p>
    </div></div>
  );
  return <AppProvider><Gate /></AppProvider>;
}
