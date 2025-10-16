-- Ajouter la colonne loss_reason à la table personal_trades
-- Ce script ajoute le champ pour stocker les raisons des pertes

ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS loss_reason TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN personal_trades.loss_reason IS 'Raison du stop-loss pour les trades perdants (LOSS)';

-- Créer un index pour optimiser les requêtes par raison de perte
CREATE INDEX IF NOT EXISTS idx_personal_trades_loss_reason 
ON personal_trades(loss_reason) 
WHERE loss_reason IS NOT NULL;

-- Optionnel: Ajouter une contrainte CHECK pour valider les valeurs
-- (Décommente si tu veux forcer les valeurs prédéfinies)
/*
ALTER TABLE personal_trades 
ADD CONSTRAINT check_loss_reason 
CHECK (
  loss_reason IS NULL 
  OR loss_reason IN (
    'mauvais_entree',
    'stop_trop_serre', 
    'news_impact',
    'psychologie',
    'analyse_technique',
    'gestion_risque',
    'timing',
    'volatilite',
    'autre'
  )
);
*/
