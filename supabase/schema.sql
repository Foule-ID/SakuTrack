-- Run in Supabase SQL editor. Row Level Security keeps every user's data private.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  type text not null check (type in ('income','expense','exchange')),
  title text not null check (length(trim(title)) > 0),
  amount numeric(18,2) not null check (amount > 0),
  currency char(3) not null,
  category text not null,
  account text not null,
  date date not null,
  time time not null default '00:00',
  notes text,
  to_currency char(3),
  to_amount numeric(18,2),
  rate numeric(20,8),
  created_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  target_amount numeric(18,2) not null check (target_amount > 0),
  saved numeric(18,2) not null default 0 check (saved >= 0),
  currency char(3) not null,
  target_date date,
  created_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create table public.backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['transactions','goals','accounts','backups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
