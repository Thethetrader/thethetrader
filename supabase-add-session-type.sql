-- Migration: Ajouter support de plusieurs sessions par jour
-- À exécuter dans Supabase > SQL Editor

-- 1. Ajouter la colonne session_type
alter table public.fin_session_stats 
add column if not exists session_type text default 'Session 1';

-- 2. Supprimer l'ancienne contrainte unique
alter table public.fin_session_stats 
drop constraint if exists fin_session_stats_user_id_date_key;

-- 3. Ajouter nouvelle contrainte unique incluant session_type
alter table public.fin_session_stats
add constraint fin_session_stats_user_id_date_session_key 
unique(user_id, date, session_type);

-- 4. Mettre à jour l'index
drop index if exists fin_session_stats_user_id_date;
create index if not exists fin_session_stats_user_id_date_session 
on public.fin_session_stats(user_id, date, session_type);

-- 5. Mettre à jour les données existantes pour ajouter 'Session 1' si NULL
update public.fin_session_stats 
set session_type = 'Session 1' 
where session_type is null;
