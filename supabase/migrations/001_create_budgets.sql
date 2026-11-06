-- Budget Planner migration. Safe to run once on an existing SakuTrack database.
-- Only creates the new "budgets" table; existing tables are not touched.
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text,
  category text not null,
  amount numeric(18,2) not null check (amount > 0),
  currency char(3) not null,
  period text not null check (period in ('weekly','monthly')),
  created_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'budgets' and policyname = 'own rows') then
    create policy "own rows" on public.budgets
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
