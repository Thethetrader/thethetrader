-- Ajouter la colonne current_balance à la table user_accounts
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(15,2) DEFAULT NULL;

-- Commentaire pour la nouvelle colonne
COMMENT ON COLUMN user_accounts.current_balance IS 'Balance actuelle du compte si déjà commencé à trader (optionnel)';

