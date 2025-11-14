-- Création de la table user_profiles pour gérer les rôles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy : Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy : Les admins peuvent mettre à jour tous les profils
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy : Insertion automatique du profil lors de l'inscription
CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Créer un index pour les requêtes par rôle
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

-- Commentaires pour la documentation
COMMENT ON TABLE user_profiles IS 'Profils utilisateurs avec gestion des rôles admin';
COMMENT ON COLUMN user_profiles.role IS 'Rôle: user ou admin';
COMMENT ON COLUMN user_profiles.id IS 'ID utilisateur (référence auth.users)';