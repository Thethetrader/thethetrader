-- Ajouter les colonnes manquantes à la table user_accounts
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_balance DECIMAL(15,2) DEFAULT 0;

-- Commentaires pour les nouvelles colonnes
COMMENT ON COLUMN user_accounts.initial_balance IS 'Balance initiale du compte de trading';
COMMENT ON COLUMN user_accounts.minimum_balance IS 'Balance minimum (stop-loss) du compte';
