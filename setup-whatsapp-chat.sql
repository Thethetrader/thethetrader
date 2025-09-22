-- Script de création des tables pour WhatsApp Chat
-- À exécuter dans Supabase SQL Editor

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL DEFAULT 'general',
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réactions aux messages
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Table des indicateurs de frappe
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL DEFAULT 'general',
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel ON typing_indicators(channel_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour messages
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour typing_indicators
CREATE TRIGGER update_typing_indicators_updated_at 
  BEFORE UPDATE ON typing_indicators 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies

-- Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy pour messages : lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Users can read messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy pour messages : insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy pour messages : mise à jour seulement pour l'expéditeur
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid()::uuid = sender_id);

-- Policy pour messages : suppression seulement pour l'expéditeur
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid()::uuid = sender_id);

-- Policy pour message_reactions : lecture pour tous
CREATE POLICY "Users can read reactions" ON message_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy pour message_reactions : insertion/modification pour tous
CREATE POLICY "Users can manage reactions" ON message_reactions
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy pour typing_indicators : lecture pour tous
CREATE POLICY "Users can read typing indicators" ON typing_indicators
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy pour typing_indicators : insertion/modification pour tous
CREATE POLICY "Users can manage typing indicators" ON typing_indicators
  FOR ALL USING (auth.role() = 'authenticated');

-- Activer Realtime pour les tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Créer le bucket pour les fichiers de chat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour le storage des fichiers de chat
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own chat files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-files' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fonction pour obtenir les réactions groupées par message
CREATE OR REPLACE FUNCTION get_message_reactions_grouped(message_uuid UUID)
RETURNS TABLE(emoji TEXT, count BIGINT, users TEXT[]) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.emoji,
    COUNT(*) as count,
    ARRAY_AGG(u.email) as users
  FROM message_reactions mr
  JOIN auth.users u ON mr.user_id = u.id
  WHERE mr.message_id = message_uuid
  GROUP BY mr.emoji
  ORDER BY count DESC, mr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les messages avec leurs réactions
CREATE OR REPLACE FUNCTION get_messages_with_reactions(channel TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  content TEXT,
  sender_id UUID,
  channel_id TEXT,
  reply_to UUID,
  attachments JSONB,
  status TEXT,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_email TEXT,
  sender_name TEXT,
  reactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    m.channel_id,
    m.reply_to,
    m.attachments,
    m.status,
    m.read_at,
    m.edited_at,
    m.created_at,
    m.updated_at,
    u.email as sender_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as sender_name,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'emoji', r.emoji,
            'count', r.count,
            'users', r.users
          )
        )
        FROM get_message_reactions_grouped(m.id) r
      ),
      '[]'::jsonb
    ) as reactions
  FROM messages m
  JOIN auth.users u ON m.sender_id = u.id
  WHERE m.channel_id = channel
  ORDER BY m.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer quelques messages de test (seulement si un utilisateur est connecté)
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO messages (content, sender_id, channel_id) VALUES
      ('Salut tout le monde ! 👋', auth.uid()::uuid, 'whatsapp-chat'),
      ('Comment ça va ?', auth.uid()::uuid, 'whatsapp-chat'),
      ('Bienvenue dans le chat WhatsApp ! 📱', auth.uid()::uuid, 'whatsapp-chat')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
