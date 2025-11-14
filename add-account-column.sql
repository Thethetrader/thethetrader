-- Ajouter la colonne account à la table personal_trades
ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS account TEXT DEFAULT 'Compte Principal';

-- Créer un index pour les requêtes par compte
CREATE INDEX IF NOT EXISTS personal_trades_account_idx ON personal_trades(account);

-- Commentaire
COMMENT ON COLUMN personal_trades.account IS 'Nom du compte de trading (ex: Compte Principal, MFF, FTMO, etc.)';

