import React, { useState, useEffect } from 'react';
import { getChannelUsers } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'offline';
}

interface ChannelUsersProps {
  channelId: string;
  isOpen: boolean;
  onClose?: () => void;
}

export default function ChannelUsers({ channelId, isOpen = false, onClose }: ChannelUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChannelUsers = async () => {
      if (!channelId) return;
      
      try {
        setLoading(true);
        const { data, error } = await getChannelUsers(channelId);
        
        if (error) {
          setError('Erreur lors du chargement des utilisateurs');
          console.error('Erreur chargement utilisateurs:', error);
        } else {
          setUsers(data || []);
          setError(null);
        }
      } catch (err) {
        setError('Erreur lors du chargement des utilisateurs');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      loadChannelUsers();
    }
  }, [channelId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Utilisateurs actifs
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Aucun utilisateur actif dans ce salon
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'online' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {user.status === 'online' ? 'En ligne' : 'Hors ligne'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



