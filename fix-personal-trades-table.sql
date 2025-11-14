-- Ajouter les colonnes manquantes à la table personal_trades

-- Ajouter la colonne account (pour gérer les comptes multiples)
ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS account TEXT DEFAULT 'Compte Principal';

-- Ajouter la colonne loss_reason (pour les raisons de perte)
ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS loss_reason TEXT;

-- Ajouter la colonne timestamp (pour l'heure du trade)
ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS timestamp TEXT;

-- Créer un index pour optimiser les requêtes par compte
CREATE INDEX IF NOT EXISTS idx_personal_trades_account 
ON personal_trades(user_id, account);

-- Créer un index pour optimiser les requêtes par raison de perte
CREATE INDEX IF NOT EXISTS idx_personal_trades_loss_reason 
ON personal_trades(loss_reason) 
WHERE loss_reason IS NOT NULL;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN personal_trades.account IS 'Nom du compte de trading (Compte Principal, Compte 2, etc.)';
COMMENT ON COLUMN personal_trades.loss_reason IS 'Raison du stop-loss pour les trades perdants (LOSS)';
COMMENT ON COLUMN personal_trades.timestamp IS 'Heure du trade au format HH:MM';

