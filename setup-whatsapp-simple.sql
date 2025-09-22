-- Script SIMPLIFIÉ pour WhatsApp Chat
-- À exécuter dans Supabase SQL Editor

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id TEXT NOT NULL,
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
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Table des indicateurs de frappe
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- RLS SIMPLIFIÉ - Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies SIMPLES - Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Users can read messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete messages" ON messages
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read reactions" ON message_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage reactions" ON message_reactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read typing indicators" ON typing_indicators
  FOR SELECT USING (auth.role() = 'authenticated');

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

-- Policy SIMPLE pour le storage
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete chat files" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-files');
