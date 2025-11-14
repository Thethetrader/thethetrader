-- Script d'initialisation de la base de données Supabase
-- Exécutez ce script dans l'éditeur SQL de votre dashboard Supabase

-- Activer Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des signaux
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('buy', 'sell')) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8),
  take_profit DECIMAL(20, 8),
  risk_reward DECIMAL(10, 2),
  status VARCHAR(20) CHECK (status IN ('active', 'closed', 'cancelled')) DEFAULT 'active',
  outcome VARCHAR(20) CHECK (outcome IN ('win', 'loss', 'breakeven')),
  channel VARCHAR(20) CHECK (channel IN ('crypto', 'forex', 'futures')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table des trades des utilisateurs
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  profit_loss DECIMAL(20, 8),
  status VARCHAR(20) CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(20) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Activer RLS sur toutes les tables
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour signals
-- Tout le monde peut voir les signaux
CREATE POLICY "Signals are viewable by everyone" ON signals
  FOR SELECT USING (true);

-- Seuls les admins peuvent créer/modifier/supprimer des signaux
CREATE POLICY "Only admins can insert signals" ON signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update signals" ON signals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete signals" ON signals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies pour trades
-- Les utilisateurs ne peuvent voir que leurs propres trades
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres trades
CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres trades
CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour profiles
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insérer quelques signaux d'exemple (optionnel)
-- Vous pouvez supprimer cette section si vous ne voulez pas de données d'exemple
INSERT INTO signals (symbol, type, entry_price, stop_loss, take_profit, risk_reward, channel, notes, created_by) VALUES
('BTCUSDT', 'buy', 45000.00, 44000.00, 47000.00, 2.0, 'crypto', 'Signal d''exemple - cassure de résistance', (SELECT id FROM auth.users LIMIT 1)),
('EURUSD', 'sell', 1.0850, 1.0900, 1.0750, 2.0, 'forex', 'Signal d''exemple - rejet sur résistance', (SELECT id FROM auth.users LIMIT 1)),
('ES', 'buy', 4250.00, 4200.00, 4350.00, 2.0, 'futures', 'Signal d''exemple - rebond sur support', (SELECT id FROM auth.users LIMIT 1));

-- Créer un utilisateur admin (remplacez l'email par le vôtre)
-- Vous devrez d'abord vous inscrire avec cet email, puis exécuter cette requête
-- UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@example.com';