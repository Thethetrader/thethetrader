-- Table pour les trades personnels (journal de trading)
CREATE TABLE IF NOT EXISTS personal_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    entry NUMERIC NOT NULL,
    exit NUMERIC NOT NULL,
    stop_loss NUMERIC,
    pnl NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('WIN', 'LOSS', 'BREAKEVEN')),
    notes TEXT,
    image1 TEXT, -- Base64 ou URL de l'image
    image2 TEXT, -- Base64 ou URL de l'image
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur et date
CREATE INDEX IF NOT EXISTS personal_trades_user_id_idx ON personal_trades(user_id);
CREATE INDEX IF NOT EXISTS personal_trades_date_idx ON personal_trades(date DESC);
CREATE INDEX IF NOT EXISTS personal_trades_user_date_idx ON personal_trades(user_id, date DESC);

-- RLS (Row Level Security)
ALTER TABLE personal_trades ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir uniquement leurs propres trades
CREATE POLICY "Users can view own trades" ON personal_trades
    FOR SELECT USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent insérer leurs propres trades
CREATE POLICY "Users can insert own trades" ON personal_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres trades
CREATE POLICY "Users can update own trades" ON personal_trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leurs propres trades
CREATE POLICY "Users can delete own trades" ON personal_trades
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_personal_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_personal_trades_updated_at ON personal_trades;
CREATE TRIGGER update_personal_trades_updated_at
    BEFORE UPDATE ON personal_trades
    FOR EACH ROW EXECUTE FUNCTION update_personal_trades_updated_at();

-- Commentaires
COMMENT ON TABLE personal_trades IS 'Journal de trading personnel pour chaque utilisateur';
COMMENT ON COLUMN personal_trades.pnl IS 'Profit/Loss du trade';
COMMENT ON COLUMN personal_trades.status IS 'Résultat du trade: WIN, LOSS, ou BREAKEVEN';

