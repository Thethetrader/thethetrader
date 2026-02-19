import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase-setup'
import type { User } from '@supabase/supabase-js'
import type { AuthError } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier la session actuelle
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getSession()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const clearError = () => {
    setError(null)
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      setError(null)
      return { success: true, data }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur de connexion'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      setError(null)
      return { success: true, data }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur d\'inscription'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      setError(null)
      return { success: true, data }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur de connexion Google'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      return { error: error.message }
    }
    setError(null)
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setError(error.message)
      return { success: false, error: error.message }
    }
    setError(null)
    return { success: true, data }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  }
}