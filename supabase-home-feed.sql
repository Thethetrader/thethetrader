-- Tables pour la page Accueil (Home Feed)
-- Exécute ce SQL dans ton dashboard Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS home_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('achat', 'suivi_trade', 'news', 'info')),
  content TEXT NOT NULL,
  image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES home_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS home_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES home_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE home_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_comments ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "read home_posts" ON home_posts FOR SELECT USING (true);
CREATE POLICY "read home_reactions" ON home_reactions FOR SELECT USING (true);
CREATE POLICY "read home_comments" ON home_comments FOR SELECT USING (true);

-- Service role (fonctions Netlify) peut tout faire
-- Pas besoin de policies INSERT/UPDATE/DELETE car on utilise la service key côté serveur
