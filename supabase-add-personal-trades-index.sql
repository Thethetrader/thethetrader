-- Migration: Ajouter index pour accélérer les requêtes personal_trades
-- À exécuter dans Supabase > SQL Editor

-- Index principal pour filtrer par user + date
create index if not exists personal_trades_user_id_date_idx 
on public.personal_trades(user_id, date desc);

-- Index pour filtrer par user + created_at (pour l'ordre chronologique)
create index if not exists personal_trades_user_id_created_at_idx 
on public.personal_trades(user_id, created_at desc);

-- Index pour filtrer par user + account (pour filtrer par compte)
create index if not exists personal_trades_user_id_account_idx 
on public.personal_trades(user_id, account);
