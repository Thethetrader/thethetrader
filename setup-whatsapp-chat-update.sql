-- Mise à jour de la table messages pour WhatsApp Chat
-- Ajouter les colonnes nécessaires si elles n'existent pas

-- Colonne pour tracker les lectures
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_by TEXT[] DEFAULT '{}';

-- Colonne pour les réactions
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Colonne pour les pièces jointes
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Colonne pour les messages modifiés
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Table pour les indicateurs de frappe
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_messages_channel_read_by ON messages(channel_id, read_by);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel ON typing_indicators(channel_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_typing_indicators_updated_at ON typing_indicators;
CREATE TRIGGER update_typing_indicators_updated_at
    BEFORE UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS pour typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Politique pour les indicateurs de frappe
DROP POLICY IF EXISTS "Users can manage typing indicators" ON typing_indicators;
CREATE POLICY "Users can manage typing indicators" ON typing_indicators
  FOR ALL USING (true);

-- Activer Realtime pour les nouvelles tables
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Créer le bucket de stockage pour les images si il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de stockage pour les fichiers de chat
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "Users can delete their chat files" ON storage.objects;
CREATE POLICY "Users can delete their chat files" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid()::text = owner);

-- Fonction pour ajouter un utilisateur à read_by
CREATE OR REPLACE FUNCTION add_user_to_read_by(message_id UUID, user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE messages 
  SET read_by = array_append(read_by, user_id)
  WHERE id = message_id 
  AND NOT (user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de lecture
CREATE OR REPLACE FUNCTION get_message_read_stats(message_id UUID)
RETURNS TABLE(
  total_reads INTEGER,
  read_by_users TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    array_length(m.read_by, 1) as total_reads,
    m.read_by as read_by_users
  FROM messages m
  WHERE m.id = message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test avec quelques messages d'exemple
INSERT INTO messages (channel_id, sender_id, content, read_by, created_at)
VALUES 
  ('whatsapp-chat', 'admin', 'Bienvenue dans le chat WhatsApp ! 🚀', ARRAY['admin'], NOW()),
  ('whatsapp-chat', 'admin', 'Vous pouvez maintenant envoyer des messages, images, réactions et plus !', ARRAY['admin'], NOW())
ON CONFLICT DO NOTHING;
