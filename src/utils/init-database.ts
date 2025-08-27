import { supabase } from './supabase-setup';

export const initializeDatabase = async () => {
  console.log('🚀 Initialisation de la base de données...');
  
  try {
    // Vérifier si les tables existent en essayant de les lire
    const { error: messagesError } = await supabase.from('messages').select('id').limit(1);
    const { error: signalsError } = await supabase.from('signals').select('id').limit(1);
    
    if (messagesError) {
      console.log('📋 Table messages manquante, création...');
      console.log('⚠️ Veuillez créer les tables manuellement dans Supabase Dashboard:');
      console.log(`
-- Table pour les messages des salons
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_type TEXT DEFAULT 'user' CHECK (author_type IN ('user', 'admin')),
  author_avatar TEXT, -- Photo de profil base64 de l'auteur
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les signaux de trading
CREATE TABLE signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  entry_price DECIMAL(10,5) NOT NULL,
  take_profit DECIMAL(10,5),
  stop_loss DECIMAL(10,5),
  description TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WIN', 'LOSS', 'BE')),
  pnl TEXT,
  author TEXT DEFAULT 'Admin',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_signals_channel_id ON signals(channel_id);
CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);

-- RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Politiques : tout le monde peut lire
CREATE POLICY "Everyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Everyone can read signals" ON signals FOR SELECT USING (true);

-- Politiques : utilisateurs authentifiés peuvent écrire
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert signals" ON signals FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Table pour les profils utilisateur (photos de profil synchronisées)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('user', 'admin')),
  profile_image TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index et politiques pour user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert their profile" ON user_profiles FOR INSERT WITH CHECK (true);
      `);
    } else {
      console.log('✅ Table messages trouvée');
    }
    
    if (signalsError) {
      console.log('📊 Table signals manquante - voir script ci-dessus');
    } else {
      console.log('✅ Table signals trouvée');
    }
    
    // Ajouter quelques données de test si les tables sont vides
    if (!messagesError && !signalsError) {
      const { data: existingMessages } = await supabase.from('messages').select('id').limit(1);
      const { data: existingSignals } = await supabase.from('signals').select('id').limit(1);
      
      if (!existingMessages?.length) {
        console.log('💬 Ajout de messages de test...');
        await supabase.from('messages').insert([
          {
            channel_id: 'crypto',
            content: 'Bienvenue dans le salon Crypto ! 🚀',
            author: 'Admin',
            author_type: 'admin'
          },
          {
            channel_id: 'fundamentaux',
            content: 'Voici les bases du trading pour débutants 📚',
            author: 'Admin',
            author_type: 'admin'
          }
        ]);
      }
      
      if (!existingSignals?.length) {
        console.log('📈 Ajout de signaux de test...');
        await supabase.from('signals').insert([
          {
            channel_id: 'crypto',
            type: 'BUY',
            symbol: 'BTC/USDT',
            timeframe: '1H',
            entry_price: 45000,
            take_profit: 46000,
            stop_loss: 44000,
            description: 'Signal de test BTC',
            author: 'Admin'
          },
          {
            channel_id: 'forex',
            type: 'SELL',
            symbol: 'EUR/USD',
            timeframe: '4H',
            entry_price: 1.0950,
            take_profit: 1.0900,
            stop_loss: 1.1000,
            description: 'Signal de test EUR/USD',
            author: 'Admin'
          }
        ]);
      }
    }
    
    console.log('✅ Base de données initialisée !');
    
  } catch (error) {
    console.error('❌ Erreur initialisation database:', error);
  }
};