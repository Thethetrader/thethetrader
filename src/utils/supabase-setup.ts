import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase-config';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Types pour TypeScript
export interface Message {
  id?: string;
  channel_id: string;
  content: string;
  author: string;
  author_type?: 'user' | 'admin';
  author_avatar?: string; // Photo de profil base64 de l'auteur
  timestamp?: string;
  created_at?: string;
  attachment_data?: string; // Image en base64
  attachment_type?: string; // Type MIME de l'image
  attachment_name?: string; // Nom du fichier
}

export interface Signal {
  id?: string;
  channel_id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  entry_price: number;
  take_profit?: number;
  stop_loss?: number;
  description?: string;
  status?: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  pnl?: string;
  author?: string;
  timestamp?: string;
  created_at?: string;
}

// Fonctions utilitaires
export const addMessage = async (message: Message): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur ajout message:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur ajout message:', error);
    return null;
  }
};

export const getMessages = async (channelId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Erreur récupération messages:', error);
      return [];
    }
    
    console.log(`📨 Messages récupérés pour ${channelId}:`, data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Structure du premier message:', Object.keys(data[0]));
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return [];
  }
};

export const addSignal = async (signal: Signal): Promise<Signal | null> => {
  try {
    const { data, error } = await supabase
      .from('signals')
      .insert(signal)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur ajout signal:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur ajout signal:', error);
    return null;
  }
};

export const getSignals = async (channelId: string): Promise<Signal[]> => {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('channel_id', channelId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erreur récupération signaux:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur récupération signaux:', error);
    return [];
  }
};

export const updateSignalStatus = async (signalId: string, status: 'WIN' | 'LOSS' | 'BE', pnl?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('signals')
      .update({ status, pnl })
      .eq('id', signalId);
    
    if (error) {
      console.error('Erreur mise à jour signal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur mise à jour signal:', error);
    return false;
  }
};

// Subscriptions temps réel
export const subscribeToMessages = (channelId: string, callback: (message: Message) => void) => {
  console.log('🔌 Création subscription messages pour:', channelId);
  
  // Test de connexion Supabase
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('🔑 Session Supabase:', data.session ? 'Connecté' : 'Non connecté');
    if (error) console.log('❌ Erreur session:', error);
  });
  
  const subscription = supabase
    .channel(`messages-${channelId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, 
      (payload) => {
        console.log('📨 Message reçu via subscription:', payload);
        callback(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log('📡 Status subscription:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscription active pour:', channelId);
      } else if (status === 'CLOSED') {
        console.log('❌ Subscription fermée pour:', channelId);
      } else if (status === 'CHANNEL_ERROR') {
        console.log('💥 Erreur subscription pour:', channelId);
      }
    });
    
  return subscription;
};

export const subscribeToSignals = (channelId: string, callback: (signal: Signal) => void) => {
  return supabase
    .channel(`signals-${channelId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'signals',
        filter: `channel_id=eq.${channelId}`
      }, 
      (payload) => {
        if (payload.eventType === 'INSERT') {
          callback(payload.new as Signal);
        } else if (payload.eventType === 'UPDATE') {
          callback(payload.new as Signal);
        }
      }
    )
    .subscribe();
};