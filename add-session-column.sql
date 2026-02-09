-- Ajouter la colonne session aux trades personnels (18h, Open Asian, London, NY AM, NY PM)
ALTER TABLE personal_trades
ADD COLUMN IF NOT EXISTS session TEXT;

COMMENT ON COLUMN personal_trades.session IS 'Session de trading: 18h, Open Asian, London, NY AM, NY PM';
