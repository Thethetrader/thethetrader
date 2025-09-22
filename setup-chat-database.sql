-- Script de création des tables pour SuperChat
-- Exécutez ce script dans l'éditeur SQL de votre dashboard Supabase

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des messages de chat (utilise les types existants)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(500),
  channel_id VARCHAR(100) DEFAULT 'general' NOT NULL,
  message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement')) DEFAULT 'text',
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pièces jointes
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  url VARCHAR(500) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, emoji, user_id)
);

-- Table des statuts de lecture
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Table des utilisateurs en train d'écrire
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  channel_id VARCHAR(100) NOT NULL,
  is_typing BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Activer RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Policies pour messages
CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = author_id);

-- Policies pour attachments
CREATE POLICY "Attachments are viewable by everyone" ON message_attachments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert attachments" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_messages 
      WHERE chat_messages.id = message_attachments.message_id 
      AND chat_messages.author_id = auth.uid()
    )
  );

-- Policies pour reactions
CREATE POLICY "Reactions are viewable by everyone" ON message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour read status
CREATE POLICY "Read status is viewable by everyone" ON message_read_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own read status" ON message_read_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status" ON message_read_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour typing status
CREATE POLICY "Typing status is viewable by everyone" ON typing_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own typing status" ON typing_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status" ON typing_status
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status" ON typing_status
  FOR DELETE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author ON chat_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_read_status_message ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_channel ON typing_status(channel_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket de stockage pour les fichiers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le stockage
CREATE POLICY "Chat files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
