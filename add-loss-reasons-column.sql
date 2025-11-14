-- Ajouter la colonne loss_reasons pour stocker un array de raisons de stop loss
ALTER TABLE personal_trades 
ADD COLUMN IF NOT EXISTS loss_reasons TEXT;

-- Commentaire pour expliquer le format JSON
COMMENT ON COLUMN personal_trades.loss_reasons IS 'Array de raisons de stop loss stocké en JSON (ex: ["mauvais_entree", "stop_trop_serre"])';