-- Migration: Associer les stats fin de session à un compte
-- À exécuter dans Supabase > SQL Editor

-- 1. Ajouter la colonne account (défaut pour rétrocompat)
alter table public.fin_session_stats
add column if not exists account_name text default 'Compte Principal';

-- 2. Mettre à jour les lignes existantes
update public.fin_session_stats
set account_name = 'Compte Principal'
where account_name is null;

-- 3. Supprimer l'ancienne contrainte unique
alter table public.fin_session_stats
drop constraint if exists fin_session_stats_user_id_date_session_key;

-- 4. Nouvelle contrainte unique (user, date, session_type, account)
alter table public.fin_session_stats
add constraint fin_session_stats_user_date_session_account_key
unique(user_id, date, session_type, account_name);

-- 5. Index pour les requêtes
drop index if exists fin_session_stats_user_id_date_session;
create index if not exists fin_session_stats_user_date_session_account
on public.fin_session_stats(user_id, date, session_type, account_name);
