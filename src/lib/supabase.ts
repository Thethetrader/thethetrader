import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/supabase-config'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

// Types pour TypeScript
export type { User } from '@supabase/supabase-js'

export interface Signal {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  entry_price: number
  stop_loss?: number
  take_profit?: number
  risk_reward?: number
  status: 'active' | 'closed' | 'cancelled'
  outcome?: 'win' | 'loss' | 'breakeven'
  created_at: string
  created_by: string
  notes?: string
  channel: 'crypto' | 'forex' | 'futures'
}

export interface Trade {
  id: string
  user_id: string
  signal_id: string
  entry_price: number
  exit_price?: number
  quantity: number
  profit_loss?: number
  status: 'open' | 'closed'
  created_at: string
  closed_at?: string
}