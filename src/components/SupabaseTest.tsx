import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest = () => {
  const [status, setStatus] = useState('🔌 Test de connexion Supabase...')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('🔌 Connexion en cours...')
        
        // Test de connexion basique
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus('❌ Erreur de connexion')
          setDetails(error.message)
        } else {
          setStatus('✅ Connexion Supabase réussie!')
          setDetails(`URL: ${supabase.supabaseUrl}`)
        }

      } catch (err) {
        setStatus('❌ Erreur de connexion')
        setDetails(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    testConnection()
  }, [])

  const addTestSignal = async () => {
    try {
      setStatus('📊 Ajout d\'un signal de test...')
      
      const { data, error } = await supabase
        .from('signals')
        .insert([
          {
            symbol: 'BTCUSDT',
            type: 'buy',
            entry_price: 45000.00,
            stop_loss: 44000.00,
            take_profit: 47000.00,
            risk_reward: 2.0,
            channel: 'crypto',
            notes: 'Signal de test - cassure de résistance'
          }
        ])
        .select()

      if (error) {
        setStatus('❌ Erreur lors de l\'ajout du signal')
        setDetails(error.message)
      } else {
        setStatus('✅ Signal ajouté avec succès!')
        setDetails(`Signal ID: ${data?.[0]?.id}`)
      }

    } catch (err) {
      setStatus('❌ Erreur lors de l\'ajout du signal')
      setDetails(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
      <h3 className="text-white text-lg font-semibold mb-4">🔌 Test Supabase</h3>
      <p className="text-gray-300 mb-2">{status}</p>
      {details && <p className="text-gray-400 text-sm mb-4">{details}</p>}
      
      <button 
        onClick={addTestSignal}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        📊 Ajouter un signal de test
      </button>
    </div>
  )
}

export default SupabaseTest