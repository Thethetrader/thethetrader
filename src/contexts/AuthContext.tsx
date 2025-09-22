import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getCurrentUser, signInUser, signOutUser, User } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session actuelle
    const getSession = async () => {
      try {
        // Essayer getCurrentUser d'abord
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || 'unknown@example.com'
          });
          console.log('✅ Utilisateur Supabase chargé via getCurrentUser:', currentUser.email);
        } else {
          // Fallback: essayer directement supabase.auth.getUser()
          const { data: { user }, error } = await supabase.auth.getUser();
          if (user && !error) {
            setUser({
              id: user.id,
              email: user.email || 'unknown@example.com'
            });
            console.log('✅ Utilisateur Supabase chargé via getUser:', user.email);
          } else {
            setUser(null);
            console.log('❌ Pas d\'utilisateur Supabase trouvé');
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'unknown@example.com'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInUser(email, password);
    return result;
  };

  const signOut = async () => {
    const result = await signOutUser();
    return result;
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
