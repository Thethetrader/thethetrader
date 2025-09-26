import { useState, useEffect, useCallback, useRef } from 'react';
import supabaseClient, { getCurrentUser } from '../lib/supabase';

export interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

export interface UseTypingIndicatorOptions {
  channelId: string;
  currentUserId?: string;
  typingTimeout?: number; // ms
  cleanupInterval?: number; // ms
}

export const useTypingIndicator = ({
  channelId,
  currentUserId: providedUserId,
  typingTimeout = 3000, // 3 secondes
  cleanupInterval = 1000 // 1 seconde
}: UseTypingIndicatorOptions) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(providedUserId || null);
  const [currentUserName, setCurrentUserName] = useState<string>('Utilisateur');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Initialiser l'utilisateur actuel si non fourni
  useEffect(() => {
    if (providedUserId) {
      setCurrentUserId(providedUserId);
      return;
    }

    const initUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserName(user.user_metadata?.name || user.email || 'Utilisateur');
        } else {
          // Mode admin
          const adminAuth = localStorage.getItem('adminAuthenticated');
          if (adminAuth === 'true') {
            setCurrentUserId('00000000-0000-0000-0000-000000000001');
            setCurrentUserName('Admin');
          }
        }
      } catch (err) {
        console.error('Erreur initialisation utilisateur:', err);
        // Fallback admin
        const adminAuth = localStorage.getItem('adminAuthenticated');
        if (adminAuth === 'true') {
          setCurrentUserId('00000000-0000-0000-0000-000000000001');
          setCurrentUserName('Admin');
        }
      }
    };

    initUser();
  }, [providedUserId]);

  // Nettoyer les utilisateurs inactifs
  const cleanupInactiveUsers = useCallback(() => {
    const now = Date.now();
    setTypingUsers(prev =>
      prev.filter(user => now - user.timestamp < typingTimeout)
    );
  }, [typingTimeout]);

  // Abonnement temps réel aux indicateurs de frappe
  useEffect(() => {
    if (!currentUserId) return;

    // Nettoyer l'abonnement précédent
    if (subscriptionRef.current) {
      supabaseClient.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabaseClient
      .channel(`typing-${channelId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const data = payload.new || payload.old;

          if (!data || data.user_id === currentUserId) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (data.is_typing) {
              setTypingUsers(prev => {
                const existing = prev.find(user => user.id === data.user_id);
                const updatedUser: TypingUser = {
                  id: data.user_id,
                  name: data.user_name,
                  timestamp: Date.now()
                };

                if (existing) {
                  return prev.map(user =>
                    user.id === data.user_id ? updatedUser : user
                  );
                } else {
                  return [...prev, updatedUser];
                }
              });
            } else {
              setTypingUsers(prev =>
                prev.filter(user => user.id !== data.user_id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setTypingUsers(prev =>
              prev.filter(user => user.id !== data.user_id)
            );
          }
        }
      )
      .subscribe();

    // Démarrer l'interval de nettoyage
    cleanupIntervalRef.current = setInterval(cleanupInactiveUsers, cleanupInterval);

    return () => {
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [currentUserId, channelId, cleanupInactiveUsers, cleanupInterval]);

  // Envoyer le statut "en train d'écrire"
  const startTyping = useCallback(async () => {
    if (!currentUserId || isTyping) return;

    try {
      const now = Date.now();

      // Éviter les envois trop fréquents
      if (now - lastTypingTimeRef.current < 500) return;

      lastTypingTimeRef.current = now;

      const { error } = await supabaseClient
        .from('typing_status')
        .upsert({
          user_id: currentUserId,
          user_name: currentUserName,
          channel_id: channelId,
          is_typing: true,
          last_seen: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur début frappe:', error);
        return;
      }

      setIsTyping(true);

      // Arrêter automatiquement après le timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, typingTimeout);

    } catch (err) {
      console.error('Erreur startTyping:', err);
    }
  }, [currentUserId, currentUserName, channelId, isTyping, typingTimeout]);

  // Arrêter le statut "en train d'écrire"
  const stopTyping = useCallback(async () => {
    if (!currentUserId || !isTyping) return;

    try {
      const { error } = await supabaseClient
        .from('typing_status')
        .delete()
        .eq('user_id', currentUserId)
        .eq('channel_id', channelId);

      if (error) {
        console.error('Erreur arrêt frappe:', error);
      }

      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

    } catch (err) {
      console.error('Erreur stopTyping:', err);
    }
  }, [currentUserId, channelId, isTyping]);

  // Fonction appelée lors de la saisie
  const handleTyping = useCallback(() => {
    if (!currentUserId) return;

    startTyping();

    // Réinitialiser le timeout d'arrêt
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [currentUserId, startTyping, stopTyping, typingTimeout]);

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
      // Arrêter le statut de frappe à la fermeture
      if (isTyping && currentUserId) {
        supabaseClient
          .from('typing_status')
          .delete()
          .eq('user_id', currentUserId)
          .eq('channel_id', channelId)
          .then(() => {
            console.log('Statut frappe nettoyé à la fermeture');
          })
          .catch(err => {
            console.error('Erreur nettoyage statut frappe:', err);
          });
      }
    };
  }, [isTyping, currentUserId, channelId]);

  // Arrêter la frappe quand on quitte la page/composant
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTyping && currentUserId) {
        navigator.sendBeacon('/api/stop-typing', JSON.stringify({
          userId: currentUserId,
          channelId
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isTyping) {
        stopTyping();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTyping, currentUserId, channelId, stopTyping]);

  // Filtrer les utilisateurs en train d'écrire (exclure l'utilisateur actuel)
  const otherTypingUsers = typingUsers.filter(user => user.id !== currentUserId);

  return {
    typingUsers: otherTypingUsers,
    isTyping,
    handleTyping,
    startTyping,
    stopTyping
  };
};