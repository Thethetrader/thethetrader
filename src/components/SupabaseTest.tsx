import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest = () => {
  const [status, setStatus] = useState('Connexion en cours...')
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test de connexion basique
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(10)

        if (error) {
          setStatus(`❌ Erreur: ${error.message}`)
          return
        }

        setStatus('✅ Connexion Supabase réussie!')
        setTables(data?.map(t => t.table_name) || [])

        // Créer la table signals si elle n'existe pas
        const createSignalsTable = async () => {
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS signals (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
                created_by UUID
              );
            `
          })

          if (createError) {
            console.log('Table signals existe déjà ou erreur:', createError.message)
          } else {
            console.log('✅ Table signals créée!')
          }
        }

        await createSignalsTable()

      } catch (err) {
        setStatus(`❌ Erreur de connexion: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-white text-lg font-semibold mb-4">🔌 Test Supabase</h3>
      <p className="text-gray-300 mb-4">{status}</p>
      
      {tables.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-2">Tables existantes:</h4>
          <ul className="text-gray-400 text-sm">
            {tables.map(table => (
              <li key={table}>• {table}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SupabaseTest