-- Table pour le chat profit-loss
CREATE TABLE IF NOT EXISTS profit_loss_chat (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  sender_id text NOT NULL,
  reply_to uuid REFERENCES profit_loss_chat(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted boolean DEFAULT false,
  deleted_at timestamp with time zone
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profit_loss_chat_created_at ON profit_loss_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_profit_loss_chat_sender_id ON profit_loss_chat(sender_id);

-- RLS (Row Level Security) - permettre la lecture et écriture pour tous
ALTER TABLE profit_loss_chat ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow read access to all users" ON profit_loss_chat
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion à tous
CREATE POLICY "Allow insert access to all users" ON profit_loss_chat
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour à tous
CREATE POLICY "Allow update access to all users" ON profit_loss_chat
  FOR UPDATE USING (true);
