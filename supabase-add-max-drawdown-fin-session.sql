-- À exécuter dans Supabase > SQL Editor (après supabase-add-fin-session-stats.sql)
-- Ajoute la colonne max_drawdown (DD) aux stats fin de session

alter table public.fin_session_stats
  add column if not exists max_drawdown numeric;
