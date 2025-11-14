-- Créer la table pour les raisons de perte personnalisées
CREATE TABLE IF NOT EXISTS user_loss_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    emoji TEXT NOT NULL,
    label TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, value)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_loss_reasons_user_id 
ON user_loss_reasons(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_loss_reasons ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres raisons
CREATE POLICY "Users can view own loss reasons"
ON user_loss_reasons
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres raisons
CREATE POLICY "Users can insert own loss reasons"
ON user_loss_reasons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres raisons
CREATE POLICY "Users can update own loss reasons"
ON user_loss_reasons
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres raisons
CREATE POLICY "Users can delete own loss reasons"
ON user_loss_reasons
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_loss_reasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_loss_reasons_updated_at
BEFORE UPDATE ON user_loss_reasons
FOR EACH ROW
EXECUTE FUNCTION update_user_loss_reasons_updated_at();

