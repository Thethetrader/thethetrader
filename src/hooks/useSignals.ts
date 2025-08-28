import { useState, useEffect } from 'react'
import { supabase, Signal } from '../utils/supabase-setup'

export const useSignals = (channel?: string) => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('signals')
          .select('*')
          .order('created_at', { ascending: false })

        if (channel) {
          query = query.eq('channel', channel)
        }

        const { data, error } = await query

        if (error) throw error
        setSignals(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des signaux')
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()

    // Écouter les nouveaux signaux en temps réel
    const subscription = supabase
      .channel('signals_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'signals' },
        (payload) => {
          console.log('Signal change:', payload)
          fetchSignals() // Recharger les signaux
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [channel])

  const createSignal = async (signalData: Omit<Signal, 'id' | 'created_at' | 'created_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase
        .from('signals')
        .insert([
          {
            ...signalData,
            created_by: user.id,
          }
        ])
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erreur lors de la création du signal' }
    }
  }

  const updateSignal = async (id: string, updates: Partial<Signal>) => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du signal' }
    }
  }

  const deleteSignal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('signals')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur lors de la suppression du signal' }
    }
  }

  return {
    signals,
    loading,
    error,
    createSignal,
    updateSignal,
    deleteSignal,
  }
}