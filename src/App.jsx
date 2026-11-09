import { Routes, Route, Navigate } from 'react-router-dom';
import { configured } from './lib/supabase';
import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import CompleteProfile from './pages/CompleteProfile';
import { LanguageProvider } from './context/LanguageContext';
import { useTranslation } from './hooks/useTranslation';
import { needsNamePrompt } from './lib/profile';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Savings from './pages/Savings';
import Budgets from './pages/Budgets';
import CalendarPage from './pages/Calendar';
import Settings from './pages/Settings';

function Gate() {
  const { session } = useApp(); const { t } = useTranslation(); const [, rerender] = useState(0);
  if (session === undefined) return <div className="center"><span className="spinner" role="status" aria-label={t('common.loading')} /></div>;
  if (!session) return <Auth />;
  if (needsNamePrompt(session.user)) return <CompleteProfile onSkip={() => rerender((n) => n + 1)} />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
function Setup() {
  const { t } = useTranslation();
  return (
    <div className="center"><div className="card" style={{ maxWidth: 460 }}>
      <h1>{t('app.setupTitle')}</h1>
      <p className="muted">{t('app.setupA')}<code>.env.example</code>{t('app.setupB')}<code>.env</code>{t('app.setupC')}<code>supabase/schema.sql</code>{t('app.setupD')}</p>
    </div></div>
  );
}
export default function App() {
  return <LanguageProvider>{configured ? <AppProvider><Gate /></AppProvider> : <Setup />}</LanguageProvider>;
}
