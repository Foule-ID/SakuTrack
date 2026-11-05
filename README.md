# SakuTrack

Personal finance tracker: React + Vite + Recharts, Supabase (Auth + Postgres).

## Setup
1. `npm install`
2. Create a Supabase project. In the SQL editor, run `supabase/schema.sql` (tables + Row Level Security).
3. `cp .env.example .env` and fill in the project URL and **anon** key. Never put the service_role key in frontend code.
4. In Supabase > Authentication > URL Configuration, add your site URL (for example `http://localhost:5173`) so password-reset links return to the app.
5. `npm run dev`, or `npm run build` for production.

## Notes
- Totals and charts use the main currency (Settings). Other currencies are listed separately on the dashboard; the app does not convert them silently.
- Currency exchange rates come from the free frankfurter.app API when you press "Get current rate". If it fails, enter the rate manually.
- Restore merges backup records back by ID; it does not delete newer records.
- This code was written without running it. Run `npm run build` and test sign-up, add/edit/delete a transaction, an exchange, and a backup/restore before relying on it.
