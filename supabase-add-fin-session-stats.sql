-- À exécuter dans Supabase > SQL Editor
-- Table: stats fin de session (4 stats psy par jour)

create table if not exists public.fin_session_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  respect_plan text,
  qualite_decisions text,
  gestion_erreur text,
  pression smallint,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.fin_session_stats enable row level security;

create policy "Users can read own fin_session_stats"
  on public.fin_session_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own fin_session_stats"
  on public.fin_session_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own fin_session_stats"
  on public.fin_session_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own fin_session_stats"
  on public.fin_session_stats for delete
  using (auth.uid() = user_id);

create index if not exists fin_session_stats_user_id_date on public.fin_session_stats(user_id, date);
