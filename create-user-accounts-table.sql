-- Table pour les comptes de trading des utilisateurs
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique : un utilisateur ne peut pas avoir deux comptes avec le même nom
    UNIQUE(user_id, account_name)
);

-- Index pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS user_accounts_user_id_idx ON user_accounts(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir uniquement leurs propres comptes
CREATE POLICY "Users can view own accounts" ON user_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent insérer leurs propres comptes
CREATE POLICY "Users can insert own accounts" ON user_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres comptes
CREATE POLICY "Users can update own accounts" ON user_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leurs propres comptes
CREATE POLICY "Users can delete own accounts" ON user_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW EXECUTE FUNCTION update_user_accounts_updated_at();

-- Commentaires
COMMENT ON TABLE user_accounts IS 'Comptes de trading personnalisés pour chaque utilisateur';
COMMENT ON COLUMN user_accounts.account_name IS 'Nom du compte (ex: Compte Principal, MFF, FTMO, etc.)';
COMMENT ON COLUMN user_accounts.is_default IS 'Indique si c''est le compte par défaut de l''utilisateur';
