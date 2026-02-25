import React, { useState, useEffect, useRef, useMemo } from 'react';
import ProfitLoss from './ProfitLoss';
import ChatZone from './ChatZone';
import RumbleTalk from './RumbleTalk';
import ChatCommunauteAdmin from './ChatCommunauteAdmin';
import { addMessage, getMessages, addSignal, getSignals, updateSignalStatus, subscribeToMessages, uploadImage, updateSignalReactions, subscribeToSignals, database, updateMessageReactions, getMessageReactions, subscribeToMessageReactions, deleteMessage, functions } from '../utils/firebase-setup';
import { initializeNotifications, notifyNewSignal, notifySignalClosed, sendLocalNotification } from '../utils/push-notifications';
import { ref, update, onValue, get, remove, push, set } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { syncProfileImage, getProfileImage, initializeProfile } from '../utils/profile-manager';
import { LOSS_REASONS, getLossReasonLabel } from '../config/loss-reasons';
import { signOutAdmin } from '../utils/admin-utils';
import { updateUserProfile, getCurrentUser, getUserProfile, getUserProfileByType, getUserAccounts, addUserAccount, deleteUserAccount, updateUserAccount, UserAccount, supabase, getPersonalTrades as getPersonalTradesFromSupabase, getPersonalTradeById, addPersonalTrade as addPersonalTradeToSupabase, updatePersonalTrade, listenToPersonalTrades, PersonalTrade, type PersonalTradesUpdate, deletePersonalTrade, getFinSessionStatsFromSupabase, upsertFinSessionStatToSupabase, deleteFinSessionStatFromSupabase, getFinSessionCacheKey, type FinSessionData } from '../lib/supabase';
import DailyPnLChart from './DailyPnLChart';
import CheckTradeChecklist from './CheckTradeChecklist';

// Composant Profit Factor Gauge
function ProfitFactorGauge({ totalWins, totalLosses }: { totalWins: number; totalLosses: number }) {
  const winsValue = Number(totalWins);
  const lossesValue = Number(totalLosses);
  if (!Number.isFinite(winsValue) || winsValue < 0 || !Number.isFinite(lossesValue) || lossesValue < 0) {
    return (
      <div className="flex-shrink-0 w-24 h-24 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#4b5563"
            strokeWidth="8"
          />
        </svg>
      </div>
    );
  }

  const total = winsValue + lossesValue;
  if (total === 0) {
    return (
      <div className="flex-shrink-0 w-24 h-24 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#4b5563"
            strokeWidth="8"
          />
        </svg>
      </div>
    );
  }

  const winPercentage = (winsValue / total) * 100;
  const lossPercentage = (lossesValue / total) * 100;
  
  const lossAngle = (lossPercentage / 100) * 360;
  const winAngle = (winPercentage / 100) * 360;
  
  const startAngle = -90;
  const lossEndAngle = startAngle + lossAngle;
  const winEndAngle = lossEndAngle + winAngle;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const radius = 40;
  const centerX = 50;
  const centerY = 50;
  
  const getArcPath = (start: number, end: number) => {
    const startRad = toRad(start);
    const endRad = toRad(end);
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex-shrink-0 relative">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {totalLosses > 0 && (
          <path
            d={getArcPath(startAngle, lossEndAngle)}
            fill="none"
            stroke="var(--loss-color)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}
        
        {totalWins > 0 && (
          <path
            d={getArcPath(lossEndAngle, winEndAngle)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}
      </svg>
      
      {totalLosses > 0 && (
        <div className="absolute -top-2 -right-2 bg-black text-loss text-xs font-bold px-2 py-1 rounded pointer-events-none">
          ${formatAmount(totalLosses)}
        </div>
      )}
      
      {totalWins > 0 && (
        <div className="absolute -bottom-2 -left-2 bg-black text-green-100 text-xs font-bold px-2 py-1 rounded pointer-events-none">
          ${formatAmount(totalWins)}
        </div>
      )}
    </div>
  );
}

// Composant Win Rate Gauge
function WinRateGauge({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) {
    return (
      <div className="flex-shrink-0 w-24 h-24 relative min-w-[6rem]">
        <svg viewBox="0 0 120 60" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#4b5563"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const winPercentage = (wins / total) * 100;
  const lossPercentage = (losses / total) * 100;
  
  const winAngle = (winPercentage / 100) * 180;
  const lossAngle = (lossPercentage / 100) * 180;
  
  const startAngle = -180;
  const lossEndAngle = startAngle + lossAngle;
  const winEndAngle = lossEndAngle + winAngle;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const radius = 40;
  const centerX = 50;
  const centerY = 50;
  
  const getArcPath = (start: number, end: number) => {
    const startRad = toRad(start);
    const endRad = toRad(end);
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  const lossLabelAngle = startAngle + lossAngle / 2;
  const winLabelAngle = lossEndAngle + winAngle / 2;
  
  const getLabelPos = (angle: number, offset: number) => {
    const rad = toRad(angle);
    return {
      x: centerX + (radius + offset) * Math.cos(rad),
      y: centerY + (radius + offset) * Math.sin(rad)
    };
  };
  
  const lossLabelPos = getLabelPos(lossLabelAngle, 18);
  const winLabelPos = getLabelPos(winLabelAngle, 22);

  return (
    <div className="flex-shrink-0 w-24 h-24 relative overflow-visible min-w-[6rem]">
      <svg viewBox="0 0 120 60" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        {losses > 0 && (
          <>
            <path
              d={getArcPath(startAngle, lossEndAngle)}
              fill="none"
              stroke="var(--loss-color)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx={lossLabelPos.x} cy={lossLabelPos.y} r="8" fill="#1f2937" />
            <text
              x={lossLabelPos.x}
              y={lossLabelPos.y + 2}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="white"
            >
              {losses}
            </text>
          </>
        )}
        
        {wins > 0 && (
          <>
            <path
              d={getArcPath(lossEndAngle, winEndAngle)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx={winLabelPos.x} cy={winLabelPos.y} r="8" fill="#1f2937" />
            <text
              x={winLabelPos.x}
              y={winLabelPos.y + 2}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="white"
            >
              {wins}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function AdminInterface() {

  const [selectedChannel, setSelectedChannel] = useState({ id: 'fondamentaux', name: 'fondamentaux' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
  const [showChannelsOverlay, setShowChannelsOverlay] = useState(true);
  const [calendarKey, setCalendarKey] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{[channelId: string]: Array<{id: string, text: string, user: string, timestamp: string, file?: File}>}>({});

  // États pour la gestion des comptes
  const [tradingAccounts, setTradingAccounts] = useState<UserAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('Compte Principal');
  const [tradeAddAccount, setTradeAddAccount] = useState<string>('Compte Principal');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountCurrentBalance, setNewAccountCurrentBalance] = useState('');
  const [newAccountMinimum, setNewAccountMinimum] = useState('');

  // États pour les notifications admin
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // États pour la notification livestream personnalisée
  const [showLivestreamModal, setShowLivestreamModal] = useState(false);
  const [livestreamMessage, setLivestreamMessage] = useState('');

  // Supprimer Tawk.to côté admin
  useEffect(() => {
    // Supprimer le script Tawk s'il existe
    const tawkScript = document.getElementById('tawkto-admin-script') || document.getElementById('tawkto-user-script') || document.getElementById('tawkto-script-admin');
    if (tawkScript) {
      tawkScript.remove();
    }

    // Masquer/cacher le widget Tawk s'il est déjà chargé
    if ((window as any).Tawk_API) {
      (window as any).Tawk_API.hideWidget();
      (window as any).Tawk_API.maximize = () => {};
      (window as any).Tawk_API.minimize = () => {};
      (window as any).Tawk_API.showWidget = () => {};
    }

    // Supprimer l'iframe Tawk si elle existe
    const tawkIframe = document.querySelector('iframe[src*="tawk.to"]');
    if (tawkIframe) {
      (tawkIframe as HTMLElement).style.display = 'none';
      tawkIframe.remove();
    }

    // Supprimer le conteneur Tawk s'il existe
    const tawkContainer = document.getElementById('tawkchat-container') || document.querySelector('[id*="tawk"]');
    if (tawkContainer) {
      (tawkContainer as HTMLElement).style.display = 'none';
      tawkContainer.remove();
    }

    // Observer pour supprimer tout nouveau widget Tawk qui pourrait être ajouté
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (element.id && element.id.includes('tawk')) {
              element.style.display = 'none';
              element.remove();
            }
            if (element.tagName === 'IFRAME' && (element as HTMLIFrameElement).src.includes('tawk.to')) {
              element.style.display = 'none';
              element.remove();
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [showSignalsModal, setShowSignalsModal] = useState(false);
  const [selectedTradesDate, setSelectedTradesDate] = useState<Date | null>(null);
  const [selectedSignalsDate, setSelectedSignalsDate] = useState<Date | null>(null);
  const [pasteArea, setPasteArea] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWinsLossModal, setShowWinsLossModal] = useState(false);
  const [winsLossFilter, setWinsLossFilter] = useState<'WIN' | 'LOSS' | 'BE' | null>(null);
  const [winsLossTradeIndex, setWinsLossTradeIndex] = useState(0);
  const [showPerformanceTableModal, setShowPerformanceTableModal] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fonctions pour le zoom et drag des images
  const handleImageZoom = (delta: number) => {
    setImageZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
  };

  const handleImageDragStart = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleImageDrag = (e: React.MouseEvent) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleImageDragEnd = () => {
    setIsDragging(false);
  };

  const resetImageView = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageZoom === 1) {
      handleImageZoom(0.5);
    }
  };

  // Support tactile pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      (e.target as any).initialDistance = distance;
      (e.target as any).initialZoom = imageZoom;
    } else if (imageZoom > 1) {
      // Drag
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialDistance = (e.target as any).initialDistance;
      const initialZoom = (e.target as any).initialZoom;
      if (initialDistance) {
        const scale = distance / initialDistance;
        const newZoom = initialZoom * scale;
        setImageZoom(Math.max(0.5, Math.min(5, newZoom)));
      }
    } else if (isDragging && imageZoom > 1) {
      // Drag
      const touch = e.touches[0];
      setImagePosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // États pour l'édition du nom d'utilisateur
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [currentUsername, setCurrentUsername] = useState('Admin');
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // État pour les réactions aux messages (côté admin)
  const [messageReactions, setMessageReactions] = useState<{[messageId: string]: {fire: number, users: string[]}}>({});

  // Charger les réactions depuis Firebase et s'abonner aux changements
  useEffect(() => {
    const loadAndSubscribeToReactions = async () => {
      try {
        // Charger les réactions existantes pour tous les messages
        const allMessages = Object.values(messages).flat();
        const reactionsPromises = allMessages.map(async (message) => {
          const reactions = await getMessageReactions(message.id);
          if (reactions) {
            return { messageId: message.id, reactions };
          }
          return null;
        });
        
        const reactionsResults = await Promise.all(reactionsPromises);
        const newReactions: {[messageId: string]: {fire: number, users: string[]}} = {};
        
        reactionsResults.forEach((result) => {
          if (result) {
            newReactions[result.messageId] = result.reactions;
          }
        });
        
        setMessageReactions(newReactions);
        console.log('✅ Réactions messages admin chargées depuis Firebase:', Object.keys(newReactions).length);
        
        // S'abonner aux changements de réactions pour tous les messages
        const subscriptions = allMessages.map((message) => {
          return subscribeToMessageReactions(message.id, (reactions) => {
            if (reactions) {
              setMessageReactions(prev => ({
                ...prev,
                [message.id]: reactions
              }));
              console.log('🔥 Réaction message mise à jour en temps réel:', message.id, reactions);
            }
          });
        });
        
        // Nettoyer les abonnements
        return () => {
          subscriptions.forEach(subscription => {
            if (subscription && typeof subscription === 'function') {
              subscription();
            }
          });
        };
        
      } catch (error) {
        console.error('❌ Erreur chargement réactions messages admin Firebase:', error);
      }
    };
    
    if (Object.keys(messages).length > 0) {
      loadAndSubscribeToReactions();
    }
  }, [messages]);
  
  // S'abonner aux changements de réactions de manière globale (pour tous les messages)
  useEffect(() => {
    console.log('🔄 Admin: Abonnement global aux changements de réactions');
    
    // Créer un nœud de référence pour toutes les réactions aux messages
    const messageReactionsRef = ref(database, 'messageReactions');
    
    const unsubscribe = onValue(messageReactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allReactions = snapshot.val();
        console.log('🔥 Admin: Réactions reçues en temps réel:', allReactions);
        
        // Mettre à jour l'état local avec toutes les réactions
        setMessageReactions(allReactions);
      }
    });
    
    return () => {
      console.log('🔄 Admin: Désabonnement global des réactions');
      unsubscribe();
    };
  }, []);
  
  // S'abonner aux changements des signaux pour synchroniser les réactions
  useEffect(() => {
    const channels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
    
    const subscriptions = channels.map(channelId => {
      return subscribeToSignals(channelId, (updatedSignal) => {
        console.log('🔄 Signal mis à jour reçu:', updatedSignal);
        console.log('🔍 [ADMIN] Signal loss_reason:', (updatedSignal as any).loss_reason);
        
        // Mettre à jour le signal dans l'état local
        setSignals(prev => prev.map(signal => 
          signal.id === updatedSignal.id 
            ? { ...signal, reactions: updatedSignal.reactions || [], loss_reason: (updatedSignal as any).loss_reason }
            : signal
        ));
      });
    });

    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
    };
  }, []);

  // Fonction pour ajouter une réaction flamme à un message (côté admin)
  const handleAddReaction = async (messageId: string) => {
    const currentUser = 'Admin'; // Toujours Admin dans l'interface admin
    
    try {
      // Mettre à jour localement d'abord pour une réponse immédiate
      setMessageReactions(prev => {
        const current = prev[messageId] || { fire: 0, users: [] };
        const userIndex = current.users.indexOf(currentUser);
        
        if (userIndex === -1) {
          // Ajouter la réaction
          return {
            ...prev,
            [messageId]: {
              fire: current.fire + 1,
              users: [...current.users, currentUser]
            }
          };
        } else {
          // Retirer la réaction
          const newUsers = current.users.filter((_, index) => index !== userIndex);
          return {
            ...prev,
            [messageId]: {
              fire: current.fire - 1,
              users: newUsers
            }
          };
        }
      });
      
      // Sauvegarder dans Firebase
      const current = messageReactions[messageId] || { fire: 0, users: [] };
      const userIndex = current.users.indexOf(currentUser);
      
      let newReactions;
      if (userIndex === -1) {
        // Ajouter la réaction
        newReactions = {
          fire: current.fire + 1,
          users: [...current.users, currentUser]
        };
      } else {
        // Retirer la réaction
        newReactions = {
          fire: current.fire - 1,
          users: current.users.filter((_, index) => index !== userIndex)
        };
      }
      
      await updateMessageReactions(messageId, newReactions);
      console.log('✅ Réaction message admin synchronisée avec Firebase:', messageId, newReactions, 'par utilisateur:', currentUser);
      
    } catch (error) {
      console.error('❌ Erreur synchronisation réaction admin Firebase:', error);
      // En cas d'erreur, revenir à l'état précédent
      setMessageReactions(prev => {
        const current = prev[messageId] || { fire: 0, users: [] };
        return {
          ...prev,
          [messageId]: current
        };
      });
    }
  };

  const [lastSeenMessages, setLastSeenMessages] = useState<{[channelId: string]: string}>({});
  const [signals, setSignals] = useState<Array<{
    id: string;
    type: string;
    symbol: string;
    timeframe: string;
    entry: string;
    takeProfit: string;
    stopLoss: string;
    description: string;
    image: File | null;
    timestamp: string;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    channel_id: string;
    reactions?: string[];
    pnl?: string;
    closeMessage?: string;
    loss_reason?: string;
  }>>([]);

  // Fonction pour charger les messages depuis Firebase
  const loadMessages = async (channelId: string) => {
    try {
      const messages = await getMessages(channelId);
      const formattedMessages = messages.map(msg => ({
        id: msg.id || '',
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        author: msg.author,
        author_avatar: msg.author_avatar, // CONSERVER l'avatar de l'auteur !
        attachment: msg.attachment_data ? {
          type: msg.attachment_type || 'image/jpeg',
          name: msg.attachment_name || 'image.jpg'
        } : undefined,
        attachment_data: msg.attachment_data
      }));
      
      setChatMessages(prev => ({
        ...prev,
        [channelId]: formattedMessages
      }));
      
      console.log(`✅ Messages chargés pour ${channelId}:`, formattedMessages.length);
      
      // Scroller vers le bas après le chargement des messages
      setTimeout(() => {
        scrollToBottom();
      }, 5);
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  };

  // Subscription globale pour tous les canaux (ne se recrée pas à chaque changement de canal)
  useEffect(() => {
    const channels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
    
    const subscriptions = channels.map(channelId => {
      return subscribeToMessages(channelId, (newMessage) => {
        console.log(`🔄 Nouveau message reçu dans ${channelId}:`, newMessage);
        
        // Compter les nouveaux messages seulement si on n'est pas dans ce canal
        if (selectedChannel.id !== channelId) {
          console.log(`📊 Message reçu dans ${channelId} (canal non actif)`);
        }
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []); // Supprimer selectedChannel.id de la dépendance

  // Charger les signaux et initialiser les notifications au montage du composant
  useEffect(() => {
    loadSignals(selectedChannel.id);
    
    // Initialiser les notifications push
    initializeNotifications();
  }, []);

  // Charger les messages quand on change de canal
  useEffect(() => {
    loadMessages(selectedChannel.id);
    // Charger aussi les signaux
    loadSignals(selectedChannel.id);
    // Scroller vers le bas quand on entre dans un salon (pas pour journal perso/signaux ni vue calendar)
    if (selectedChannel.id !== 'trading-journal' && selectedChannel.id !== 'user-management' && view !== 'calendar') {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [selectedChannel.id, view]);





  // Les messages temps réel sont gérés par les subscriptions globales

  // Initialiser les signaux existants avec le statut ACTIVE
  useEffect(() => {
    setSignals(prevSignals => 
      prevSignals.map(signal => ({
        ...signal,
        status: signal.status || 'ACTIVE'
      }))
    );
    

  }, []);
  const [chatMessage, setChatMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Initialiser le profil au chargement
  useEffect(() => {
    const initProfile = async () => {
      console.log('🔄 Initialisation profil admin...');
      console.log('📱 PWA Mode:', window.matchMedia('(display-mode: standalone)').matches);
      console.log('🌐 User Agent:', navigator.userAgent.includes('Mobile') ? 'MOBILE' : 'DESKTOP');
      
      // Charger depuis localStorage d'abord, puis Supabase si vide
      const localImage = localStorage.getItem('adminProfileImage');
      if (localImage) {
        setProfileImage(localImage);
        console.log('✅ Photo de profil admin chargée depuis localStorage');
      } else {
        // Si pas dans localStorage, chercher dans Supabase
        console.log('🔍 Recherche de la photo dans Supabase...');
        const supabaseImage = await getProfileImage('admin');
        if (supabaseImage) {
          setProfileImage(supabaseImage);
          console.log('✅ Photo de profil admin chargée depuis Supabase');
        } else {
          console.log('❌ Aucune photo de profil admin trouvée');
        }
      }

      // Charger le nom d'utilisateur admin (Supabase d'abord, puis localStorage)
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log('👤 Utilisateur admin connecté:', user.id, user.email);
          
          const { data } = await getUserProfileByType('admin');
          console.log('📦 Profil admin récupéré de Supabase:', data);
          
          // Charger la photo depuis le profil si disponible
          if (data?.avatar_url && !profileImage) {
            setProfileImage(data.avatar_url);
            localStorage.setItem('adminProfileImage', data.avatar_url);
            console.log('✅ Photo de profil admin chargée depuis Supabase (via getUserProfileByType)');
          }
          
          if (data?.name) {
            setCurrentUsername(data.name);
            console.log('✅ Nom d\'utilisateur admin chargé depuis Supabase:', data.name);
          } else {
            // Profil n'existe pas, créer un profil par défaut
            console.log('⚠️ Pas de profil admin trouvé, création du profil par défaut...');
            const defaultName = 'Admin';
            
            // Créer le profil dans Supabase
            const { data: newProfile } = await updateUserProfile(defaultName, undefined, 'admin');
            
            if (newProfile) {
              setCurrentUsername(defaultName);
              console.log('✅ Nouveau profil admin créé dans Supabase:', newProfile);
            } else {
              // Fallback localStorage
              const localUsername = localStorage.getItem('adminUsername');
              if (localUsername) {
                setCurrentUsername(localUsername);
                console.log('✅ Username admin chargé depuis localStorage:', localUsername);
              } else {
                setCurrentUsername(defaultName);
                console.log('✅ Username admin défini par défaut:', defaultName);
              }
            }
          }
        } else {
          console.log('❌ Aucun utilisateur admin connecté');
          const localUsername = localStorage.getItem('adminUsername');
          if (localUsername) {
            setCurrentUsername(localUsername);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du nom d\'utilisateur admin:', error);
        // Mode dégradé : localStorage
        const localUsername = localStorage.getItem('adminUsername');
        if (localUsername) {
          setCurrentUsername(localUsername);
          console.log('✅ Username admin chargé depuis localStorage (fallback):', localUsername);
        } else {
          console.log('❌ Aucun nom d\'utilisateur admin trouvé, garder "Admin"');
        }
      }
    };
    
    initProfile();
  }, []);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  // États pour la gestion des utilisateurs
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    status: 'active' | 'inactive';
  }>>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: ''
  });
  
  // États pour recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'email' | 'created_at' | 'last_sign_in_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [chatMessages, setChatMessages] = useState<{[channelId: string]: Array<{
    id: string;
    text: string;
    timestamp: string;
    author: string;
    author_avatar?: string;
    attachment?: any;
    attachment_data?: string;
    attachment_type?: string;
    attachment_name?: string;
  }>}>({});

  // Initialiser la base de données au chargement
  useEffect(() => {
    // initializeDatabase();
  }, []);

  // Debug: Afficher profileImage
  useEffect(() => {
    console.log('🔍 Profile image state:', profileImage);
  }, [profileImage]);

  // États pour le journal de trading personnalisé
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<PersonalTrade | null>(null);
  const [showFinSessionModal, setShowFinSessionModal] = useState(false);
  const [finSessionCache, setFinSessionCache] = useState<Record<string, FinSessionData>>({});
  const [finSessionSelectedSession, setFinSessionSelectedSession] = useState<string>('18h');
  const [finSessionRespectPlan, setFinSessionRespectPlan] = useState<'Oui' | 'Non' | 'Partiel' | ''>('');
  const [finSessionQualiteDecisions, setFinSessionQualiteDecisions] = useState<'Lecture' | 'Mixte' | 'Émotion' | ''>('');
  const [finSessionGestionErreur, setFinSessionGestionErreur] = useState<'Oui' | 'Non' | ''>('');
  const [finSessionPression, setFinSessionPression] = useState<number | ''>('');
  const [finSessionMaxDrawdown, setFinSessionMaxDrawdown] = useState<string>('');
  const [finSessionSelectedAccounts, setFinSessionSelectedAccounts] = useState<string[]>(['Compte Principal']);
  const [showLossReasonsModal, setShowLossReasonsModal] = useState(false);
  const [customLossReasons, setCustomLossReasons] = useState(() => {
    const saved = localStorage.getItem('customLossReasons');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Vérifier si ce sont les anciennes raisons (détection par une ancienne raison)
      const hasOldReasons = parsed.some((r: any) => r.value === 'mauvais_entree' || r.value === 'news_impact' || r.value === 'analyse_technique');
      if (hasOldReasons) {
        // Remplacer par les nouvelles raisons
        localStorage.setItem('customLossReasons', JSON.stringify(LOSS_REASONS));
        return LOSS_REASONS;
      }
      return parsed;
    }
    return LOSS_REASONS;
  });
  const [newReason, setNewReason] = useState({ value: '', emoji: '', label: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Récupérer selectedDate depuis localStorage
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : null;
  });
  const [showWeekSignalsModal, setShowWeekSignalsModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [statsPeriod, setStatsPeriod] = useState<'mois' | 'jour'>('mois');

  // Sauvegarder selectedDate dans localStorage
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('selectedDate', selectedDate.toISOString());
    } else {
      localStorage.removeItem('selectedDate');
    }
  }, [selectedDate]);
  
  // Fonction pour charger les signaux depuis Firebase
  const loadSignals = async (channelId: string) => {
    try {
      console.log('🔍 Début loadSignals pour channel:', channelId);
      const startTime = performance.now();
      
      // Charger SEULEMENT les signaux du canal (optimisé)
      const filteredSignals = await getSignals(channelId);
      
      const endTime = performance.now();
      console.log(`⏱️ getSignals a pris ${endTime - startTime} millisecondes`);
      console.log('🔍 Signaux reçus pour channel', channelId, ':', filteredSignals);
      
      const formattedSignals = filteredSignals.map(signal => ({
        id: signal.id || '',
        type: signal.type,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        entry: signal.entry?.toString() || 'N/A',
        takeProfit: signal.takeProfit?.toString() || 'N/A',
        stopLoss: signal.stopLoss?.toString() || 'N/A',
        description: signal.description || '',
        image: null,
        timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: signal.status || 'ACTIVE' as const,
        channel_id: signal.channel_id,
        reactions: signal.reactions || [],
        pnl: signal.pnl,
        closeMessage: signal.closeMessage
      }));
      
      setSignals(formattedSignals.reverse());
      console.log(`✅ Signaux chargés pour ${channelId}:`, formattedSignals.length);
      console.log('🎯 État signals admin après setSignals:', formattedSignals);
    } catch (error) {
      console.error('❌ Erreur chargement signaux:', error);
    }
  };

  // Fonction pour changer de canal et réinitialiser selectedDate si nécessaire
  const handleChannelChange = (channelId: string, channelName: string) => {
    console.log(`📊 [ADMIN] Channel changed from ${selectedChannel.id} to ${channelId}`);
    
    // Réinitialiser selectedDate quand on change de canal
      setSelectedDate(null);
    
    // Changer le canal directement sans démontage
    setSelectedChannel({id: channelId, name: channelName});
    setView('signals');
    setCalendarKey(prev => prev + 1);
    
    // Ne pas scroller pour check-trade car c'est une vue statique
    if (channelId !== 'check-trade') {
      scrollToTop();
    }
    
    console.log(`✅ [ADMIN] Channel changed to ${channelId}`);
    
    // Les signaux seront chargés automatiquement par le useEffect qui écoute selectedChannel.id
  };
  const [personalTrades, setPersonalTrades] = useState<PersonalTrade[]>([]);
  // IDs des trades qu'on vient d'ajouter : ne pas laisser le listener temps réel écraser la liste
  const justAddedTradeIdsRef = useRef<string[]>([]);

  const [tradeData, setTradeData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    entry: '',
    exit: '',
    stopLoss: '',
    pnl: '',
    status: 'WIN' as 'WIN' | 'LOSS' | 'BE',
    lossReason: '',
    lossReasons: [] as string[],
    notes: '',
    image1: null as File | null,
    image2: null as File | null,
    session: '' as string
  });
  
  // Plus besoin de synchroniser l'ID utilisateur avec Supabase (géré automatiquement)
  
  // Synchronisation temps réel des trades personnels
  useEffect(() => {
    console.log('👂 Démarrage synchronisation temps réel trades [ADMIN]...');
    
    // Démarrer l'écoute temps réel
    const unsubscribe = listenToPersonalTrades(
      (tradesOrUpdater: PersonalTradesUpdate) => {
        const pendingIds = justAddedTradeIdsRef.current;
        setPersonalTrades(prev => {
          if (typeof tradesOrUpdater === 'function') {
            return tradesOrUpdater(prev);
          }
          const trades = tradesOrUpdater;
          if (trades.length === 0) {
            if (prev.length > 0 || pendingIds.length > 0) return prev;
            return trades;
          }
          if (pendingIds.length > 0) {
            if (trades.length < prev.length) return prev;
            const hasAll = pendingIds.every(id => trades.some(t => t.id === id));
            if (!hasAll) return prev;
            justAddedTradeIdsRef.current = [];
          }
          return trades;
        });
      },
      (error) => {
        console.error('❌ Erreur synchronisation temps réel [ADMIN]:', error);
      }
    );
    
    // Nettoyer l'écoute au démontage du composant
    return () => {
      console.log('🛑 Arrêt synchronisation temps réel [ADMIN]');
      unsubscribe();
    };
  }, []); // Une seule fois au démarrage

  // Fonctions pour la gestion des comptes
  const loadAccounts = async () => {
    try {
      console.log('🔍 [ADMIN] Chargement des comptes...');
      const accounts = await getUserAccounts();
      console.log('✅ [ADMIN] Comptes chargés:', accounts);
      setTradingAccounts(accounts);
      
      // Si aucun compte, sélectionner "Compte Principal" par défaut
      if (accounts.length === 0) {
        console.log('⚠️ [ADMIN] Aucun compte trouvé');
      } else if (!selectedAccount || selectedAccount === 'Compte Principal') {
        const defaultAccount = accounts.find(acc => acc.is_default) || accounts[0];
        setSelectedAccount(defaultAccount.account_name);
        console.log('✅ [ADMIN] Compte par défaut sélectionné:', defaultAccount.account_name);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Erreur chargement comptes:', error);
    }
  };

  const handleAccountChange = (accountName: string) => {
    setSelectedAccount(accountName);
    localStorage.setItem('selectedAccount', accountName);
    // Effacer la date sélectionnée pour éviter d'afficher les trades de l'ancien compte
    setSelectedDate(null);
    // Forcer un rechargement des trades pour mettre à jour le calendrier
    setPersonalTrades(prev => [...prev]);
    // Forcer un rechargement du calendrier en changeant temporairement la vue
    setView('signals');
    setTimeout(() => setView('calendar'), 100);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      alert('Veuillez entrer un nom de compte');
      return;
    }

    if (tradingAccounts.some(acc => acc.account_name === newAccountName.trim())) {
      alert('Ce nom de compte existe déjà');
      return;
    }

    try {
      const initialBalance = parseFloat(newAccountBalance) || 0;
      const minimumBalance = parseFloat(newAccountMinimum) || 0;
      const currentBalance = newAccountCurrentBalance ? parseFloat(newAccountCurrentBalance) : undefined;
      console.log('🔍 [ADMIN] Appel addUserAccount avec:', newAccountName.trim(), initialBalance, minimumBalance, currentBalance);
      
      const newAccount = await addUserAccount(newAccountName.trim(), initialBalance, minimumBalance, currentBalance);
      if (newAccount) {
        const updatedAccounts = [...tradingAccounts, newAccount];
        setTradingAccounts(updatedAccounts);
        setSelectedAccount(newAccountName.trim());
        setNewAccountName('');
        setNewAccountBalance('');
        setNewAccountCurrentBalance('');
        setNewAccountMinimum('');
        setShowAddAccountModal(false);
        console.log('✅ [ADMIN] Compte ajouté avec succès');
        alert('✅ Compte créé avec succès !');
      } else {
        console.error('❌ [ADMIN] addUserAccount a retourné null');
        alert('❌ Erreur: Impossible de créer le compte. Vérifiez la console pour plus de détails.');
      }
    } catch (error) {
      console.error('❌ [ADMIN] Erreur ajout compte:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur lors de l'ajout du compte: ${errorMessage}`);
    }
  };

  const handleDeleteAccount = async (accountName: string) => {
    try {
      // D'abord supprimer tous les trades associés à ce compte
      const tradesToDelete = personalTrades.filter(trade => 
        (trade.account || 'Compte Principal') === accountName
      );
      
      console.log(`🗑️ [ADMIN] Suppression de ${tradesToDelete.length} trades pour le compte "${accountName}"`);
      
      for (const trade of tradesToDelete) {
        await deletePersonalTrade(trade.id);
      }
      
      // Ensuite supprimer le compte
      const account = tradingAccounts.find(acc => acc.account_name === accountName);
      if (account) {
        await deleteUserAccount(account.id);
        const updatedAccounts = tradingAccounts.filter(acc => acc.id !== account.id);
        setTradingAccounts(updatedAccounts);
        
        if (selectedAccount === accountName) {
          const remainingAccounts = updatedAccounts;
          if (remainingAccounts.length > 0) {
            setSelectedAccount(remainingAccounts[0].account_name);
          } else {
            setSelectedAccount('');
          }
        }
        console.log('✅ [ADMIN] Compte supprimé:', accountName);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Erreur suppression compte:', error);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const handleAccountOptions = async (accountName: string) => {
    const choice = prompt(
      `Options pour "${accountName}":\n\n` +
      `1 - Renommer le compte\n` +
      `2 - Modifier balance et stop-loss\n` +
      `3 - Supprimer le compte\n` +
      `\nEntrez votre choix:`,
      '1'
    );

    if (choice === '1') {
      await handleRenameAccount(accountName);
    } else if (choice === '2') {
      await handleEditAccountSettings(accountName);
    } else if (choice === '3') {
      if (confirm(`Supprimer le compte "${accountName}" et tous ses trades ?`)) {
        await handleDeleteAccount(accountName);
      }
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    try {
      // Créer un message dans tous les canaux de chat pour que les utilisateurs le voient
      const channels = ['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'];
      
      for (const channelId of channels) {
        await addMessage(channelId, `📢 MESSAGE ADMIN: ${notificationMessage}`, 'Admin');
      }

      // Aussi ajouter comme signal pour les notifications push
      await addSignal('admin-notification', {
        symbol: '📢 MESSAGE ADMIN',
        type: 'ADMIN_MESSAGE',
        entry: notificationMessage,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
        channel_id: 'admin-notification',
        pnl: 0,
        reactions: {}
      });

      // Déclencher la notification push comme pour les signaux
      await notifyNewSignal({
        symbol: '📢 MESSAGE ADMIN',
        type: 'ADMIN_MESSAGE',
        entry: notificationMessage,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
        channel_id: 'admin-notification'
      });
      
      // Réinitialiser le modal
      setNotificationMessage('');
      setShowNotificationModal(false);
      
      alert('Message admin envoyé dans tous les salons de chat !');
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      alert('Erreur lors de l\'envoi du message: ' + error.message);
    }
  };

  const handleSendLivestreamNotification = async () => {
    if (!livestreamMessage.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    try {
      const sendLivestreamNotification = httpsCallable(functions, 'sendLivestreamNotification');
      
      // Récupérer tous les tokens FCM
      const tokens = [];
      const fcmTokensRef = ref(database, 'fcm_tokens');
      const snapshot = await get(fcmTokensRef);
      if (snapshot.exists()) {
        const tokensData = snapshot.val();
        Object.values(tokensData).forEach((tokenData: any) => {
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });
      }
      
      if (tokens.length > 0) {
        console.log('📱 Envoi notification livestream personnalisée à', tokens.length, 'utilisateurs...');
        console.log('📝 Message personnalisé:', livestreamMessage);
        
        // Envoyer avec le message personnalisé en paramètre
        const result = await sendLivestreamNotification({ 
          tokens,
          customMessage: livestreamMessage
        });
        
        console.log('✅ Notification livestream envoyée:', result.data);
        alert(`✅ Notification envoyée à ${result.data.successCount} utilisateurs!`);
        
        // Réinitialiser le modal
        setLivestreamMessage('');
        setShowLivestreamModal(false);
      } else {
        alert('⚠️ Aucun utilisateur avec notifications activées');
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification livestream:', error);
      console.error('❌ Détails erreur:', error);
      
      // Afficher tous les détails de l'erreur
      let errorMessage = '❌ ERREUR DÉTAILLÉE:\n\n';
      errorMessage += 'Message: ' + error.message + '\n';
      errorMessage += 'Code: ' + (error.code || 'N/A') + '\n';
      errorMessage += 'Name: ' + (error.name || 'N/A') + '\n';
      
      if (error.details) {
        errorMessage += '\nDetails: ' + JSON.stringify(error.details, null, 2);
      }
      
      alert(errorMessage);
    }
  };

  const handleEditAccountSettings = async (accountName: string) => {
    const account = tradingAccounts.find(acc => acc.account_name === accountName);
    if (!account) return;

    const currentInitialBalance = account.initial_balance || 0;
    const currentCurrentBalance = account.current_balance !== null && account.current_balance !== undefined ? account.current_balance : '';
    const currentMinimum = account.minimum_balance || 0;
    const currentMaxDrawdown = 1250; // Valeur par défaut, à remplacer par account.max_drawdown quand ajouté

    const newInitialBalance = prompt(`Balance initiale pour "${accountName}":`, currentInitialBalance.toString());
    if (newInitialBalance === null) return; // Annulé

    const newCurrentBalance = prompt(`Balance actuelle pour "${accountName}" (optionnel, laisse vide si pas encore commencé):`, currentCurrentBalance.toString());
    if (newCurrentBalance === null) return; // Annulé

    const newMinimum = prompt(`Stop-loss (minimum) pour "${accountName}":`, currentMinimum.toString());
    if (newMinimum === null) return; // Annulé

    const newMaxDrawdown = prompt(`DD Max (drawdown maximum) pour "${accountName}":`, currentMaxDrawdown.toString());
    if (newMaxDrawdown === null) return; // Annulé

    const initialBalanceValue = parseFloat(newInitialBalance) || 0;
    const currentBalanceValue = newCurrentBalance.trim() === '' ? null : (parseFloat(newCurrentBalance) || null);
    const minimumValue = parseFloat(newMinimum) || 0;
    const maxDrawdownValue = parseFloat(newMaxDrawdown) || 1250;

    try {
      // Mettre à jour dans Supabase
      const updatedAccount = await updateUserAccount(account.id, {
        initial_balance: initialBalanceValue,
        current_balance: currentBalanceValue,
        minimum_balance: minimumValue
      });

      if (!updatedAccount) {
        alert('❌ Erreur: Impossible de mettre à jour le compte dans la base de données');
        return;
      }

      // Sauvegarder le DD max dans localStorage (temporaire jusqu'à ajout dans la DB)
      localStorage.setItem(`maxDrawdown_${accountName}`, maxDrawdownValue.toString());
      
      // Mettre à jour l'état local
      const updatedAccounts = tradingAccounts.map(acc =>
        acc.id === account.id
          ? { ...acc, initial_balance: initialBalanceValue, current_balance: currentBalanceValue, minimum_balance: minimumValue }
          : acc
      );
      setTradingAccounts(updatedAccounts);
      console.log('✅ [ADMIN] Paramètres du compte mis à jour');
      alert('✅ Paramètres du compte mis à jour avec succès !');
    } catch (error) {
      console.error('❌ [ADMIN] Erreur mise à jour paramètres:', error);
      alert('Erreur lors de la mise à jour des paramètres');
    }
  };

  const handleRenameAccount = async (oldName: string) => {
    const newName = prompt(`Renommer "${oldName}" en:`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    
    console.log('🔍 [ADMIN] Début renommage:', oldName, '->', newName.trim());
    
    try {
      const account = tradingAccounts.find(acc => acc.account_name === oldName);
      if (!account) {
        console.error('❌ [ADMIN] Compte non trouvé dans la liste locale');
        alert('❌ Compte non trouvé');
        return;
      }

      console.log('📋 [ADMIN] Compte trouvé:', account.id, account.account_name);

      // Mettre à jour dans Supabase
      console.log('💾 [ADMIN] Sauvegarde dans Supabase...');
      const updatedAccount = await updateUserAccount(account.id, {
        account_name: newName.trim()
      });

      console.log('📥 [ADMIN] Réponse Supabase:', updatedAccount);

      if (!updatedAccount) {
        console.error('❌ [ADMIN] updateUserAccount a retourné null');
        alert('❌ Erreur: Impossible de mettre à jour le compte dans la base de données. Vérifiez la console pour plus de détails.');
        return;
      }

      console.log('✅ [ADMIN] Compte mis à jour dans Supabase:', updatedAccount);

      // Mettre à jour les trades associés dans Supabase
      const user = await getCurrentUser();
      if (user) {
        console.log('🔄 [ADMIN] Mise à jour des trades associés...');
        const { data: tradesData, error: updateTradesError } = await supabase
          .from('personal_trades')
          .update({ account: newName.trim() })
          .eq('user_id', user.id)
          .eq('account', oldName)
          .select();

        if (updateTradesError) {
          console.error('❌ [ADMIN] Erreur mise à jour trades:', updateTradesError);
        } else {
          console.log('✅ [ADMIN] Trades mis à jour dans Supabase:', tradesData?.length || 0, 'trades');
        }
      } else {
        console.warn('⚠️ [ADMIN] Utilisateur non trouvé, impossible de mettre à jour les trades');
      }

      // Recharger les trades depuis Supabase pour avoir les données à jour
      console.log('🔄 [ADMIN] Rechargement des trades depuis Supabase...');
      const reloadedTrades = await getPersonalTradesFromSupabase(200);
      setPersonalTrades(prev => (reloadedTrades.length > 0 ? reloadedTrades : prev));
      console.log('✅ [ADMIN] Trades rechargés:', reloadedTrades.length);

      // Mettre à jour le state local des comptes
      const updatedAccounts = tradingAccounts.map(acc => 
        acc.id === account.id 
          ? { ...acc, account_name: newName.trim() }
          : acc
      );
      setTradingAccounts(updatedAccounts);
      
      if (selectedAccount === oldName) {
        setSelectedAccount(newName.trim());
        localStorage.setItem('selectedAccount', newName.trim());
      }
      
      console.log('✅ [ADMIN] Compte renommé avec succès:', oldName, '->', newName);
      alert('✅ Compte renommé avec succès !');
    } catch (error) {
      console.error('❌ [ADMIN] Erreur renommage compte:', error);
      alert('❌ Erreur lors du renommage du compte. Vérifiez la console pour plus de détails.');
    }
  };

  // Charger les comptes au montage du composant
  useEffect(() => {
    loadAccounts();
  }, []);

  // Fonctions pour les calculs de balance et stop-loss (optimisé avec useMemo)
  const getTradesForSelectedAccount = useMemo(() => {
    // Sur TPLN model, afficher uniquement les trades du compte TPLN model
    if (selectedChannel.id === 'tpln-model') {
      const seen = new Set<string>();
      return personalTrades.filter(trade => {
        if ((trade.account || 'Compte Principal') !== 'TPLN model') return false;
        const key = `${trade.date}|${trade.symbol}|${trade.entry}|${trade.exit}|${trade.pnl}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    // Si "Tous les comptes" est sélectionné, retourner tous les trades sauf TPLN model (évite doublons)
    if (selectedAccount === 'Tous les comptes') {
      return personalTrades.filter(trade => {
        const acc = trade.account || 'Compte Principal';
        return acc !== 'TPLN' && acc !== 'TPLN model';
      });
    }
    
    return personalTrades.filter(trade => {
      const tradeAccount = trade.account || 'Compte Principal';
      return tradeAccount === selectedAccount;
    });
  }, [personalTrades, selectedAccount, selectedChannel.id]);

  const calculateAccountBalance = (): number => {
    const accountTrades = getTradesForSelectedAccount;
    const account = tradingAccounts.find(acc => acc.account_name === selectedAccount);
    
    // Si current_balance existe, l'utiliser directement (c'est le solde actuel avec les trades déjà comptés)
    if (account?.current_balance !== null && account?.current_balance !== undefined) {
      // Ajouter seulement le P&L des trades qui sont postérieurs à la date où current_balance a été enregistrée
      // Pour simplifier, on ajoute tous les P&L des trades du mois en cours
      const pnl = calculateTotalPnLTradesForAccount();
      return account.current_balance + pnl;
    }
    
    // Sinon, utiliser initial_balance + P&L
    let initialBalance = account?.initial_balance || 0;
    
    // Fallback vers localStorage si pas dans le compte
    if (!initialBalance) {
      const savedBalances = localStorage.getItem('accountBalances');
      if (savedBalances) {
        const balances = JSON.parse(savedBalances);
        initialBalance = balances[selectedAccount] || 0;
      }
    }
    
    const pnl = calculateTotalPnLTradesForAccount();
    return initialBalance + pnl;
  };

  const calculateTrailingStopLoss = () => {
    const account = tradingAccounts.find(acc => acc.account_name === selectedAccount);
    const currentBalance = calculateAccountBalance();
    const initialBalance = account?.initial_balance || 0;
    const initialStopLoss = account?.minimum_balance || 0;
    
    if (initialStopLoss === 0) {
      return { currentStopLoss: null, remaining: null, percentage: null, isAtRisk: false };
    }
    
    // Calculer le P&L total
    const pnl = calculateTotalPnLTradesForAccount();
    
    // Stop-loss trailing : il monte avec les gains mais ne descend jamais
    const trailingStopLoss = Math.max(initialStopLoss, initialStopLoss + Math.max(0, pnl));
    
    const remaining = currentBalance - trailingStopLoss;
    const percentage = trailingStopLoss > 0 ? ((currentBalance / trailingStopLoss) - 1) * 100 : 0;
    const isAtRisk = remaining < (currentBalance * 0.1); // Alerte si moins de 10% de marge
    
    return { 
      currentStopLoss: trailingStopLoss, 
      remaining, 
      percentage, 
      isAtRisk,
      pnl 
    };
  };

  const calculateTotalPnLTradesForAccount = (): number => {
    return getTradesForSelectedAccount.reduce((total, trade) => total + parsePnL(trade.pnl || '0'), 0);
  };

  // Debug: Afficher les trades au chargement
  useEffect(() => {
    console.log('Trades chargés:', personalTrades);
  }, [personalTrades]);

  // Charger les signaux au démarrage (SIMPLE ET RAPIDE)
  useEffect(() => {
    console.log('🔄 useEffect loadSignals appelé pour channel:', selectedChannel.id);
    loadSignals(selectedChannel.id);
  }, [selectedChannel.id]);

  const [signalData, setSignalData] = useState({
    type: 'BUY',
    symbol: '',
    timeframe: '',
    entry: '',
    takeProfit: '',
    stopLoss: '',
    description: '',
    image: null as File | null
  });
  
  // États pour le copier-coller TradingView
  const [debugMode, setDebugMode] = useState(false);
  const [pasteDebug, setPasteDebug] = useState('');
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Forcer la mise à jour de currentDate vers la date actuelle au chargement
  useEffect(() => {
    const now = new Date();
    console.log('🔄 [ADMIN] Mise à jour currentDate vers la date actuelle:', now.toDateString());
    setCurrentDate(now);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fonction utilitaire pour créer une note d'ajout
  const createNoteAddition = (extracted: Record<string, any>) => {
    const parts = [];
    if (extracted.symbol) parts.push(`Symbol: ${extracted.symbol}`);
    if (extracted.tradeType) parts.push(`Type: ${extracted.tradeType.toUpperCase()}`);
    if (extracted.entryPrice) parts.push(`Entry: ${extracted.entryPrice}`);
    if (extracted.exitPrice) parts.push(`Exit: ${extracted.exitPrice}`);
    if (extracted.stopLoss) parts.push(`SL: ${extracted.stopLoss}`);
    if (extracted.rr) parts.push(`R:R: ${extracted.rr}`);
    if (extracted.session) parts.push(`Session: ${extracted.session}`);
    if (extracted.tradeDuration) parts.push(`Duration: ${extracted.tradeDuration}`);
    
    return `[Auto-extracted] ${parts.join(' | ')}`;
  };

  // Fonction utilitaire pour mettre à jour les données du formulaire
  const updateFormData = (updates: Partial<typeof signalData>) => {
    setSignalData(prev => ({ ...prev, ...updates }));
  };

  // FIXED: Completely rewritten TradingView paste handler to match Google Apps Script logic
  const handleTradingViewPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    // Debug info
    if (debugMode) {
      setPasteDebug(`HTML: ${pastedHtml.slice(0, 300)}...\nText: ${pastedText.slice(0, 300)}...`);
    }
    
    // Store extracted data
    const extracted: Record<string, any> = {};
    let found = false;
    
    // Check if we have TradingView data
    if (pastedHtml.includes('data-tradingview-clip')) {
      try {
        // Extract the TradingView JSON data
        const regex = /data-tradingview-clip="([^"]+)"/;
        const match = pastedHtml.match(regex);
        
        if (match && match[1]) {
          // Replace HTML entities in the JSON string
          const jsonString = match[1].replace(/&(?:quot|#34);/g, '"');
          const data = JSON.parse(jsonString);
          
          if (debugMode) {
            setPasteDebug(JSON.stringify(data, null, 2));
          }
          
          // Extract source and points - similar to Google Apps Script
          const source = data.sources?.[0]?.source;
          const points = source?.points;
          const state = source?.state;
          const stopLevel = state?.stopLevel;
          const profitLevel = state?.profitLevel;
          
          if (points && points.length >= 2) {
            found = true;
            
            // Get ticker symbol and clean it
            let symbolFull = state?.symbol || "";
            let ticker = symbolFull.split(":")[1] || symbolFull;
            // Clean common futures symbols
            if (ticker.startsWith("NQ1")) ticker = "NQ";
            else if (ticker.startsWith("ES1")) ticker = "ES";
            else if (ticker.startsWith("MNQ")) ticker = "MNQ";
            
            extracted.symbol = ticker;
            
            // Determine trade type from the tool
            const type = source?.type;
            if (type === "LineToolRiskRewardLong" || /long/i.test(type)) {
              extracted.tradeType = 'buy';
              extracted.outcome = 'WIN'; // Default to WIN
            } else if (type === "LineToolRiskRewardShort" || /short/i.test(type)) {
              extracted.tradeType = 'sell';
              extracted.outcome = 'WIN'; // Default to WIN
            }
            
            // Extract price information
            const entryPrice = points[0]?.price;
            if (entryPrice !== undefined) {
              extracted.entryPrice = entryPrice.toString();
            }
            
            // For exit price, use the last point
            if (points.length > 1) {
              const exitPrice = points[points.length - 1]?.price;
              if (exitPrice !== undefined) {
                extracted.exitPrice = exitPrice.toString();
              }
            }
            
            // Calculate Risk:Reward ratio and Take Profit if available
            if (stopLevel !== undefined && profitLevel !== undefined && entryPrice !== undefined) {
              const rrRatio = Math.round((profitLevel / stopLevel) * 100) / 100;
              extracted.rr = rrRatio.toString();
              
              // Calculate Stop Loss and Take Profit based on entry price and levels
              let slPrice, tpPrice;
              if (extracted.tradeType === 'buy') {
                // For Long trades
                const stopDistance = stopLevel / 4; 
                const profitDistance = profitLevel / 4;
                slPrice = entryPrice - stopDistance;
                tpPrice = entryPrice + profitDistance;
              } else {
                // For Short trades  
                const stopDistance = stopLevel / 4;
                const profitDistance = profitLevel / 4;
                slPrice = entryPrice + stopDistance;
                tpPrice = entryPrice - profitDistance;
              }
              extracted.stopLoss = slPrice.toString();
              extracted.takeProfit = tpPrice.toString();
            }
            
            // Extract timestamps for entry/exit if available
            if (points[0]?.time_t) {
              const entryTimestamp = points[0].time_t;
              const entryDate = new Date(entryTimestamp * 1000);
              
              // Format entry time for the form
              const entryTimeStr = entryDate.toTimeString().split(' ')[0].slice(0, 5);
              extracted.entryTime = entryTimeStr;
              
              // If we have exit timestamp
              if (points.length > 1 && points[1]?.time_t) {
                const exitTimestamp = points[1].time_t;
                const exitDate = new Date(exitTimestamp * 1000);
                const exitTimeStr = exitDate.toTimeString().split(' ')[0].slice(0, 5);
                extracted.exitTime = exitTimeStr;
                
                // Calculate trade duration
                const durationMs = (exitTimestamp - entryTimestamp) * 1000;
                const durationMin = Math.round(durationMs / 60000);
                
                if (durationMin < 60) {
                  extracted.tradeDuration = `${durationMin}m`;
                } else {
                  const hours = Math.floor(durationMin / 60);
                  const mins = durationMin % 60;
                  extracted.tradeDuration = `${hours}h ${mins}m`;
                }
              }
            }
            
            // Try to determine session based on entry time
            if (points[0]?.time_t) {
              const entryDate = new Date(points[0].time_t * 1000);
              let entryHour = entryDate.getUTCHours() - 4; // EST offset
              if (entryHour < 0) entryHour += 24;
              
              let session = "";
              if (entryHour >= 0 && entryHour < 3) session = "Asian Session";
              else if (entryHour >= 3 && entryHour < 8) session = "London";
              else if (entryHour >= 8 && entryHour < 12) session = "London/NY Overlap";
              else if (entryHour >= 12 && entryHour < 17) session = "New York PM";
              
              if (session) {
                extracted.session = session;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error parsing TradingView data:", err);
        if (debugMode) {
          setPasteDebug(`Error parsing: ${err instanceof Error 
            ? err.message 
            : (typeof err === 'symbol' ? err.toString() : String(err))}`);
        }
      }
    }
    
    // Fallback to plain-text parsing if we didn't find structured data
    if (!found) {
      if (/long/i.test(pastedText)) {
        extracted.tradeType = 'buy';
        extracted.outcome = 'WIN';
        found = true;
      } else if (/short/i.test(pastedText)) {
        extracted.tradeType = 'sell';
        extracted.outcome = 'WIN';
        found = true;
      }
      
      // Try to extract symbol
      const sym = pastedText.match(/\b([A-Z]{1,6}\d*(?:USD|BTC|ETH|EUR)?)\b/);
      if (sym) {
        extracted.symbol = sym[1];
        found = true;
      }
      
      // Try to extract numbers as prices
      const nums = pastedText.match(/\b\d+(\.\d+)?\b/g) || [];
      if (nums.length >= 2) {
        extracted.entryPrice = nums[0];
        extracted.exitPrice = nums[1];
        if (nums.length >= 3) {
          extracted.rr = nums[2];
        }
        found = true;
      }
    }
    
    // Apply extracted data to the form
    if (found) {
      // First update the basic fields
      updateFormData({
        type: extracted.tradeType === 'buy' ? 'BUY' : 'SELL',
        symbol: extracted.symbol || signalData.symbol,
        entry: extracted.entryPrice || signalData.entry,
        takeProfit: extracted.takeProfit || signalData.takeProfit,
        stopLoss: extracted.stopLoss || signalData.stopLoss,
      });
      
      // Add extracted info to description
      if (Object.keys(extracted).length > 0) {
        const noteAddition = createNoteAddition(extracted);
        updateFormData({
          description: signalData.description ? `${signalData.description}\n\n${noteAddition}` : noteAddition
        });
      }
      
      setError('');
    } else {
      // If nothing parsed, just dump the raw text into description
      updateFormData({
        description: `Pasted text:\n${pastedText}\n\n${signalData.description || ''}`
      });
      setError('Could not extract structured trade data; added raw text to description.');
    }
    
    setIsPasteActive(false);
  };

  // Fonctions pour la navigation du calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getMonthName = (date: Date) => {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[date.getMonth()];
  };

  // Fonctions pour calculer les statistiques réelles
  const parsePnL = (pnlString: string): number => {
    if (!pnlString) return 0;
    const cleanStr = pnlString.replace(/[^\d.-]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  // Fonction pour récupérer TOUS les signaux depuis Firebase (indépendant du fil)
const [allSignalsForStats, setAllSignalsForStats] = useState<Array<{
    id: string;
    type: string;
    symbol: string;
    timeframe: string;
    entry: string;
    takeProfit: string;
    stopLoss: string;
    description: string;
    image: File | null;
    timestamp: string;
    originalTimestamp: number;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    channel_id: string;
    reactions?: string[];
    pnl?: string;
    closeMessage?: string;
    loss_reason?: string;
  }>>([]);

const formatDailyKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildCumulativeSeries = (dailyTotals: Map<string, number>, referenceDate: Date, initialBalance: number = 0) => {
  const sortedDates = Array.from(dailyTotals.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let runningTotal = initialBalance;
  const cumulativeAll = sortedDates.map((date) => {
    runningTotal += dailyTotals.get(date) || 0;
    return { date, balance: runningTotal };
  });

  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);

  let index = 0;
  let currentBalance = initialBalance;

  while (index < cumulativeAll.length && new Date(cumulativeAll[index].date) < monthStart) {
    currentBalance = cumulativeAll[index].balance;
    index++;
  }

  const results: { date: string; balance: number }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const key = formatDailyKey(dayDate);

    while (index < cumulativeAll.length && new Date(cumulativeAll[index].date) <= dayDate) {
      currentBalance = cumulativeAll[index].balance;
      index++;
    }

    results.push({ date: key, balance: currentBalance });
  }

  return results;
};

const dailySignalPnLData = useMemo(() => {
  const dailyTotals = new Map<string, number>();

  allSignalsForStats.forEach((signal) => {
    if (!signal || !signal.pnl) {
      return;
    }
    const rawDate = new Date(signal.originalTimestamp || signal.timestamp);
    if (Number.isNaN(rawDate.getTime())) {
      return;
    }
    const key = formatDailyKey(rawDate);
    dailyTotals.set(key, (dailyTotals.get(key) || 0) + parsePnL(signal.pnl));
  });

  return buildCumulativeSeries(dailyTotals, currentDate);
}, [allSignalsForStats, currentDate]);

const dailyTradePnLData = useMemo(() => {
  const dailyTotals = new Map<string, number>();

  // Récupérer la balance du compte sélectionné (current_balance si existe, sinon initial_balance)
  const account = tradingAccounts.find(acc => acc.account_name === selectedAccount);
  let initialBalance = 0;
  
  if (account) {
    // Utiliser current_balance si elle existe et n'est pas null, sinon utiliser initial_balance
    if (account.current_balance !== null && account.current_balance !== undefined) {
      initialBalance = account.current_balance;
    } else {
      initialBalance = account.initial_balance || 0;
    }
  }
  
  // Fallback vers localStorage si pas dans le compte
  if (!initialBalance && selectedAccount !== 'Tous les comptes') {
    const savedBalances = localStorage.getItem('accountBalances');
    if (savedBalances) {
      const balances = JSON.parse(savedBalances);
      initialBalance = balances[selectedAccount] || 0;
    }
  }

  personalTrades.forEach((trade) => {
    if (!trade || !trade.pnl) {
      return;
    }
    const tradeAccount = trade.account || 'Compte Principal';
    if (selectedAccount !== 'Tous les comptes' && tradeAccount !== selectedAccount) {
      return;
    }
    const tradeDate = new Date(trade.date);
    if (Number.isNaN(tradeDate.getTime())) {
      return;
    }
    const key = formatDailyKey(tradeDate);
    dailyTotals.set(key, (dailyTotals.get(key) || 0) + parsePnL(trade.pnl));
  });

  return buildCumulativeSeries(dailyTotals, currentDate, initialBalance);
}, [personalTrades, selectedAccount, currentDate, tradingAccounts]);

const isJournalChannelAdmin = selectedChannel.id === 'trading-journal';

const dailyPnLChartData = useMemo(
  () => (isJournalChannelAdmin ? dailyTradePnLData : dailySignalPnLData),
  [isJournalChannelAdmin, dailyTradePnLData, dailySignalPnLData]
);

  // Charger TOUS les signaux pour les statistiques et le calendrier
  useEffect(() => {
    const loadAllSignalsForStats = async () => {
      try {
        console.log('📊 [ADMIN] Chargement de TOUS les signaux pour statistiques et calendrier...');
        
        // Charger les signaux de tous les canaux individuellement
        const channels = ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
        let allSignals: any[] = [];
        
        for (const channelId of channels) {
          try {
            console.log(`🔍 [ADMIN] Chargement signaux pour ${channelId}...`);
            const channelSignals = await getSignals(channelId, 100); // 100 signaux par canal
            if (channelSignals && channelSignals.length > 0) {
              allSignals = [...allSignals, ...channelSignals];
              console.log(`✅ [ADMIN] ${channelSignals.length} signaux chargés pour ${channelId}`);
            }
          } catch (error) {
            console.error(`❌ [ADMIN] Erreur chargement signaux pour ${channelId}:`, error);
          }
        }
        
        if (allSignals.length > 0) {
          // Formater les signaux pour correspondre au type attendu
          const formattedSignals = allSignals.map(signal => {
            // Pour les signaux fermés, garder la vraie date
            // Pour les signaux actifs, utiliser HH:MM
            const isClosed = signal.status && signal.status !== 'ACTIVE';
            const timestamp = isClosed 
              ? new Date(signal.timestamp || Date.now()).toISOString() // Vraie date pour signaux fermés
              : new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // HH:MM pour signaux actifs
            
            return {
              id: signal.id || '',
              type: signal.type,
              symbol: signal.symbol,
              timeframe: signal.timeframe,
              entry: signal.entry?.toString() || 'N/A',
              takeProfit: signal.takeProfit?.toString() || 'N/A',
              stopLoss: signal.stopLoss?.toString() || 'N/A',
              description: signal.description || '',
              image: signal.image || signal.attachment_data,
              attachment_data: signal.attachment_data || signal.image,
              attachment_type: signal.attachment_type,
              attachment_name: signal.attachment_name,
              closure_image: signal.closure_image,
              closure_image_type: signal.closure_image_type,
              closure_image_name: signal.closure_image_name,
              timestamp: timestamp,
              originalTimestamp: signal.timestamp || Date.now(),
              status: signal.status || 'ACTIVE' as const,
              channel_id: signal.channel_id,
              reactions: signal.reactions || [],
              pnl: signal.pnl,
              closeMessage: signal.closeMessage,
              loss_reason: signal.loss_reason
            };
          });
          
          setAllSignalsForStats(formattedSignals);
          console.log(`✅ [ADMIN] ${formattedSignals.length} signaux formatés chargés pour statistiques au total`);
          console.log('📊 [ADMIN] Signaux par canal:', channels.map(ch => ({
            channel: ch,
            count: formattedSignals.filter(s => s.channel_id === ch).length
          })));
        } else {
          console.log('⚠️ [ADMIN] Aucun signal trouvé pour les statistiques');
        }
      } catch (error) {
        console.error('❌ [ADMIN] Erreur chargement signaux pour statistiques:', error);
      }
    };

    loadAllSignalsForStats();
  }, [selectedChannel.id]); // Recharger quand le canal change

  // Mettre à jour allSignalsForStats en temps réel quand de nouveaux signaux arrivent
  useEffect(() => {
    if (signals.length > 0) {
      console.log('🔄 [ADMIN] Mise à jour temps réel des statistiques...');
      console.log('📊 [ADMIN] Signaux actuels dans le fil:', signals.length);
      
      // Mettre à jour allSignalsForStats avec les nouveaux signaux ET les mises à jour
      setAllSignalsForStats(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newSignals = signals.filter(s => !existingIds.has(s.id));
        
        // Mettre à jour les signaux existants qui ont changé
        const updatedSignals = prev.map(existingSignal => {
          const updatedSignal = signals.find(s => s.id === existingSignal.id);
          if (updatedSignal) {
            console.log('🔄 [ADMIN] Signal mis à jour:', { id: updatedSignal.id, loss_reason: (updatedSignal as any).loss_reason });
            return {
              ...existingSignal,
              ...updatedSignal,
              originalTimestamp: existingSignal.originalTimestamp || updatedSignal.timestamp || Date.now(),
              attachment_data: updatedSignal.attachment_data || existingSignal.attachment_data,
              attachment_type: updatedSignal.attachment_type || existingSignal.attachment_type,
              attachment_name: updatedSignal.attachment_name || existingSignal.attachment_name,
              loss_reason: (updatedSignal as any).loss_reason || existingSignal.loss_reason
            };
          }
          return existingSignal;
        });
        
        if (newSignals.length > 0) {
          console.log(`✅ [ADMIN] ${newSignals.length} nouveaux signaux ajoutés aux stats`);
          
          // Formater les nouveaux signaux avec originalTimestamp et données d'attachement
          const formattedNewSignals = newSignals.map(signal => ({
            ...signal,
            originalTimestamp: signal.timestamp || Date.now(),
            attachment_data: signal.attachment_data,
            attachment_type: signal.attachment_type,
            attachment_name: signal.attachment_name,
            loss_reason: (signal as any).loss_reason
          }));
          
          return [...updatedSignals, ...formattedNewSignals];
        }
        
        return updatedSignals;
      });
    }
  }, [signals]);

  // Fonctions pour les statistiques des signaux (utilisent TOUS les signaux du mois sélectionné)
  const calculateTotalPnL = (): number => {
    console.log('🔍 [ADMIN] calculateTotalPnL - allSignalsForStats:', allSignalsForStats.length);
    const monthSignals = getThisMonthSignals();
    const filteredSignals = monthSignals.filter(s => s.pnl && s.status !== 'ACTIVE');
    console.log('🔍 [ADMIN] Signaux avec PnL et fermés:', filteredSignals.length);
    const total = filteredSignals.reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    console.log('💰 [ADMIN] Total PnL calculé:', total);
    return total;
  };

  const calculateWinRate = (): number => {
    console.log('🔍 [ADMIN] calculateWinRate - allSignalsForStats:', allSignalsForStats.length);
    const monthSignals = getThisMonthSignals();
    const closedSignals = monthSignals.filter(s => s.status !== 'ACTIVE');
    console.log('🔍 [ADMIN] Signaux fermés:', closedSignals.length);
    if (closedSignals.length === 0) return 0;
    const wins = closedSignals.filter(s => s.status === 'WIN').length;
    const winRate = Math.round((wins / closedSignals.length) * 100);
    console.log('🏆 [ADMIN] Win Rate calculé:', winRate + '%');
    return winRate;
  };

  const calculateAvgWin = (): number => {
    console.log('🔍 [ADMIN] calculateAvgWin - allSignalsForStats:', allSignalsForStats.length);
    const monthSignals = getThisMonthSignals();
    const winSignals = monthSignals.filter(s => s.status === 'WIN' && s.pnl);
    console.log('🔍 [ADMIN] Signaux gagnants avec PnL:', winSignals.length);
    if (winSignals.length === 0) return 0;
    const totalWinPnL = winSignals.reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    const avgWin = Math.round(totalWinPnL / winSignals.length);
    console.log('💚 [ADMIN] Moyenne gains calculée:', avgWin);
    return avgWin;
  };

  const calculateAvgLoss = (): number => {
    console.log('🔍 [ADMIN] calculateAvgLoss - allSignalsForStats:', allSignalsForStats.length);
    const monthSignals = getThisMonthSignals();
    const lossSignals = monthSignals.filter(s => s.status === 'LOSS' && s.pnl);
    console.log('🔍 [ADMIN] Signaux perdants avec PnL:', lossSignals.length);
    if (lossSignals.length === 0) return 0;
    const totalLossPnL = lossSignals.reduce((total, signal) => total + Math.abs(parsePnL(signal.pnl)), 0);
    const avgLoss = Math.round(totalLossPnL / lossSignals.length);
    console.log('💔 [ADMIN] Moyenne pertes calculée:', avgLoss);
    return avgLoss;
  };

  const getTodaySignals = () => {
    // Stat "Aujourd'hui" = toujours la vraie date du jour (après 00h = nouveau jour)
    const today = new Date();
    const todaySignals = allSignalsForStats.filter(s => {
      const signalDate = new Date(s.originalTimestamp || s.timestamp);
      if (isNaN(signalDate.getTime())) return false;
      return signalDate.getDate() === today.getDate() &&
             signalDate.getMonth() === today.getMonth() &&
             signalDate.getFullYear() === today.getFullYear();
    });
    return todaySignals;
  };

  const getThisMonthSignals = () => {
    console.log('🔍 [ADMIN] getThisMonthSignals - allSignalsForStats:', allSignalsForStats.length);
    console.log('📅 [ADMIN] Mois sélectionné:', currentDate.getMonth() + 1, currentDate.getFullYear());
    
    // Utiliser currentDate au lieu de today
    const monthSignals = allSignalsForStats.filter(s => {
      // Utiliser le timestamp original pour déterminer la vraie date
      const signalDate = new Date(s.originalTimestamp || s.timestamp);
      
      // Si la date est invalide, ignorer ce signal
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      const isThisMonth = signalDate.getMonth() === currentDate.getMonth() &&
             signalDate.getFullYear() === currentDate.getFullYear();
      
      return isThisMonth;
    });
    
    console.log('📅 [ADMIN] Signaux pour le mois sélectionné:', monthSignals.length);
    return monthSignals;
  };

  // Fonctions pour les statistiques des trades personnels - DYNAMIQUES selon mois sélectionné
  const calculateTotalPnLTrades = (): number => {
    const monthTrades = getTradesForSelectedAccount.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    return monthTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
  };

  const calculateWinRateTrades = (): number => {
    const monthTrades = getTradesForSelectedAccount.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    if (monthTrades.length === 0) return 0;
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / monthTrades.length) * 100);
  };


  const calculateAvgWinTrades = (): number => {
    const monthTrades = getTradesForSelectedAccount.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    const winTrades = monthTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const totalWinPnL = winTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    return Math.round(totalWinPnL / winTrades.length);
  };

  const calculateAvgLossTrades = (): number => {
    const monthTrades = getTradesForSelectedAccount.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    const lossTrades = monthTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const totalLossPnL = lossTrades.reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(totalLossPnL / lossTrades.length);
  };

  // Fonctions pour analyser les pertes par raison
  const getLossAnalysis = () => {
    const accountTrades = getTradesForSelectedAccount;
    
    // Filtrer par mois sélectionné (utiliser currentDate du calendrier)
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    
    const monthlyTrades = accountTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      // Vérifier que la date est valide
      if (isNaN(tradeDate.getTime())) {
        return false;
      }
      return tradeDate.getMonth() === selectedMonth && 
             tradeDate.getFullYear() === selectedYear;
    });
    
    const lossTrades = monthlyTrades.filter(t => t.status === 'LOSS');
    
    const lossByReason: { [key: string]: { count: number, totalPnl: number, trades: any[] } } = {};
    
    lossTrades.forEach(trade => {
      const reason = trade.lossReason || 'non_specifiee';
      if (!lossByReason[reason]) {
        lossByReason[reason] = { count: 0, totalPnl: 0, trades: [] };
      }
      lossByReason[reason].count++;
      lossByReason[reason].totalPnl += parsePnL(trade.pnl);
      lossByReason[reason].trades.push(trade);
    });
    
    const sortedReasons = Object.entries(lossByReason)
      .filter(([reason]) => reason !== 'non_specifiee')
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        totalPnl: data.totalPnl,
        avgPnl: Math.round(data.totalPnl / data.count),
        percentage: Math.round((data.count / lossTrades.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalLosses: lossTrades.length,
      totalLossPnl: lossTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0),
      reasons: sortedReasons
    };
  };

  // Fonction pour obtenir le label d'une raison (utilise les raisons personnalisées)
  const getCustomLossReasonLabel = (reasonValue: string): string => {
    const reason = customLossReasons.find(r => r.value === reasonValue);
    if (reason) {
      return `${reason.emoji} ${reason.label}`;
    }
    return getLossReasonLabel(reasonValue);
  };

  const getTodayTrades = () => {
    // Stat "Aujourd'hui" = vraie date du jour en local (après 00h = nouveau jour)
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return getTradesForSelectedAccount.filter(trade => trade.date === todayStr);
  };

  const getThisMonthTrades = () => {
    return getTradesForSelectedAccount.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
  };

  // Fonctions pour Win Rate Gauge
  const getWinsAndLosses = () => {
    const monthSignals = getThisMonthSignals();
    const wins = monthSignals.filter(s => s.status === 'WIN').length;
    const losses = monthSignals.filter(s => s.status === 'LOSS').length;
    return { wins, losses };
  };

  const getWinsAndLossesTrades = () => {
    const monthTrades = getThisMonthTrades();
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    const losses = monthTrades.filter(t => t.status === 'LOSS').length;
    return { wins, losses };
  };

  // Fonctions pour Profit Factor
  const getProfitFactorData = () => {
    const monthSignals = getThisMonthSignals();
    
    const totalWins = monthSignals
      .filter(s => s.status === 'WIN' && s.pnl)
      .reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    
    const totalLosses = monthSignals
      .filter(s => s.status === 'LOSS' && s.pnl)
      .reduce((total, signal) => total + Math.abs(parsePnL(signal.pnl)), 0);
    
    return { totalWins, totalLosses };
  };

  const getProfitFactorDataTrades = () => {
    const monthTrades = getThisMonthTrades();
    
    const totalWins = monthTrades
      .filter(t => t.status === 'WIN' && t.pnl)
      .reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    
    const totalLosses = monthTrades
      .filter(t => t.status === 'LOSS' && t.pnl)
      .reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    
    return { totalWins, totalLosses };
  };

  const getWinRateForSessionAdmin = (sessions: string[]): number | null => {
    const monthTrades = getThisMonthTrades().filter(t => t.session && sessions.includes(t.session));
    if (monthTrades.length === 0) return null;
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / monthTrades.length) * 100);
  };

  // Trades pour l’affichage des stats (mois ou jour selon statsPeriod) - Journal perso & TPLN
  const getTradesForStatsDisplay = () => statsPeriod === 'jour' ? getTodayTrades() : getThisMonthTrades();
  const calculateTotalPnLTradesForDisplay = (): number => getTradesForStatsDisplay().reduce((total, t) => total + parsePnL(t.pnl), 0);
  const calculateWinRateTradesForDisplay = (): number => {
    const trades = getTradesForStatsDisplay();
    if (trades.length === 0) return 0;
    return Math.round((trades.filter(t => t.status === 'WIN').length / trades.length) * 100);
  };
  const getWinsAndLossesTradesForDisplay = () => {
    const trades = getTradesForStatsDisplay();
    return { wins: trades.filter(t => t.status === 'WIN').length, losses: trades.filter(t => t.status === 'LOSS').length };
  };
  const getProfitFactorDataTradesForDisplay = () => {
    const trades = getTradesForStatsDisplay();
    const totalWins = trades.filter(t => t.status === 'WIN' && t.pnl).reduce((s, t) => s + parsePnL(t.pnl), 0);
    const totalLosses = trades.filter(t => t.status === 'LOSS' && t.pnl).reduce((s, t) => s + Math.abs(parsePnL(t.pnl)), 0);
    return { totalWins, totalLosses };
  };
  const calculateAvgWinTradesForDisplay = (): number => {
    const winTrades = getTradesForStatsDisplay().filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    return Math.round(winTrades.reduce((s, t) => s + parsePnL(t.pnl), 0) / winTrades.length);
  };
  const calculateAvgLossTradesForDisplay = (): number => {
    const lossTrades = getTradesForStatsDisplay().filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    return Math.round(lossTrades.reduce((s, t) => s + Math.abs(parsePnL(t.pnl)), 0) / lossTrades.length);
  };
  const getWinRateForSessionDisplay = (sessions: string[]): number | null => {
    const trades = getTradesForStatsDisplay().filter(t => t.session && sessions.includes(t.session));
    if (trades.length === 0) return null;
    return Math.round((trades.filter(t => t.status === 'WIN').length / trades.length) * 100);
  };

  const MONTH_LABELS_ADMIN = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  type MonthlyPerfRowAdmin = { monthKey: string; monthLabel: string; trades: number; pnl: number; wr: number; pf: number; maxDdPnl: number | null };
  const monthlyPerformanceDataAdmin = useMemo((): MonthlyPerfRowAdmin[] => {
    const isSignals = selectedChannel.id === 'calendrier';
    const items = isSignals
      ? signals.filter((s: { channel_id?: string; status?: string; pnl?: string }) => s.channel_id === 'calendrier' && s.status !== 'ACTIVE' && s.pnl != null)
      : getTradesForSelectedAccount;
    if (items.length === 0) return [];
    const byMonth = new Map<string, { pnl: number; wins: number; losses: number; totalWinPnL: number; totalLossPnL: number; entries: { date: string; pnl: number }[] }>();
    const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (isSignals) {
      (items as { timestamp: number | string; pnl?: string; status: string }[]).forEach((s) => {
        const d = new Date(s.timestamp);
        if (Number.isNaN(d.getTime())) return;
        const key = getMonthKey(d);
        const pnlVal = parsePnL(s.pnl || '0');
        if (!byMonth.has(key)) byMonth.set(key, { pnl: 0, wins: 0, losses: 0, totalWinPnL: 0, totalLossPnL: 0, entries: [] });
        const row = byMonth.get(key)!;
        row.pnl += pnlVal;
        row.entries.push({ date: d.toISOString().slice(0, 10), pnl: pnlVal });
        if (s.status === 'WIN') { row.wins++; row.totalWinPnL += pnlVal; } else if (s.status === 'LOSS') { row.losses++; row.totalLossPnL += Math.abs(pnlVal); }
      });
    } else {
      (items as { date: string; pnl?: string; status: string }[]).forEach((t) => {
        const key = t.date.slice(0, 7);
        const pnlVal = parsePnL(t.pnl || '0');
        if (!byMonth.has(key)) byMonth.set(key, { pnl: 0, wins: 0, losses: 0, totalWinPnL: 0, totalLossPnL: 0, entries: [] });
        const row = byMonth.get(key)!;
        row.pnl += pnlVal;
        row.entries.push({ date: t.date, pnl: pnlVal });
        if (t.status === 'WIN') { row.wins++; row.totalWinPnL += pnlVal; } else if (t.status === 'LOSS') { row.losses++; row.totalLossPnL += Math.abs(pnlVal); }
      });
    }
    const monthKeys = Array.from(byMonth.keys()).sort();
    let startBalance = 0;
    if (!isSignals && monthKeys.length > 0) {
      const acc = tradingAccounts.find((a: { account_name: string }) => a.account_name === selectedAccount);
      startBalance = (acc as { initial_balance?: number })?.initial_balance ?? 0;
      if (selectedAccount === 'Tous les comptes') {
        startBalance = tradingAccounts
          .filter((a: { account_name: string }) => a.account_name !== 'TPLN' && a.account_name !== 'TPLN model')
          .reduce((s: number, a: { initial_balance?: number }) => s + (a.initial_balance || 0), 0);
      }
    }
    const rows: MonthlyPerfRowAdmin[] = monthKeys.map((key) => {
      const r = byMonth.get(key)!;
      const total = r.wins + r.losses;
      const wr = total > 0 ? Math.round((r.wins / total) * 100) : 0;
      const pf = r.totalLossPnL > 0 ? r.totalWinPnL / r.totalLossPnL : (r.totalWinPnL > 0 ? Infinity : 0);
      const [y, m] = key.split('-').map(Number);
      const monthLabel = `${MONTH_LABELS_ADMIN[m - 1]} ${y}`;
      let maxDdPnl: number | null = null;
      if (!isSignals && startBalance !== undefined && r.entries.length > 0) {
        r.entries.sort((a, b) => a.date.localeCompare(b.date));
        let peak = startBalance;
        let running = startBalance;
        let maxDd = 0;
        r.entries.forEach((e) => {
          running += e.pnl;
          peak = Math.max(peak, running);
          if (peak > running) maxDd = Math.max(maxDd, peak - running);
        });
        if (maxDd > 0) maxDdPnl = -maxDd;
      }
      if (!isSignals) {
        const monthPrefix = key + '-';
        const sessionDds = Object.keys(finSessionCache)
          .filter((k) => k.startsWith(monthPrefix))
          .map((k) => (finSessionCache[k] as FinSessionData)?.maxDrawdown)
          .filter((v): v is number => v != null && !Number.isNaN(v) && v < 0);
        if (sessionDds.length > 0) {
          const worstSessionDd = Math.min(...sessionDds);
          maxDdPnl = maxDdPnl != null ? Math.min(maxDdPnl, worstSessionDd) : worstSessionDd;
        }
      }
      startBalance += r.pnl;
      return { monthKey: key, monthLabel, trades: total, pnl: r.pnl, wr, pf, maxDdPnl };
    });
    return rows.reverse();
  }, [selectedChannel.id, selectedAccount, personalTrades, signals, tradingAccounts, finSessionCache]);

  const calculateRiskReward = (entry: string, takeProfit: string, stopLoss: string): string => {
    const entryNum = parseFloat(entry);
    const tpNum = parseFloat(takeProfit);
    const slNum = parseFloat(stopLoss);
    
    if (isNaN(entryNum) || isNaN(tpNum) || isNaN(slNum)) return 'N/A';
    
    const risk = Math.abs(entryNum - slNum);
    const reward = Math.abs(tpNum - entryNum);
    
    if (risk === 0) return 'N/A';
    
    return (reward / risk).toFixed(2);
  };

  // Fonction pour formater les signaux dans les messages
  const formatSignalMessage = (text: string) => {
    // Détecter si c'est un signal (contient SIGNAL_ID ou format de signal)
    const signalIdMatch = text.match(/\[SIGNAL_ID[:\s]+([^\]]+)\]/);
    if (!signalIdMatch) return null;

    // Parser les informations du signal
    const lines = text.split('\n');
    let signalType = '';
    let symbol = '';
    let entry = '';
    let tp = '';
    let sl = '';
    let timeframe = '';
    let rr = '';
    let status = '';
    let pnl = '';
    let closeMessage = '';

    lines.forEach(line => {
      if (line.includes('🚀') || line.includes('**')) {
        const match = line.match(/\*\*([A-Z]+)\s+([A-Z0-9]+)\**/);
        if (match) {
          signalType = match[1];
          symbol = match[2];
        }
      }
      if (line.includes('Entry:')) {
        entry = line.split('Entry:')[1]?.trim() || '';
      }
      if (line.includes('TP:')) {
        tp = line.split('TP:')[1]?.split('SL:')[0]?.trim() || '';
        sl = line.split('SL:')[1]?.trim() || '';
      }
      if (line.includes('⏰')) {
        timeframe = line.split('⏰')[1]?.trim() || '';
      }
      if (line.includes('R:R')) {
        rr = line.split('R:R')[1]?.trim() || '';
      }
      if (line.includes('SIGNAL FERMÉ') || line.includes('fermé Résultat:')) {
        status = 'CLOSED';
      }
      if (line.includes('GAGNANT')) {
        status = 'WIN';
      }
      if (line.includes('PERDANT')) {
        status = 'LOSS';
      }
      if (line.includes('P&L:')) {
        pnl = line.split('P&L:')[1]?.trim() || '';
      }
      if (line.includes('fermé Résultat:') && !closeMessage) {
        closeMessage = line;
      }
    });

    return {
      signalId: signalIdMatch[1],
      type: signalType,
      symbol,
      entry,
      tp,
      sl,
      timeframe,
      rr,
      status,
      pnl,
      closeMessage
    };
  };


  const getWeeklyBreakdown = () => {
    // Utiliser currentDate au lieu de today
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Ajuster pour que lundi soit 0 (même logique que le calendrier)
    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    
    // Calculer le nombre de lignes/semaines nécessaires (même logique que le calendrier)
    const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7);
    
    console.log(`🔍 [ADMIN] Mois ${currentMonth + 1}/${currentYear} - ${daysInMonth} jours - ${totalCells} semaines`);
    
    // Créer les semaines en fonction des lignes du calendrier
    const weeks = [];
    for (let weekNum = 1; weekNum <= totalCells; weekNum++) {
      // Calculer les jours de la semaine en fonction de la ligne du calendrier
      // Chaque ligne commence à l'index (weekNum - 1) * 7 dans le tableau totalCells
      const weekStartIndex = (weekNum - 1) * 7;
      const weekEndIndex = weekNum * 7 - 1;
      
      // Les jours de cette semaine dans le calendrier
      const weekDays: number[] = [];
      for (let i = weekStartIndex; i <= weekEndIndex; i++) {
        const dayNumber = i - adjustedFirstDay + 1;
        // Inclure seulement les jours valides du mois (entre 1 et daysInMonth)
        if (dayNumber >= 1 && dayNumber <= daysInMonth) {
          weekDays.push(dayNumber);
        }
      }
      
      if (weekDays.length === 0) {
        // Semaine vide (ne devrait pas arriver, mais au cas où)
        weeks.push({
          week: `Week ${weekNum}`,
          weekNum: weekNum,
          trades: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
          isCurrentWeek: false
        });
        continue;
      }
      
      const weekStartDay = Math.min(...weekDays);
      const weekEndDay = Math.max(...weekDays);
      
      const weekStart = new Date(currentYear, currentMonth, weekStartDay);
      const weekEnd = new Date(currentYear, currentMonth, weekEndDay);
      // Ajouter 23h59 pour inclure toute la journée
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log(`🔍 [ADMIN] Week ${weekNum} (ligne ${weekNum}) - Jours: ${weekDays.join(', ')} - Début:`, weekStart.toDateString(), 'Fin:', weekEnd.toDateString());
      
      const weekSignals = allSignalsForStats.filter(s => {
        // Utiliser le timestamp original pour déterminer la vraie date
        const signalDate = new Date(s.originalTimestamp || s.timestamp);
        
        // Si la date est invalide, ignorer ce signal
        if (isNaN(signalDate.getTime())) {
          return false;
        }
        
        // Vérifier si le signal est dans cette semaine (même mois et année)
        const signalDay = signalDate.getDate();
        const isInWeek = signalDate.getMonth() === currentMonth &&
               signalDate.getFullYear() === currentYear &&
               weekDays.includes(signalDay);
        
        if (isInWeek) {
          console.log(`🔍 [ADMIN] Week ${weekNum} - Signal:`, s.symbol, 'Date:', signalDate.toDateString(), 'Jour:', signalDay);
        }
        
        return isInWeek;
      });
      
      const closedSignals = weekSignals.filter(s => s.status !== 'ACTIVE');
      const weekPnL = closedSignals.reduce((total, signal) => total + parsePnL(signal.pnl || '0'), 0);
      const wins = closedSignals.filter(s => s.status === 'WIN').length;
      const losses = closedSignals.filter(s => s.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle
      const today = new Date();
      const todayDay = today.getDate();
      const isCurrentWeek = today.getMonth() === currentMonth &&
                           today.getFullYear() === currentYear &&
                           weekDays.includes(todayDay);
      
      weeks.push({
        week: `Week ${weekNum}`,
        weekNum: weekNum,
        trades: weekSignals.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  const getWeeklyBreakdownTrades = () => {
    // Utiliser EXACTEMENT la même logique que getWeeklyBreakdown pour être cohérent avec le calendrier
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Ajuster pour que lundi soit 0 (même logique que le calendrier)
    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    
    // Calculer le nombre de lignes/semaines nécessaires (même logique que le calendrier)
    const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7);
    
    // Créer les semaines en fonction des lignes du calendrier (MÊME LOGIQUE que getWeeklyBreakdown)
    const weeks = [];
    for (let weekNum = 1; weekNum <= totalCells; weekNum++) {
      // Calculer les jours de la semaine en fonction de la ligne du calendrier
      // Chaque ligne commence à l'index (weekNum - 1) * 7 dans le tableau totalCells
      const weekStartIndex = (weekNum - 1) * 7;
      const weekEndIndex = weekNum * 7 - 1;
      
      // Les jours de cette semaine dans le calendrier
      const weekDays: number[] = [];
      for (let i = weekStartIndex; i <= weekEndIndex; i++) {
        const dayNumber = i - adjustedFirstDay + 1;
        // Inclure seulement les jours valides du mois (entre 1 et daysInMonth)
        if (dayNumber >= 1 && dayNumber <= daysInMonth) {
          weekDays.push(dayNumber);
        }
      }
      
      if (weekDays.length === 0) {
        weeks.push({
          week: `Week ${weekNum}`,
          weekNum: weekNum,
          trades: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
          isCurrentWeek: false
        });
        continue;
      }
      
      // Construire les dates YYYY-MM-DD de la semaine (comme le calendrier)
      const weekDateStrs = new Set<string>();
      weekDays.forEach(dayNum => {
        weekDateStrs.add(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`);
      });
      
      // Utiliser getTradesForSelectedAccount comme le calendrier
      const effectiveAccountForWeek = selectedChannel.id === 'tpln-model' ? 'TPLN model' : selectedAccount;
      const accountTrades = getTradesForSelectedAccount;
      
      const weekTrades = accountTrades.filter(t => {
        if (!t || !t.date) return false;
        return weekDateStrs.has(t.date);
      });
      
      const weekPnL = weekTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
      const wins = weekTrades.filter(t => t.status === 'WIN').length;
      const losses = weekTrades.filter(t => t.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle (même logique que getWeeklyBreakdown)
      const today = new Date();
      const todayDay = today.getDate();
      const isCurrentWeek = today.getMonth() === currentMonth &&
                           today.getFullYear() === currentYear &&
                           weekDays.includes(todayDay);
      
      weeks.push({
        week: `Week ${weekNum}`,
        weekNum: weekNum,
        trades: weekTrades.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  const getTradesForWeek = (weekNum: number) => {
    try {
      // Utiliser getTradesForSelectedAccount comme le calendrier pour être cohérent
      const accountTrades = getTradesForSelectedAccount;
      if (!Array.isArray(accountTrades)) {
        return [];
      }

      // Utiliser EXACTEMENT la même logique que getWeeklyBreakdownTrades (lignes du calendrier)
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const firstDayWeekday = firstDayOfMonth.getDay();
      const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

      // Calculer les jours de la semaine en fonction de la ligne du calendrier
      const weekStartIndex = (weekNum - 1) * 7;
      const weekEndIndex = weekNum * 7 - 1;
      
      const weekDays: number[] = [];
      for (let i = weekStartIndex; i <= weekEndIndex; i++) {
        const dayNumber = i - adjustedFirstDay + 1;
        if (dayNumber >= 1 && dayNumber <= daysInMonth) {
          weekDays.push(dayNumber);
        }
      }

      // Construire les dates YYYY-MM-DD de la semaine (comme le calendrier)
      const weekDateStrs = new Set<string>();
      weekDays.forEach(dayNum => {
        weekDateStrs.add(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`);
      });

      // Filtrer uniquement par date (le compte est déjà filtré dans getTradesForSelectedAccount)
      const filteredTrades = accountTrades.filter(trade => {
        if (!trade || !trade.date) return false;
        return weekDateStrs.has(trade.date);
      });

      return filteredTrades;
    } catch (error) {
      console.error('❌ Erreur dans getTradesForWeek [ADMIN]:', error);
      return [];
    }
  };

  // Fonctions pour gérer les statuts des signaux
  const handleReaction = async (signalId: string, emoji: string) => {
    // Mettre à jour localement d'abord
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        const currentReactions = signal.reactions || [];
        const hasReaction = currentReactions.includes(emoji);
        
        if (hasReaction) {
          // Retirer la réaction
          const newReactions = currentReactions.filter(r => r !== emoji);
          // Sauvegarder dans Firebase
          updateSignalReactions(signalId, newReactions);
          return {
            ...signal,
            reactions: newReactions
          };
        } else {
          // Ajouter la réaction
          const newReactions = [...currentReactions, emoji];
          // Sauvegarder dans Firebase
          updateSignalReactions(signalId, newReactions);
          return {
            ...signal,
            reactions: newReactions
          };
        }
      }
      return signal;
    }));
  };

  const handleDeleteMessage = async (messageId: string, channelId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }
    
    try {
      console.log('🗑️ [DEBUG] Début suppression message:', { messageId, channelId });
      console.log('🗑️ [DEBUG] Chemin Firebase correct:', `messages/${messageId}`);
      
      // Suppression avec la fonction firebase-setup qui utilise le bon chemin
      const success = await deleteMessage(messageId);
      
      if (success) {
        console.log('✅ [DEBUG] Message supprimé de Firebase avec succès');
        
        // Attendre un peu pour que Firebase propage la suppression
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recharger les messages depuis Firebase (forcer le refresh)
        console.log('🔄 [DEBUG] Rechargement des messages depuis Firebase...');
        await loadMessages(channelId);
        
        console.log('✅ [DEBUG] Messages rechargés depuis Firebase');
      } else {
        alert('Erreur lors de la suppression du message');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur suppression message:', error);
      alert('Erreur lors de la suppression du message: ' + error);
    }
  };

  const scrollToTop = () => {
    // Pour les salons de chat, scroller dans le conteneur de messages
    if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id)) {
      messagesContainerRef.current.scrollTop = 0;
    } else {
      // Pour les autres vues, scroller la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    // Ne pas scroller automatiquement pour journal perso, journal signaux et vue calendar
    if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'user-management' || selectedChannel.id === 'tpln-model' || view === 'calendar') {
      return;
    }
    
    // Scroller vers le bas pour voir les messages les plus récents
    console.log('🔄 Scrolling to bottom admin...', {
      hasRef: !!messagesContainerRef.current,
      channelId: selectedChannel.id
    });
    
    // Méthode 1: Avec la référence
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    
    // Méthode 2: Avec sélecteur CSS comme backup
    const scrollContainer = document.querySelector('.overflow-y-auto.overflow-x-hidden.p-4.space-y-4.pb-32');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      console.log('✅ Scroll with CSS selector worked');
    }
    
    // Méthode 3: Forcer avec tous les conteneurs possibles (seulement pour chat, pas calendrier)
    const allContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    allContainers.forEach((container, index) => {
      // Exclure les conteneurs du calendrier/journal
      const isCalendarContainer = container.closest('[class*="calendar"]') || 
                                   container.querySelector('.grid-cols-7') || 
                                   container.querySelector('[class*="grid grid-cols-7"]');
      if (!isCalendarContainer) {
        container.scrollTop = container.scrollHeight;
        console.log(`📜 Scrolled container ${index}`);
      }
    });
    
    // Méthode 4: Multiple tentatives avec délais
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);
    
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 200);
    
    console.log('✅ Scroll to bottom admin completed');
  };

  const handleLogout = async () => {
    console.log('🚪 Déconnexion admin en cours...');

    try {
      // Supprimer le token FCM de Firebase Database avant déconnexion
      try {
        console.log('🔔 Suppression du token FCM admin...');
        const { getMessaging, deleteToken } = await import('firebase/messaging');
        const { ref, remove } = await import('firebase/database');
        const { database } = await import('../utils/firebase-setup');
        
        // Récupérer le token FCM actuel
        const messaging = getMessaging();
        const currentToken = await messaging.getToken();
        
        if (currentToken) {
          console.log('🔔 Token FCM admin trouvé, suppression...');
          
          // Supprimer le token de Firebase Database
          const tokenKey = currentToken.replace(/[.#$[\]]/g, '_');
          const tokenRef = ref(database, `fcm_tokens/${tokenKey}`);
          await remove(tokenRef);
          console.log('✅ Token FCM admin supprimé de Firebase Database');
          
          // Supprimer le token du navigateur
          await deleteToken(messaging);
          console.log('✅ Token FCM admin supprimé du navigateur');
        } else {
          console.log('⚠️ Aucun token FCM admin trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur suppression token FCM admin:', error);
      }

      // PRÉSERVER la photo de profil admin avant déconnexion
      const adminProfileImageBackup = localStorage.getItem('adminProfileImage');
      console.log('💾 ADMIN Sauvegarde photo avant déconnexion:', adminProfileImageBackup ? 'TROUVÉE' : 'PAS TROUVÉE');

      // Déconnexion Supabase et nettoyage
      const { error } = await signOutAdmin();

      if (error) {
        console.error('❌ Erreur déconnexion admin:', error.message);
        // Continuer quand même le nettoyage local
      } else {
        console.log('✅ Déconnexion Supabase admin réussie');
      }

      // Nettoyage sélectif du localStorage (préserver la photo)
      const keysToRemove = ['signals', 'chat_messages', 'trading_stats', 'user_session'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🧹 Nettoyage sélectif du localStorage (avatar préservé)');

      // GARDER la photo de profil admin - pas besoin de restaurer car elle n'a jamais été supprimée
      if (adminProfileImageBackup) {
        console.log('✅ ADMIN Photo de profil préservée pendant la déconnexion');
      }

      console.log('🏠 Redirection vers la page de connexion admin...');
      // Rediriger vers la page de connexion admin
      window.location.href = '/admin';
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer quand même la redirection vers la page admin
      window.location.href = '/admin';
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 ADMIN File selected:', file ? file.name : 'NO FILE');
    if (file && file.type.startsWith('image/')) {
      console.log('🖼️ ADMIN Processing image...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        console.log('💾 ADMIN Syncing to localStorage AND Supabase...');
        
        // Mettre à jour l'état immédiatement
        setProfileImage(base64Image);
        
        // Synchroniser avec localStorage et Supabase
        const result = await syncProfileImage('admin', base64Image);
        if (result.success) {
          console.log('✅ ADMIN Profile image synchronized across all devices!');
        } else {
          console.error('❌ ADMIN Sync failed:', result.error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUsernameEdit = async () => {
    if (usernameInput.trim()) {
      try {
        const { data, error } = await updateUserProfile(usernameInput.trim(), undefined, 'admin');
        if (!error && data) {
          setCurrentUsername(usernameInput.trim());
          console.log('✅ Username updated successfully in Supabase:', usernameInput.trim());
        } else {
          console.error('❌ Error updating username in Supabase:', error);
          // Mode dégradé : sauvegarder en localStorage
          localStorage.setItem('adminUsername', usernameInput.trim());
          setCurrentUsername(usernameInput.trim());
          console.log('✅ Username sauvegardé en localStorage (fallback):', usernameInput.trim());
        }
      } catch (error) {
        console.error('❌ Error updating username:', error);
        // Mode dégradé : sauvegarder en localStorage
        localStorage.setItem('adminUsername', usernameInput.trim());
        setCurrentUsername(usernameInput.trim());
        console.log('✅ Username sauvegardé en localStorage (fallback):', usernameInput.trim());
      }
      setIsEditingUsername(false);
      setUsernameInput('');
    }
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setUsernameInput('');
  };

  const handleStartStream = () => {
    if (!streamTitle.trim()) {
      console.warn('Veuillez entrer un titre pour votre stream');
      return;
    }
    setIsLiveStreaming(true);
    setViewerCount(Math.floor(Math.random() * 50) + 10); // Simuler des viewers
  };

  const handleStopStream = () => {
    setIsLiveStreaming(false);
    setViewerCount(0);
  };


  const handleShareScreen = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      // Configuration haute qualité pour le partage d'écran
      navigator.mediaDevices.getDisplayMedia({ 
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      })
        .then(stream => {
          console.log('Stream obtenu:', stream);
          
          // Créer un élément vidéo haute qualité
          const video = document.createElement('video');
          video.className = 'w-full h-full object-contain';
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.srcObject = stream;
          
          // Configuration haute qualité pour la vidéo
          video.style.imageRendering = 'crisp-edges';
          video.style.imageRendering = '-webkit-optimize-contrast';
          
          // Optimiser les paramètres de qualité
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            console.log('📊 Paramètres vidéo:', settings);
            
            // Appliquer les contraintes de qualité
            videoTrack.applyConstraints({
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            }).then(() => {
              console.log('✅ Qualité vidéo optimisée:', {
                width: videoTrack.getSettings().width,
                height: videoTrack.getSettings().height,
                frameRate: videoTrack.getSettings().frameRate
              });
            }).catch(err => console.log('❌ Contraintes non appliquées:', err));
          }
          
          // Trouver spécifiquement les conteneurs de 
          const Containers = document.querySelectorAll('.bg-gray-900 .bg-black.flex.items-center.justify-center');
          console.log('Conteneurs  trouvés:', Containers.length);
          
          if (Containers.length === 0) {
            // Fallback: chercher tous les conteneurs noirs
            const allContainers = document.querySelectorAll('.bg-black.flex.items-center.justify-center');
            console.log('Tous les conteneurs trouvés:', allContainers.length);
            
            allContainers.forEach((container, index) => {
              console.log(`Remplacer conteneur ${index}`);
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
                console.log(`Vidéo ${index} en cours de lecture`);
              }).catch(err => {
                console.error(`Erreur lecture vidéo ${index}:`, err);
              });
            });
          } else {
            // Utiliser les conteneurs specifiques
            Containers.forEach((container, index) => {
              console.log(`Remplacer conteneur ${index}`);
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
                console.log(`Video ${index} en cours de lecture`);
              }).catch(err => {
                console.error(`Erreur lecture video ${index}:`, err);
              });
            });
          }
          
          // Mettre à jour l'état
          setIsLiveStreaming(true);
          setViewerCount(15);
        })
        .catch(err => {
          console.error('Erreur partage d\'écran:', err);
          console.error('Erreur lors du partage d\'écran:', err.message);
        });
    } else {
      console.error('Partage d\'écran non supporté sur ce navigateur');
    }
  };

  const handleSignalStatus = async (signalId: string, newStatus: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE') => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    console.log('🔄 [ADMIN] === CHANGEMENT STATUT SIGNAL ===');
    console.log('🔄 [ADMIN] Signal ID:', signalId, 'Ancien statut:', signal.status, 'Nouveau statut:', newStatus);

    if (signal.status === newStatus) {
      // Si on clique sur le même statut, on remet en ACTIVE
      const updatedSignal = { ...signal, status: 'ACTIVE', pnl: undefined, closeMessage: undefined };
      
      // Mettre à jour l'état local
      setSignals(prev => prev.map(s => 
        s.id === signalId ? updatedSignal : s
      ));
      
      // Sauvegarder dans Firebase
      const firebaseSuccess = await updateSignalStatus(signalId, 'ACTIVE');
      console.log('🔄 [ADMIN] Firebase mise à jour:', firebaseSuccess ? 'SUCCÈS' : 'ÉCHEC');
      
      // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined, closeMessage: undefined } : s
      ));
      
      console.log('🔄 [ADMIN] Signal remis en ACTIVE - allSignalsForStats mis à jour pour les stats');
      
      // Les stats seront mises à jour automatiquement via allSignalsForStats
      
    } else if (newStatus === 'ACTIVE') {
      // Si on veut remettre en ACTIVE directement
      const updatedSignal = { ...signal, status: 'ACTIVE', pnl: undefined, closeMessage: undefined };
      
      // Mettre à jour l'état local
      setSignals(prev => prev.map(s => 
        s.id === signalId ? updatedSignal : s
      ));
      
      // Sauvegarder dans Firebase
      const firebaseSuccess = await updateSignalStatus(signalId, 'ACTIVE');
      console.log('🔄 [ADMIN] Firebase mise à jour:', firebaseSuccess ? 'SUCCÈS' : 'ÉCHEC');
      
      // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined, closeMessage: undefined } : s
      ));
      
      console.log('🔄 [ADMIN] Signal remis en ACTIVE - allSignalsForStats mis à jour pour les stats');
      
      // Les stats seront mises à jour automatiquement via allSignalsForStats
      
    } else {
      // Sinon on demande le P&L
      const pnl = prompt(`Entrez le P&L final pour ce signal (ex: +$150 ou -$50):`);
      if (pnl !== null) {
        // Générer la phrase de fermeture
        const statusText = newStatus === 'WIN' ? 'gagnante' : newStatus === 'LOSS' ? 'perdante' : 'break-even';
        const closeMessage = `Position ${statusText} fermée - P&L: ${pnl}`;
        
        console.log('🔍 Debug signal dans handleSignalStatus:', signal);
        console.log('🔍 Debug referenceNumber dans handleSignalStatus:', (signal as any).referenceNumber);
        
        const updatedSignal = { ...signal, status: newStatus, pnl, closeMessage };
        
        // Mettre à jour l'état local
        setSignals(prev => prev.map(s => 
          s.id === signalId ? updatedSignal : s
        ));
        
        // Sauvegarder dans Firebase
        const firebaseSuccess = await updateSignalStatus(signalId, newStatus, pnl);
        console.log('🔄 [ADMIN] Firebase mise à jour:', firebaseSuccess ? 'SUCCÈS' : 'ÉCHEC');
        
        // Sauvegarder le message de fermeture dans Firebase
        const signalRef = ref(database, `signals/${signalId}`);
        await update(signalRef, { closeMessage });
        
        // Envoyer une notification pour le signal fermé
        notifySignalClosed({ ...signal, status: newStatus, pnl, closeMessage });
        
        // Créer un message de fermeture dans le chat
        const conclusionMessage = `📊 SIGNAL FERMÉ 📊\n\n` +
          `Signal ${(signal as any).referenceNumber || ''} fermé\n` +
          `Résultat: ${newStatus === 'WIN' ? '🟢 GAGNANT' : newStatus === 'LOSS' ? '🔴 PERDANT' : '🔵 BREAK-EVEN'}\n` +
          `${newStatus !== 'BE' ? `P&L: ${pnl}` : ''}\n` +
          `[SIGNAL_ID:${signalId}]`;
        
        const messageData = {
          channel_id: 'general-chat-2',
          content: conclusionMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined,
          timestamp: new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        
        const messageRef = push(ref(database, `messages/general-chat-2`));
        await set(messageRef, messageData);
        
        // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
        setAllSignalsForStats(prev => prev.map(s => 
          s.id === signalId ? { ...s, status: newStatus, pnl, closeMessage } : s
        ));
        
        console.log('🔄 [ADMIN] Signal fermé - allSignalsForStats mis à jour pour les stats');
        
        // Les stats seront mises à jour automatiquement via allSignalsForStats
      }
    }
    
    console.log('🔄 [ADMIN] === FIN CHANGEMENT STATUT ===');
  };

  // Scroll automatique vers le bas quand de nouveaux messages arrivent ou quand on change de canal
  useEffect(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [chatMessages, selectedChannel.id]);

  const channels = [
    { id: 'general-chat-2', name: 'general-chat-2', emoji: '📊', fullName: 'Indices' },
    { id: 'general-chat-3', name: 'general-chat-3', emoji: '₿', fullName: 'Crypto' },
    { id: 'general-chat-4', name: 'general-chat-4', emoji: '💵', fullName: 'Forex' },
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },
    { id: 'livestream', name: 'livestream', emoji: '📺', fullName: 'Livestream' },

    { id: 'tpln-model', name: 'tpln-model', emoji: '📋', fullName: 'TPLN model' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Journal Signaux' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📊', fullName: 'Journal Perso' },
    { id: 'check-trade', name: 'check-trade', emoji: '✅', fullName: 'Check Trade' }
  ];

  const handleCreateSignal = () => {
    setShowSignalModal(true);
  };

  // Helpers stats fin de session (Supabase + cache, par compte)
  const getDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const getEffectiveAccountForFinSession = () => (selectedChannel.id === 'tpln-model' ? 'TPLN model' : (selectedAccount || 'Compte Principal'));
  const getFinSessionForDate = (d: Date, account?: string): FinSessionData | null => {
    const acc = account ?? getEffectiveAccountForFinSession();
    const key = getFinSessionCacheKey(getDateKey(d), acc);
    return finSessionCache[key] ?? null;
  };
  const saveFinSessionForDate = async (d: Date, data: FinSessionData) => {
    const dateStr = getDateKey(d);
    const acc = data.account || 'Compte Principal';
    const result = await upsertFinSessionStatToSupabase(dateStr, { ...data, account: acc });
    if (result.ok) setFinSessionCache(prev => ({ ...prev, [getFinSessionCacheKey(dateStr, acc)]: { ...data, account: acc } }));
    return result;
  };
  /** Note moyenne 1-5 à partir des 4 stats psy (pour affichage calendrier). */
  const getNoteMoyenneForDate = (d: Date): number | null => {
    const fs = getFinSessionForDate(d);
    if (!fs || !fs.respectPlan || !fs.qualiteDecisions || !fs.gestionErreur || fs.pression == null) return null;
    const r = fs.respectPlan === 'Oui' ? 5 : fs.respectPlan === 'Partiel' ? 3 : 1;
    const q = fs.qualiteDecisions === 'Lecture' ? 5 : fs.qualiteDecisions === 'Mixte' ? 3 : 1;
    const g = fs.gestionErreur === 'Oui' ? 5 : 1;
    const p = 6 - fs.pression; // 1 calme -> 5, 5 tendu -> 1
    return Math.round(((r + q + g + p) / 4) * 10) / 10;
  };
  /** Code couleur étoile discipline (score /5) : 4-5 PRO (vert), 2.5-4 OK/fragile (jaune), <2.5 rouge. */
  const getDisciplineColorForScore = (score: number): 'green' | 'yellow' | 'red' => {
    if (score >= 4) return 'green';
    if (score >= 2.5) return 'yellow';
    return 'red';
  };
  const getDisciplineLabelForScore = (score: number): string => {
    if (score >= 4) return 'Journée PRO';
    if (score >= 2.5) return 'Journée OK / fragile';
    return 'À améliorer';
  };
  // Charger le cache des stats fin de session depuis Supabase (journal/tpln)
  useEffect(() => {
    if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
      getFinSessionStatsFromSupabase().then(setFinSessionCache);
    }
  }, [selectedChannel.id]);

  useEffect(() => {
    if (showFinSessionModal) {
      const defaultAcc = selectedChannel.id === 'tpln-model' ? 'TPLN model' : (selectedAccount && selectedAccount !== 'Tous les comptes' ? selectedAccount : 'Compte Principal');
      setFinSessionSelectedAccounts([defaultAcc]);
      const today = getFinSessionForDate(new Date());
      if (today) {
        setFinSessionRespectPlan(today.respectPlan as 'Oui' | 'Non' | 'Partiel');
        setFinSessionQualiteDecisions(today.qualiteDecisions as 'Lecture' | 'Mixte' | 'Émotion');
        setFinSessionGestionErreur(today.gestionErreur as 'Oui' | 'Non');
        setFinSessionPression(today.pression);
        setFinSessionMaxDrawdown(today.maxDrawdown != null ? String(today.maxDrawdown) : '');
      } else {
        setFinSessionRespectPlan('');
        setFinSessionQualiteDecisions('');
        setFinSessionGestionErreur('');
        setFinSessionPression('');
        setFinSessionMaxDrawdown('');
      }
    }
  }, [showFinSessionModal, finSessionCache, selectedChannel.id, selectedAccount]);

  // Fonctions pour le journal de trading personnalisé
  const handleAddTrade = () => {
    const defaultAccount = selectedChannel.id === 'tpln-model' 
      ? 'TPLN model' 
      : (selectedAccount === 'Tous les comptes' ? (tradingAccounts[0]?.account_name || 'Compte Principal') : selectedAccount);
    setTradeAddAccount(defaultAccount);
    setSelectedAccounts([defaultAccount]);
    setEditingTrade(null);
    setShowTradeModal(true);
  };

  const handleEditTrade = async (trade: PersonalTrade) => {
    const full = await getPersonalTradeById(trade.id);
    if (!full) return;
    const [y, m, d] = (full.date || '').split('-').map(Number);
    if (y && m) setSelectedDate(new Date(y, m - 1, d || 1));
    setTradeData({
      symbol: full.symbol || '',
      type: full.type || 'BUY',
      entry: full.entry || '',
      exit: full.exit || '',
      stopLoss: full.stopLoss || '',
      pnl: full.pnl || '',
      status: full.status || 'WIN',
      lossReason: Array.isArray(full.lossReasons) && full.lossReasons.length > 0 ? full.lossReasons[0] : (full.lossReason || ''),
      lossReasons: Array.isArray(full.lossReasons) ? full.lossReasons : (full.lossReason ? [full.lossReason] : []),
      notes: full.notes || '',
      image1: full.image1 ?? null,
      image2: full.image2 ?? null,
      session: full.session || ''
    });
    setSelectedAccounts([full.account || 'Compte Principal']);
    setEditingTrade(full);
    setShowTradeModal(true);
  };

  const handleTradeSubmit = async () => {
    try {
      if (!tradeData.symbol || !tradeData.entry || !tradeData.exit || !tradeData.pnl) {
        console.warn('Veuillez remplir les champs obligatoires (Symbol, Entry, Exit, PnL)');
        return;
      }

      const getDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (editingTrade) {
      const updated = await updatePersonalTrade(editingTrade.id, {
        symbol: tradeData.symbol,
        type: tradeData.type,
        entry: tradeData.entry,
        exit: tradeData.exit,
        stopLoss: tradeData.stopLoss,
        pnl: tradeData.pnl,
        status: tradeData.status,
        lossReason: tradeData.lossReasons?.[0] ?? tradeData.lossReason,
        lossReasons: tradeData.lossReasons?.length ? tradeData.lossReasons : undefined,
        notes: tradeData.notes,
        image1: tradeData.image1,
        image2: tradeData.image2,
        session: tradeData.session || undefined
      });
      if (updated) {
        const reloadedTrades = await getPersonalTradesFromSupabase(200);
        setPersonalTrades(prev => (reloadedTrades.length > 0 ? reloadedTrades : prev));
        setEditingTrade(null);
        setTradeData({ symbol: '', type: 'BUY', entry: '', exit: '', stopLoss: '', pnl: '', status: 'WIN', lossReason: '', lossReasons: [], notes: '', image1: null, image2: null, session: '' });
        setSelectedAccounts([]);
        setShowTradeModal(false);
      } else {
        alert('Erreur lors de la mise à jour du trade');
      }
      return;
    }

    const accountsToAdd = selectedAccounts.length > 0 ? selectedAccounts : [tradeAddAccount];
    console.log('🔍 [ADMIN] Ajout trade - comptes:', accountsToAdd);

    let successCount = 0;
    const savedTrades: PersonalTrade[] = [];
    for (const accountName of accountsToAdd) {
      const newTrade = {
        date: selectedDate ? getDateString(selectedDate) : getDateString(new Date()),
        symbol: tradeData.symbol,
        type: tradeData.type,
        entry: tradeData.entry,
        exit: tradeData.exit,
        stopLoss: tradeData.stopLoss,
        pnl: tradeData.pnl,
        status: tradeData.status,
        lossReason: tradeData.lossReasons?.[0] ?? tradeData.lossReason,
        lossReasons: tradeData.lossReasons?.length ? tradeData.lossReasons : undefined,
        notes: tradeData.notes,
        image1: tradeData.image1,
        image2: tradeData.image2,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        account: accountName,
        session: tradeData.session || undefined
      };
      const savedTrade = await addPersonalTradeToSupabase(newTrade as any);
      if (savedTrade) {
        successCount++;
        savedTrades.push(savedTrade);
      }
    }

    if (successCount > 0) {
      console.log('✅ [ADMIN] Trades sauvegardés:', successCount, '/', accountsToAdd.length);
      const newIds = savedTrades.map(t => t.id).filter((id): id is string => !!id);
      if (newIds.length) justAddedTradeIdsRef.current = newIds;
      setTimeout(() => { justAddedTradeIdsRef.current = []; }, 3000);
      setPersonalTrades(prev => [...savedTrades, ...prev]);

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const reloadedTrades = await getPersonalTradesFromSupabase(200);
        setPersonalTrades(prev => (reloadedTrades.length > 0 ? reloadedTrades : prev));
      } catch (error) {
        console.error('❌ [ADMIN] Erreur lors du rechargement des trades:', error);
      }
      
      // Reset form et fermer le modal - TOUJOURS faire ça même en cas d'erreur
      setTradeData({
        symbol: '',
        type: 'BUY',
        entry: '',
        exit: '',
        stopLoss: '',
        pnl: '',
        status: 'WIN',
        lossReason: '',
        lossReasons: [],
        notes: '',
        image1: null,
        image2: null,
        session: ''
      });
      setSelectedAccounts([]);
      setShowTradeModal(false);
      console.log('✅ Trade ajouté avec succès dans Supabase !');
      
      if (successCount < accountsToAdd.length) {
        alert(`Trade ajouté à ${successCount}/${accountsToAdd.length} comptes. Vérifiez les erreurs en console.`);
      }
    } else {
      console.error('❌ [ADMIN] Erreur lors de la sauvegarde du trade');
      alert('❌ Erreur lors de la sauvegarde du trade. Vérifiez la console pour plus de détails.');
    }
    } catch (error) {
      console.error('❌ [ADMIN] Erreur inattendue lors de l\'ajout du trade:', error);
      alert('❌ Erreur lors de l\'ajout du trade. Vérifiez la console pour plus de détails.');
      // Fermer le modal même en cas d'erreur
      setShowTradeModal(false);
      setSelectedAccounts([]);
      setEditingTrade(null);
    }
  };

  // Fonctions pour la gestion des utilisateurs
  
  // Fonction pour filtrer et trier les utilisateurs
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }
    
    // Trier
    filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0);
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filteredUsers;
  };
  
  // Fonction pour calculer les statistiques
  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(user => user.status === 'active').length;
    const inactive = users.filter(user => user.status === 'inactive').length;
    
    // Nouveaux utilisateurs cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = users.filter(user => 
      new Date(user.created_at) > oneWeekAgo
    ).length;
    
    return { total, active, inactive, newThisWeek };
  };

  const loadUsers = async () => {
    // TODO: Implement Firebase user management
    console.log('⚠️ User management not implemented with Firebase yet');
    setUsers([]);
  };

  const createUser = async () => {
    // TODO: Implement Firebase user creation
    console.warn('⚠️ User creation not implemented with Firebase yet');
    console.log('⚠️ User creation not implemented with Firebase yet');
  };

  const deleteUser = async (userId: string) => {
    // TODO: Implement Firebase user deletion
    console.warn('⚠️ User deletion not implemented with Firebase yet');
    console.log('⚠️ User deletion not implemented with Firebase yet');
  };

  const handleTradingViewPasteTrade = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    console.log('Pasted HTML:', pastedHtml);
    console.log('Pasted Text:', pastedText);
    
    // Store extracted data
    const extracted: Record<string, any> = {};
    let found = false;
    
    // Check if we have TradingView data
    if (pastedHtml.includes('data-tradingview-clip')) {
      try {
        // Extract the TradingView JSON data
        const regex = /data-tradingview-clip="([^"]+)"/;
        const match = pastedHtml.match(regex);
        
        if (match && match[1]) {
          // Replace HTML entities in the JSON string
          const jsonString = match[1].replace(/&(?:quot|#34);/g, '"');
          const data = JSON.parse(jsonString);
          
          console.log('TradingView data:', data);
          
          // Extract source and points - similar to Google Apps Script
          const source = data.sources?.[0]?.source;
          const points = source?.points;
          const state = source?.state;
          const stopLevel = state?.stopLevel;
          const profitLevel = state?.profitLevel;
          
          if (points && points.length >= 2) {
            found = true;
            
            // Get ticker symbol and clean it
            let symbolFull = state?.symbol || "";
            let ticker = symbolFull.split(":")[1] || symbolFull;
            // Clean common futures symbols
            if (ticker.startsWith("NQ1")) ticker = "NQ";
            else if (ticker.startsWith("ES1")) ticker = "ES";
            else if (ticker.startsWith("MNQ")) ticker = "MNQ";
            
            extracted.symbol = ticker;
            
            // Determine trade type from the tool
            const type = source?.type;
            if (type === "LineToolRiskRewardLong" || /long/i.test(type)) {
              extracted.tradeType = 'buy';
            } else if (type === "LineToolRiskRewardShort" || /short/i.test(type)) {
              extracted.tradeType = 'sell';
            }
            
            // Extract price information
            const entryPrice = points[0]?.price;
            if (entryPrice !== undefined) {
              extracted.entryPrice = entryPrice.toString();
            }
            
            // For exit price, use the last point
            if (points.length > 1) {
              const exitPrice = points[points.length - 1]?.price;
              if (exitPrice !== undefined) {
                extracted.exitPrice = exitPrice.toString();
              }
            }
            
            // Calculate Risk:Reward ratio if available
            if (stopLevel !== undefined && profitLevel !== undefined) {
              const rrRatio = Math.round((profitLevel / stopLevel) * 100) / 100;
              extracted.rr = rrRatio.toString();
              
              // Calculate Stop Loss based on entry price and stopLevel
              if (entryPrice !== undefined) {
                let slPrice;
                if (extracted.tradeType === 'buy') {
                  // For Long trades
                  const stopDistance = stopLevel / 4;
                  slPrice = entryPrice - stopDistance;
                } else {
                  // For Short trades
                  const stopDistance = stopLevel / 4;
                  slPrice = entryPrice + stopDistance;
                }
                extracted.stopLoss = slPrice.toString();
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing TradingView data:', error);
      }
    }
    
    // Fallback to text parsing if no TradingView data found
    if (!found) {
      const symbolMatch = pastedText.match(/([A-Z]{3,6})/);
      const typeMatch = pastedText.match(/(BUY|SELL|LONG|SHORT)/i);
      const numbers = pastedText.match(/\d+(?:\.\d+)?/g);
      
      if (symbolMatch) extracted.symbol = symbolMatch[1];
      if (typeMatch) extracted.tradeType = typeMatch[1].toLowerCase();
      if (numbers && numbers.length >= 1) extracted.entryPrice = numbers[0];
      if (numbers && numbers.length >= 2) extracted.exitPrice = numbers[1];
      if (numbers && numbers.length >= 3) extracted.stopLoss = numbers[2];
    }
    
    // Mise à jour du formulaire
    if (extracted.symbol) setTradeData(prev => ({ ...prev, symbol: extracted.symbol }));
    if (extracted.tradeType) setTradeData(prev => ({ ...prev, type: extracted.tradeType === 'buy' || extracted.tradeType === 'long' ? 'BUY' : 'SELL' }));
    if (extracted.entryPrice) setTradeData(prev => ({ ...prev, entry: extracted.entryPrice }));
    if (extracted.exitPrice) setTradeData(prev => ({ ...prev, exit: extracted.exitPrice }));
    if (extracted.stopLoss) setTradeData(prev => ({ ...prev, stopLoss: extracted.stopLoss }));
    
    // Show success message
    if (found || Object.keys(extracted).length > 0) {
      console.log(`✅ Données importées - Symbole: ${extracted.symbol}, Entrée: ${extracted.entryPrice}, Sortie: ${extracted.exitPrice}, Stop Loss: ${extracted.stopLoss}`);
    } else {
      console.warn('❌ Aucune donnée détectée. Essayez de coller depuis TradingView (Risk/Reward tool)');
    }
  };

  const getTradesForDate = (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const accountTrades = getTradesForSelectedAccount;
      if (!Array.isArray(accountTrades)) return [];
      
      const filteredTrades = accountTrades.filter(trade => trade && trade.date && trade.date === dateStr);
      
      // Debug pour TPLN model
      if (selectedChannel.id === 'tpln-model') {
        console.log('🔍 [getTradesForDate] Date:', dateStr, 'Channel: TPLN model');
        console.log('🔍 [getTradesForDate] Trades trouvés:', filteredTrades.length);
        filteredTrades.forEach(t => {
          console.log('🔍 [getTradesForDate] Trade:', t.symbol, 'PnL:', t.pnl, 'Account:', t.account);
        });
      }
      
      return filteredTrades;
    } catch (error) {
      console.error('Erreur dans getTradesForDate:', error);
      return [];
    }
  };

  const getSignalsForDate = (date: Date) => {
    // Utiliser allSignalsForStats avec originalTimestamp pour filtrer par date
    return allSignalsForStats.filter(signal => {
      // Utiliser le timestamp original pour déterminer la vraie date
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      
      // Si la date est invalide, ignorer ce signal
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      // Vérifier si le signal correspond à la date demandée
      return signalDate.getDate() === date.getDate() && 
             signalDate.getMonth() === date.getMonth() && 
             signalDate.getFullYear() === date.getFullYear();
    });
  };

  const handleSignalSubmit = async () => {
    // Validation minimale - juste besoin d'au moins un champ rempli
    if (!signalData.symbol && !signalData.entry && !signalData.takeProfit && !signalData.stopLoss && !signalData.description) {
      console.warn('Veuillez remplir au moins un champ pour créer le signal');
      return;
    }

    // Upload image vers Firebase Storage si présente
    let attachmentData = null;
    let attachmentType = null;
    let attachmentName = null;
    console.log('📸 ADMIN signalData.image existe?', !!signalData.image);
    if (signalData.image) {
      console.log('📸 ADMIN Upload image vers Firebase Storage...');
      attachmentData = await uploadImage(signalData.image);
      attachmentType = signalData.image.type;
      attachmentName = signalData.image.name;
      console.log('✅ ADMIN Image uploadée, URL:', attachmentData);
    }

    // Préparer les données pour Firebase
    const signalForFirebase = {
      channel_id: selectedChannel.id,
      type: signalData.type as 'BUY' | 'SELL',
      symbol: signalData.symbol || 'N/A',
      timeframe: signalData.timeframe || '1 min',
      entry: signalData.entry || '0',
      takeProfit: signalData.takeProfit || '0',
      stopLoss: signalData.stopLoss || '0',
      description: signalData.description || '',
      author: 'Admin',
      attachment_data: attachmentData,
      attachment_type: attachmentType,
      attachment_name: attachmentName,
      status: 'ACTIVE' as const
    };
    
    console.log('📤 ADMIN Envoi à Firebase avec attachment:', !!signalForFirebase.attachment_data);

    // Sauvegarder en Firebase
    const savedSignal = await addSignal(signalForFirebase);
    console.log('💾 ADMIN Signal sauvegardé:', savedSignal);
    
    if (savedSignal) {
      console.log('✅ Signal sauvé en Firebase:', savedSignal);
      
      // Envoyer une notification push via Firebase Function
      try {
        const sendNotification = httpsCallable(functions, 'sendNotification');
        
        // Récupérer tous les tokens FCM depuis Firebase Database
        const tokens = [];
        try {
          const fcmTokensRef = ref(database, 'fcm_tokens');
          const snapshot = await get(fcmTokensRef);
          if (snapshot.exists()) {
            const tokensData = snapshot.val();
            Object.values(tokensData).forEach((tokenData: any) => {
              if (tokenData && tokenData.token) {
                tokens.push(tokenData.token);
              }
            });
          }
        } catch (error) {
          console.error('❌ Erreur récupération tokens FCM:', error);
        }
        
        if (tokens.length > 0) {
          try {
          const result = await sendNotification({
            signal: savedSignal,
            tokens: tokens
          });
            console.log('✅ Notification push envoyée:', result.data?.successCount || 0, 'succès');
          } catch (notifError: any) {
            console.error('❌ Erreur envoi notification push:', notifError.message);
          }
        }
      } catch (error) {
        console.error('❌ Erreur envoi notification push:', error);
        
        // Afficher tous les détails de l'erreur
        let errorMessage = '❌ ERREUR NOTIFICATION SIGNAL:\n\n';
        errorMessage += 'Message: ' + error.message + '\n';
        errorMessage += 'Code: ' + (error.code || 'N/A') + '\n';
        errorMessage += 'Name: ' + (error.name || 'N/A') + '\n';
        
        if (error.details) {
          errorMessage += '\nDetails: ' + JSON.stringify(error.details, null, 2);
        }
        
        console.error(errorMessage);
        
        // Fallback vers notification locale
        notifyNewSignal(savedSignal);
      }
      
              // Si c'est un salon general-chat, envoyer aussi un message dans le chat
        if (['general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id)) {
        // Calculer le ratio R:R
        const entry = parseFloat(signalData.entry) || 0;
        const tp = parseFloat(signalData.takeProfit) || 0;
        const sl = parseFloat(signalData.stopLoss) || 0;
        
        let rr = 'N/A';
        if (entry > 0 && tp > 0 && sl > 0) {
          if (signalData.type === 'BUY') {
            const reward = Math.abs(tp - entry);
            const risk = Math.abs(entry - sl);
            rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(2) : 'N/A';
          } else { // SELL
            const reward = Math.abs(entry - tp);
            const risk = Math.abs(sl - entry);
            rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(2) : 'N/A';
          }
        }
        
        console.log('🔍 Debug savedSignal:', savedSignal);
        console.log('🔍 Debug referenceNumber:', savedSignal.referenceNumber);
        
        const signalMessage = `🚀 **${signalData.type} ${signalData.symbol || 'N/A'}** ${savedSignal.referenceNumber || ''}\n` +
          `📊 Entry: ${signalData.entry || 'N/A'} TP: ${signalData.takeProfit || 'N/A'} SL: ${signalData.stopLoss || 'N/A'}\n` +
          `🎯 R:R ≈ ${rr}\n` +
          `⏰ ${signalData.timeframe || '1 min'}\n` +
          `[SIGNAL_ID:${savedSignal.id}]`;
        
        try {
          // Convertir l'image en base64 pour la persistance
          let imageBase64: string | undefined;
          if (signalData.image) {
            const reader = new FileReader();
            imageBase64 = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(signalData.image!);
            });
          }
          
          const messageData = {
            channel_id: selectedChannel.id,
            content: signalMessage,
            author: currentUsername,
            author_type: 'admin' as const,
            author_avatar: profileImage || undefined,
            attachment_data: imageBase64,
            attachment_type: signalData.image ? signalData.image.type : undefined,
            attachment_name: signalData.image ? signalData.image.name : undefined
          };
          
          await addMessage(messageData);
          console.log('✅ Message signal avec image envoyé dans general-chat-2');
        } catch (error) {
          console.error('❌ Erreur envoi message signal:', error);
        }
      }
      
      // Pas d'alerte pour general-chat-2, le message apparaît directement dans le chat
      if (selectedChannel.id !== 'general-chat-2') {
        console.log('Signal créé et sauvé en base ! ✅');
      }
    } else {
      console.error('❌ Erreur sauvegarde signal');
      console.error('Erreur lors de la sauvegarde du signal');
      return;
    }
    
    // Reset form et fermer modal
    setSignalData({
      type: 'BUY',
      symbol: '',
      timeframe: '',
      entry: '',
      takeProfit: '',
      stopLoss: '',
      description: '',
      image: null
    });
    setShowSignalModal(false);
  };

  // Fonction pour gérer le statut des signaux depuis les messages
  const handleSignalStatusFromMessage = async (messageText: string, newStatus: 'WIN' | 'LOSS' | 'BE') => {
    try {
      // Extraire l'ID du signal du message
      const signalIdMatch = messageText.match(/\[SIGNAL_ID:([^\]]+)\]/);
      if (!signalIdMatch) {
        console.error('❌ ID du signal non trouvé dans le message');
        return;
      }
      
      const signalId = signalIdMatch[1];
      console.log(`🔄 [ADMIN] Changement statut signal ${signalId} vers ${newStatus}`);
      
      // Créer un popup personnalisé pour PnL et photo
      let pnl: string | undefined;
      let conclusionImage: File | null = null;
      let lossReason: string | undefined = undefined;
      
      if (newStatus !== 'BE') {
        // Générer les options de raisons de perte (utiliser customLossReasons)
        const lossReasonOptions = customLossReasons.map(reason => 
          `<option value="${reason.value}">${reason.emoji} ${reason.label}</option>`
        ).join('');
        
        // Créer le popup HTML
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `;
        
        popup.innerHTML = `
          <div style="
            background: #1f2937;
            padding: 24px;
            border-radius: 12px;
            min-width: 400px;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid #374151;
            color: white;
          ">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
              📊 Fermer le signal ${newStatus === 'WIN' ? '🟢 GAGNANT' : '🔴 PERDANT'}
            </h3>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #d1d5db;">
                P&L Final (ex: +$150 ou -$50):
              </label>
              <input 
                id="pnlInput"
                type="text" 
                placeholder="+$150"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #4b5563;
                  border-radius: 6px;
                  background: #374151;
                  color: white;
                  font-size: 14px;
                "
              />
            </div>
            
            ${newStatus === 'LOSS' ? `
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #d1d5db;">
                🎯 Raison du stop-loss (optionnel):
              </label>
              <select
                id="lossReasonSelect"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #4b5563;
                  border-radius: 6px;
                  background: #374151;
                  color: white;
                  font-size: 14px;
                "
              >
                <option value="">-- Sélectionner une raison --</option>
                ${lossReasonOptions}
              </select>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #d1d5db;">
                📸 Photo de conclusion (optionnel):
              </label>
              <input 
                id="photoInput"
                type="file" 
                accept="image/*"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #4b5563;
                  border-radius: 6px;
                  background: #374151;
                  color: white;
                  font-size: 14px;
                "
              />
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button 
                id="cancelBtn"
                style="
                  padding: 8px 16px;
                  border: 1px solid #6b7280;
                  border-radius: 6px;
                  background: #374151;
                  color: #d1d5db;
                  cursor: pointer;
                  font-size: 14px;
                "
              >
                Annuler
              </button>
              <button 
                id="confirmBtn"
                style="
                  padding: 8px 16px;
                  border: none;
                  border-radius: 6px;
                  background: #3b82f6;
                  color: white;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                "
              >
                Confirmer
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(popup);
        
        // Gérer les événements
        const pnlInput = popup.querySelector('#pnlInput') as HTMLInputElement;
        const photoInput = popup.querySelector('#photoInput') as HTMLInputElement;
        const lossReasonSelect = popup.querySelector('#lossReasonSelect') as HTMLSelectElement;
        const cancelBtn = popup.querySelector('#cancelBtn') as HTMLButtonElement;
        const confirmBtn = popup.querySelector('#confirmBtn') as HTMLButtonElement;
        
        // Attendre la réponse de l'utilisateur
        const result = await new Promise<{pnl: string, photo: File | null, lossReason?: string}>((resolve, reject) => {
          cancelBtn.onclick = () => {
            document.body.removeChild(popup);
            reject(new Error('Annulé par l\'utilisateur'));
          };
          
          confirmBtn.onclick = () => {
            const pnlValue = pnlInput.value.trim();
            if (!pnlValue) {
              console.warn('Veuillez entrer le P&L');
              return;
            }
            
            const photoValue = photoInput.files?.[0] || null;
            const lossReasonValue = lossReasonSelect?.value || undefined;
            document.body.removeChild(popup);
            resolve({pnl: pnlValue, photo: photoValue, lossReason: lossReasonValue});
          };
        });
        
        pnl = result.pnl;
        conclusionImage = result.photo;
        lossReason = result.lossReason;
      }
      
      // Générer la phrase de fermeture
      const statusText = newStatus === 'WIN' ? 'gagnante' : newStatus === 'LOSS' ? 'perdante' : 'break-even';
      const closeMessage = newStatus === 'BE' 
        ? `Position ${statusText} fermée - Break-even`
        : `Position ${statusText} fermée - P&L: ${pnl}`;
      
      // Convertir l'image de fermeture en base64 si elle existe
      let closureImageBase64: string | undefined;
      if (conclusionImage) {
        console.log('📸 [CLOSURE] Début conversion image de fermeture...', conclusionImage.name);
        closureImageBase64 = await uploadImage(conclusionImage);
        console.log('✅ [CLOSURE] Image de fermeture convertie:', closureImageBase64 ? `Taille: ${closureImageBase64.length} caractères` : 'ÉCHEC');
      } else {
        console.log('⚠️ [CLOSURE] Aucune image de fermeture fournie');
      }

      // Mettre à jour le signal local
      const updatedSignal = { 
        id: signalId,
        status: newStatus, 
        pnl, 
        closeMessage,
        closure_image: closureImageBase64,
        closure_image_type: conclusionImage ? conclusionImage.type : undefined,
        closure_image_name: conclusionImage ? conclusionImage.name : undefined,
        loss_reason: lossReason
      };
      
      // Mettre à jour les signaux locaux
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, ...updatedSignal } : s
      ));
      
      // Mettre à jour allSignalsForStats pour les statistiques
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, ...updatedSignal } : s
      ));
      
      // Sauvegarder tout dans Firebase en une seule fois
      const signalRef = ref(database, `signals/${signalId}`);
      const updateData = { 
        status: newStatus,
        pnl,
        closeMessage,
        closure_image: closureImageBase64 || null,
        closure_image_type: conclusionImage ? conclusionImage.type : null,
        closure_image_name: conclusionImage ? conclusionImage.name : null,
        loss_reason: lossReason || null
      };
      console.log('💾 [CLOSURE] Données à sauvegarder dans Firebase:', {
        hasClosureImage: !!closureImageBase64,
        closureImageSize: closureImageBase64 ? closureImageBase64.length : 0,
        closureImageType: updateData.closure_image_type,
        closureImageName: updateData.closure_image_name,
        loss_reason: updateData.loss_reason,
        ALL_DATA: updateData
      });
      await update(signalRef, updateData);
      console.log('✅ [CLOSURE] Firebase mise à jour complète avec loss_reason:', updateData.loss_reason);
      
      // Vérifier que loss_reason est bien sauvegardé dans Firebase
      try {
        const snapshot = await get(signalRef);
        if (snapshot.exists()) {
          const savedData = snapshot.val();
          console.log('🔍 [CLOSURE] Vérification Firebase après sauvegarde:', {
            loss_reason_saved: savedData.loss_reason,
            loss_reason_expected: updateData.loss_reason,
            match: savedData.loss_reason === updateData.loss_reason
          });
          
          if (savedData.loss_reason !== updateData.loss_reason) {
            console.error('❌ [CLOSURE] PROBLÈME: loss_reason non sauvegardé!', {
              expected: updateData.loss_reason,
              actual: savedData.loss_reason
            });
          }
        }
      } catch (verifyError) {
        console.error('❌ [CLOSURE] Erreur vérification Firebase:', verifyError);
      }
      
      // Envoyer une notification locale pour le signal fermé
      notifySignalClosed({ ...updatedSignal, channel_id: 'general-chat-2' });
      
      // Envoyer une notification push via Firebase Function
      try {
        const sendClosureNotification = httpsCallable(functions, 'sendClosureNotification');
        
        // Récupérer tous les tokens FCM depuis Firebase Database
        const tokens = [];
        try {
          const fcmTokensRef = ref(database, 'fcm_tokens');
          const snapshot = await get(fcmTokensRef);
          if (snapshot.exists()) {
            const tokensData = snapshot.val();
            Object.values(tokensData).forEach((tokenData: any) => {
              if (tokenData.token) {
                tokens.push(tokenData.token);
              }
            });
            console.log('📱 Tokens FCM récupérés pour notification clôture:', tokens.length);
          }
        } catch (error) {
          console.error('❌ Erreur récupération tokens FCM:', error);
        }
        
        if (tokens.length > 0) {
          console.log('📱 Envoi notification push clôture via Firebase Function...');
          const signalForNotification = signals.find(s => s.id === signalId);
          const result = await sendClosureNotification({
            signal: {
              ...signalForNotification,
              status: newStatus,
              pnl: pnl,
              channel_id: 'general-chat-2'
            },
            tokens: tokens
          });
          console.log('✅ Notification push clôture envoyée:', result.data);
        } else {
          console.log('⚠️ Aucun token FCM trouvé pour notification clôture');
        }
      } catch (error) {
        console.error('❌ Erreur envoi notification push clôture:', error);
      }
      
      // Envoyer un message de conclusion dans le chat
      console.log('🔍 Debug updatedSignal:', updatedSignal);
      console.log('🔍 Debug referenceNumber:', updatedSignal.referenceNumber);
      
      const conclusionMessage = `📊 SIGNAL FERMÉ 📊\n\n` +
        `Signal ${updatedSignal.referenceNumber || ''} fermé\n` +
        `Résultat: ${newStatus === 'WIN' ? '🟢 GAGNANT' : newStatus === 'LOSS' ? '🔴 PERDANT' : '🔵 BREAK-EVEN'}\n` +
        `${newStatus !== 'BE' ? `P&L: ${pnl}` : ''}\n` +
        `[SIGNAL_ID:${signalId}]`;
      
      try {
        // Convertir l'image de conclusion en base64 si elle existe
        let conclusionImageBase64: string | undefined;
        if (conclusionImage) {
          const reader = new FileReader();
          conclusionImageBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(conclusionImage!);
          });
        }
        
        const messageData = {
          channel_id: 'general-chat-2',
          content: conclusionMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined,
          attachment_data: conclusionImageBase64,
          attachment_type: conclusionImage ? conclusionImage.type : undefined,
          attachment_name: conclusionImage ? conclusionImage.name : undefined
        };
        
        await addMessage(messageData);
        console.log('✅ Message de conclusion avec image envoyé dans general-chat-2');
      } catch (error) {
        console.error('❌ Erreur envoi message conclusion:', error);
      }
      
      console.log(`✅ [ADMIN] Signal ${signalId} fermé avec succès - Statut: ${newStatus}, P&L: ${pnl}`);
      
    } catch (error) {
      console.error('❌ [ADMIN] Erreur handleSignalStatusFromMessage:', error);
              console.error('Erreur lors de la mise à jour du statut');
    }
  };


  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      try {
        console.log('🚀 Tentative envoi message PWA...', {
          channel: selectedChannel.id,
          content: chatMessage
        });
        
        
        // Pour les autres salons, utiliser Supabase avec avatar admin
        const messageData = {
          channel_id: selectedChannel.id,
          content: chatMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined // Photo de profil admin
        };
        
        const savedMessage = await addMessage(messageData);
        
        if (savedMessage) {
          console.log('✅ Message envoyé à Firebase:', savedMessage);
          // La subscription temps réel ajoutera le message automatiquement
        } else {
          console.error('❌ Erreur envoi message Firebase');
        }
        
      } catch (error) {
        console.error('💥 ERREUR PWA:', error);
        
        // Mode dégradé complet : fonctionnement local
        const fallbackMessage = {
          id: Date.now().toString(),
          text: chatMessage,
          timestamp: new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          author: `${currentUsername} (Offline)`
        };
        
        setChatMessages(prev => ({
          ...prev,
          [selectedChannel.id]: [...(prev[selectedChannel.id] || []), fallbackMessage]
        }));
        
        console.warn('⚠️ Mode offline activé - message local uniquement');
      }
      
      setChatMessage('');
      
      // Scroll automatique après envoi
      setTimeout(() => {
        scrollToBottom();
      }, 10);
    }
  };

                  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    try {
                      // Convertir le fichier en base64
                                              // Upload image vers Firebase Storage
                        const imageURL = await uploadImage(file);
                        
                        // Envoyer à Firebase avec l'URL de l'image
                        const messageData = {
                          channel_id: selectedChannel.id,
                          content: '',
                          author: currentUsername,
                          author_type: 'admin' as const,
                          author_avatar: profileImage || undefined,
                          attachment_data: imageURL,
                          attachment_type: file.type,
                          attachment_name: file.name
                        };
                        
                        console.log('📤 Message data envoyé:', messageData);
                        const savedMessage = await addMessage(messageData);
                        console.log('✅ Message sauvegardé:', savedMessage);
                        
                        if (savedMessage) {
                          console.log('✅ Image envoyée à Firebase:', savedMessage);
                          // La subscription temps réel ajoutera le message automatiquement
                        } else {
                          console.error('❌ Erreur envoi image Firebase');
                        }
                      
                      // Reset the input
                      event.target.value = '';
                      
                      // Scroll automatique après upload
                      setTimeout(() => {
                        scrollToBottom();
                      }, 10);
                    } catch (error) {
                      console.error('💥 ERREUR upload image:', error);
                    }
                  }
                };

  const parseSignalData = (text: string) => {
    // Chercher tous les nombres
    const numbers = text.match(/\d+(?:\.\d+)?/g);
    
    // Chercher le symbole - patterns plus spécifiques
    let symbol = '';
    
    // Pattern 1: Symboles avec ! (NQ1!, ES!, etc.)
    const futuresMatch = text.match(/([A-Z]{1,3}\d*!)/);
    if (futuresMatch) {
      symbol = futuresMatch[1];
    } else {
      // Pattern 2: Symboles crypto/forex (BTCUSD, EURUSD, etc.)
      const forexMatch = text.match(/([A-Z]{6,8})/);
      if (forexMatch) {
        symbol = forexMatch[1];
      } else {
        // Pattern 3: Symboles simples (BTC, ETH, etc.)
        const cryptoMatch = text.match(/\b([A-Z]{3,4})\b/);
        if (cryptoMatch && !['LONG', 'SHORT', 'BUY', 'SELL'].includes(cryptoMatch[1])) {
          symbol = cryptoMatch[1];
        }
      }
    }
    
    // Déterminer le type basé sur le texte
    let type = 'BUY';
    if (text.toUpperCase().includes('SELL') || text.toUpperCase().includes('SHORT')) {
      type = 'SELL';
    } else if (text.toUpperCase().includes('BUY') || text.toUpperCase().includes('LONG')) {
      type = 'BUY';
    }
    
    // Si on a au moins 1 nombre, on peut commencer à remplir
    if (numbers && numbers.length >= 1) {
      const newData = {
        symbol: symbol || 'UNKNOWN',
        entry: numbers[0] || '',
        takeProfit: numbers[1] || '', 
        stopLoss: numbers[2] || '',
        type: type
      };
      

      
      setSignalData(prev => ({
        ...prev,
        ...newData
      }));
      
      if (numbers.length >= 3) {
        console.log(`✅ Données importées - Symbole: ${newData.symbol}, Entrée: ${newData.entry}, TP: ${newData.takeProfit}, SL: ${newData.stopLoss}`);
      } else {
        console.warn(`⚠️ Données partielles importées - Symbole: ${newData.symbol}, Entrée: ${newData.entry}. Complétez les champs manquants`);
      }
      
      return true;
    }
    
    console.warn('❌ Aucun nombre détecté. Exemple : "NQ1! 22950 23004 22896"');
    return false;
  };

  const getTradingCalendar = () => {
    // Si c'est check-trade, afficher la checklist sans scroll automatique
    if (selectedChannel.id === 'check-trade') {
      return (
        <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto">
          <div style={{ paddingTop: '80px' }}>
            <CheckTradeChecklist />
          </div>
        </div>
      );
    }

    if (selectedChannel.id === 'user-management') {
      const stats = getUserStats();
      const filteredUsers = getFilteredUsers();
      
      return (
        <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
          <div className="space-y-6">
            {/* Header avec statistiques */}
            <div className="border-b border-gray-600 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-red-500">🔥 NOUVEAU CODE v3.0 CHARGÉ ! 🔥</h1>
                  <p className="text-sm text-yellow-400 mt-1">SI TU VOIS CE TEXTE ROUGE/JAUNE = ÇA MARCHE !</p>
                </div>
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Ajouter Utilisateur
                </button>
              </div>
              
              {/* Statistiques FORCÉES VISIBLES */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-600 rounded-lg p-4 border-4 border-blue-400">
                  <div className="text-2xl font-bold text-white">{stats.total || 99}</div>
                  <div className="text-sm text-white font-bold">✅ TOTAL USERS</div>
                </div>
                <div className="bg-green-600 rounded-lg p-4 border-4 border-green-200/50">
                  <div className="text-2xl font-bold text-white">{stats.active || 77}</div>
                  <div className="text-sm text-white font-bold">🟢 ACTIFS</div>
                </div>
                <div className="bg-red-600 rounded-lg p-4 border-4 border-red-400">
                  <div className="text-2xl font-bold text-white">{stats.inactive || 22}</div>
                  <div className="text-sm text-white font-bold">🔴 INACTIFS</div>
                </div>
                <div className="bg-purple-600 rounded-lg p-4 border-4 border-purple-400">
                  <div className="text-2xl font-bold text-white">{stats.newThisWeek || 5}</div>
                  <div className="text-sm text-white font-bold">🆕 NOUVEAUX</div>
                </div>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Barre de recherche */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Rechercher</label>
                  <input
                    type="text"
                    placeholder="Email utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                {/* Filtre statut */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                
                {/* Trier par */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'email' | 'created_at' | 'last_sign_in_at')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="created_at">Date création</option>
                    <option value="last_sign_in_at">Dernière connexion</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                {/* Ordre */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Ordre</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Créé le</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dernière connexion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          {searchTerm || statusFilter !== 'all' ? 'Aucun utilisateur trouvé avec ces critères' : 'Aucun utilisateur pour le moment'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.status === 'active' ? 'bg-green-200/60 text-white' : 'bg-red-300/50 text-white'
                            }`}>
                              {user.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  console.log('Fonctionnalité de réinitialisation du mot de passe à venir');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                                title="Réinitialiser mot de passe"
                              >
                                🔑
                              </button>
                              <button 
                                onClick={() => {
                                  console.log('Fonctionnalité de désactivation/réactivation à venir');
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs"
                                title={user.status === 'active' ? 'Désactiver' : 'Réactiver'}
                              >
                                {user.status === 'active' ? '🚫' : '✅'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteUserModal(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                                title="Supprimer utilisateur"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Sinon, afficher le calendrier normal
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isJournalSignaux = selectedChannel.id !== 'trading-journal';
    
    return (
            <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: (isMobile && isJournalSignaux) ? 'calc(20px - 0.5cm)' : '80px', touchAction: 'pan-y', maxWidth: '100%' }}>
      {/* Header */}
      <div className="mb-6 md:mb-8 border-b border-gray-600 pb-4">
        {/* Sélecteur de compte - MOBILE (pas sur TPLN model) */}
        {selectedChannel.id === 'trading-journal' && (
          <div className="flex md:hidden items-center gap-2 mb-4">
            {tradingAccounts.length > 0 ? (
              <select
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-gray-400 cursor-pointer h-9"
                style={{ height: '36px', background: 'rgb(75, 85, 99)' }}
              >
                <option value="Tous les comptes">📊 Tous les comptes</option>
                {tradingAccounts.map((account) => (
                  <option key={account.id} value={account.account_name}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-400 italic px-3 py-2">
                Aucun compte enregistré
              </div>
            )}
            
            <button
              onClick={() => handleAccountOptions(selectedAccount)}
              disabled={tradingAccounts.length === 0}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                tradingAccounts.length === 0
                  ? 'bg-gray-700 border border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white'
              }`}
              title="Options du compte"
            >
              ⚙️
            </button>
            
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              + Compte
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div className="hidden md:flex md:items-center md:gap-6">
            <div>
          <h1 className="text-2xl font-bold text-white">
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? (selectedChannel.id === 'tpln-model' ? 'TPLN model' : 'Mon Journal Perso') : 'Journal des Signaux'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? (selectedChannel.id === 'tpln-model' ? 'Calendrier et stats du model' : 'Journal tous tes trades') : 'Suivi des performances des signaux'}
          </p>
        </div>
        
            {/* Sélecteur de compte - DESKTOP (pas sur TPLN model) */}
        {selectedChannel.id === 'trading-journal' && (
              <div className="flex items-center gap-2">
            {tradingAccounts.length > 0 ? (
              <select
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                    className="bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-gray-400 cursor-pointer h-9"
                    style={{ height: '36px', background: 'rgb(75, 85, 99)' }}
              >
                    <option value="Tous les comptes">📊 Tous les comptes</option>
                {tradingAccounts.map((account) => (
                  <option key={account.id} value={account.account_name}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-400 italic px-3 py-2">
                    Aucun compte enregistré
              </div>
            )}
            
            <button
              onClick={() => handleAccountOptions(selectedAccount)}
              disabled={tradingAccounts.length === 0}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                tradingAccounts.length === 0
                  ? 'bg-gray-700 border border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white'
              }`}
                  title="Options du compte"
            >
                  ⚙️
            </button>
            
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="bg-gray-600 hover:bg-gray-500 border border-gray-500 text-gray-200 hover:text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
                  + Compte
            </button>
          </div>
        )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ‹
            </button>
            <span className="px-4 text-lg font-semibold min-w-[120px] text-center">
              {getMonthName(currentDate)} {currentDate.getFullYear()}
            </span>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ›
            </button>
          </div>
          {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
            <>
            <button 
              onClick={handleAddTrade}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? '+ trade' : '+ Ajouter Trade'}
            </button>
            <button 
              onClick={() => setShowFinSessionModal(true)}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
              title="Statistiques en fin de session"
            >
              Fin session
            </button>
            </>
          )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start" style={{ maxWidth: '100%', overflowX: 'hidden' }} key={(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? `perso-calendar-${calendarKey}` : `signaux-calendar-${calendarKey}`}>
        {/* Calendrier principal */}
        <div className="flex-1 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-4 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="text-center text-gray-400 font-semibold py-3 text-sm uppercase tracking-wide">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 w-full" style={{ maxWidth: '100%', overflowX: 'hidden', touchAction: 'pan-y' }} key={`calendar-${selectedChannel.id}-${calendarKey}-${selectedAccount}-${personalTrades.length}-${allSignalsForStats.length}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}>
            {(() => {
              console.log('🔍 [ADMIN] Rendering calendar for channel:', selectedChannel.id);
              console.log('🔍 [ADMIN] personalTrades count:', personalTrades.length);
              console.log('🔍 [ADMIN] allSignalsForStats count:', allSignalsForStats.length);
              const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const daysInMonth = lastDayOfMonth.getDate();
              const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
              
              // Ajuster pour que lundi soit 0
              const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
              
              const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
              
              return Array.from({ length: totalCells }, (_, i) => {
                const dayNumber = i - adjustedFirstDay + 1;
                const today = new Date();
                const isToday = dayNumber === today.getDate() && 
                               currentDate.getMonth() === today.getMonth() && 
                               currentDate.getFullYear() === today.getFullYear();
                
                // Celles vides au début
                if (dayNumber < 1) {
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700" style={{minHeight: '64px'}}></div>;
                }
                
                // Celles vides à la fin
                if (dayNumber > daysInMonth) {
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700" style={{minHeight: '64px'}}></div>;
                }
              
                              // Vérifier s'il y a des trades personnels ou des signaux pour ce jour
                if (selectedChannel.id === 'trading-journal' && dayNumber === 29) {
                  console.log('🔍 [ADMIN] === DEBUG JOUR 29 ===');
                  console.log('🔍 [ADMIN] Total personalTrades:', personalTrades.length);
                  console.log('🔍 [ADMIN] Toutes les dates des trades:', personalTrades.map(t => ({ date: t.date, status: t.status })));
                }
                
                // Debug pour le jour 30 (calendrier normal)
                if (selectedChannel.id !== 'trading-journal' && dayNumber === 30) {
                  console.log('🔍 [ADMIN] === DEBUG JOUR 30 ===');
                  console.log('🔍 [ADMIN] allSignalsForStats total:', allSignalsForStats.length);
                  console.log('🔍 [ADMIN] Signaux avec timestamp HH:MM:', allSignalsForStats.filter(s => typeof s.timestamp === 'string' && s.timestamp.includes(':')).length);
                  console.log('🔍 [ADMIN] Signaux avec vraie date:', allSignalsForStats.filter(s => !(typeof s.timestamp === 'string' && s.timestamp.includes(':'))).length);
                }
                
                const dateStrForDay = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const dayTrades = (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? 
                  getTradesForSelectedAccount.filter(trade => trade.date === dateStrForDay) : [];

                const daySignals = selectedChannel.id !== 'trading-journal' ? 
                  allSignalsForStats.filter(signal => {
                    // Utiliser le timestamp original pour déterminer la vraie date
                    const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                    
                    // Si la date est invalide, ignorer ce signal
                    if (isNaN(signalDate.getTime())) {
                      return false;
                    }
                    
                    const isMatch = signalDate.getDate() === dayNumber && 
                                  signalDate.getMonth() === currentDate.getMonth() && 
                                  signalDate.getFullYear() === currentDate.getFullYear();
                    
                    // Debug pour les jours 29 et 30
                    if (dayNumber === 29 || dayNumber === 30) {
                      console.log('🔍 [ADMIN] Jour', dayNumber, '- Signal:', signal.symbol, 'originalTimestamp:', signal.originalTimestamp, 'date parsée:', signalDate.toDateString(), 'match:', isMatch);
                    }
                    
                    return isMatch;
                  }) : [];

                // Déterminer la couleur selon les trades ou signaux
                let bgColor = 'bg-gray-700 border-gray-600 text-gray-400'; // No trade par défaut
                let tradeCount = 0;

                if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
                  // Logique pour les trades personnels - basée sur PnL
                  if (dayTrades.length > 0) {
                    tradeCount = dayTrades.length;
                    
                    // Calculer le PnL total pour ce jour
                    const totalPnL = dayTrades.reduce((total, trade) => {
                      if (trade.pnl) {
                        return total + parsePnL(trade.pnl);
                      }
                      return total;
                    }, 0);
                    
                    // Déterminer la couleur selon le PnL total
                    if (totalPnL > 0) {
                      bgColor = 'bg-green-200/30 border-green-300/30 text-white'; // PnL positif - vert plus pale
                    } else if (totalPnL < 0) {
                      bgColor = 'calendar-cell-loss border-2'; // PnL négatif - rouge pâle (cases calendrier)
                    } else {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // PnL = 0
                    }
                  }
                } else {
                  // Logique pour les signaux (calendrier normal) - basée sur PnL
                  if (daySignals.length > 0) {
                    tradeCount = daySignals.length;
                    
                    // Calculer le PnL total pour ce jour
                    const totalPnL = daySignals.reduce((total, signal) => {
                      if (signal.pnl) {
                        return total + parsePnL(signal.pnl);
                      }
                      return total;
                    }, 0);
                    
                    // Debug pour le jour 30
                    if (dayNumber === 30) {
                      console.log('🔍 [ADMIN] === DEBUG JOUR 30 ===');
                      console.log('🔍 [ADMIN] daySignals:', daySignals.length);
                      console.log('🔍 [ADMIN] PnL total:', totalPnL);
                      daySignals.forEach(signal => {
                        console.log('🔍 [ADMIN] Signal:', signal.symbol, 'PnL:', signal.pnl, 'Parsed:', parsePnL(signal.pnl));
                      });
                    }
                    
                    // Déterminer la couleur selon le PnL total
                    if (totalPnL > 0) {
                      bgColor = 'bg-green-200/30 border-green-300/30 text-white'; // PnL positif - vert plus pale
                    } else if (totalPnL < 0) {
                      bgColor = 'calendar-cell-loss border-2'; // PnL négatif - rouge pâle (cases calendrier)
                    } else {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // PnL = 0
                    }
                  }
                }

                return (
                  <div 
                    key={i} 
                    onClick={(e) => {
                      try {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                        
                        if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
                          setSelectedDate(clickedDate);
                          
                          // Ouvrir le popup des trades (toujours, même s'il n'y en a pas)
                          const tradesForDate = getTradesForDate(clickedDate);
                          console.log('Clic sur jour:', dayNumber, 'Trades trouvés:', tradesForDate.length);
                          
                          setSelectedTradesDate(clickedDate);
                          setShowTradesModal(true);
                        } else {
                          // Ouvrir le popup des signaux si il y en a
                          const signalsForDate = getSignalsForDate(clickedDate);
                          if (signalsForDate.length > 0) {
                            setSelectedSignalsDate(clickedDate);
                            setShowSignalsModal(true);
                          }
                        }
                      } catch (error) {
                        console.error('Erreur lors du clic sur le jour:', error);
                        console.error('Erreur lors du clic sur le jour:', error);
                      }
                    }}
                    className={`
                      border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 cursor-pointer transition-all hover:shadow-md relative
                      ${bgColor}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                      ${(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && selectedDate && 
                        selectedDate.getDate() === dayNumber && 
                        selectedDate.getMonth() === currentDate.getMonth() && 
                        selectedDate.getFullYear() === currentDate.getFullYear() 
                        ? 'ring-2 ring-purple-400' : ''}
                    `}
                    style={{minHeight: '64px'}}>
                    <div className="flex flex-col h-full justify-between">
                      <div className="text-xs md:text-sm font-semibold">{dayNumber}</div>
                      {(() => {
                        let totalPnL = 0;
                        let tradeCount = 0;
                        if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
                          const dayTrades = getTradesForSelectedAccount.filter(trade => trade.date === dateStrForDay);
                          tradeCount = dayTrades.length;
                          totalPnL = dayTrades.reduce((total, trade) => {
                            if (trade.pnl) {
                              return total + parsePnL(trade.pnl);
                            }
                            return total;
                          }, 0);
                        } else {
                          // Pour les signaux - utiliser allSignalsForStats qui contient TOUS les signaux
                          const daySignals = allSignalsForStats.filter(signal => {
                            const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                            return signalDate.getDate() === dayNumber && 
                                   signalDate.getMonth() === currentDate.getMonth() && 
                                   signalDate.getFullYear() === currentDate.getFullYear();
                          });
                          tradeCount = daySignals.length;
                          totalPnL = daySignals.reduce((total, signal) => {
                            if (signal.pnl) {
                              return total + parsePnL(signal.pnl);
                            }
                            return total;
                          }, 0);
                        }
                        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                        const noteMoy = (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getNoteMoyenneForDate(dayDate) : null;
                        const discColor = noteMoy != null ? getDisciplineColorForScore(noteMoy) : null;
                        const discTitle = noteMoy != null ? getDisciplineLabelForScore(noteMoy) : '';
                        return (
                          <>
                            <div className="flex flex-col items-center space-y-1">
                              {totalPnL !== 0 && (
                                <div className="text-xs font-bold text-center">
                                  ${totalPnL.toFixed(0)}
                                </div>
                              )}
                              {tradeCount > 0 && (
                                <div className="text-xs font-bold text-right self-end">
                                  {tradeCount}
                                </div>
                              )}
                            </div>
                            {noteMoy !== null && (
                              <div
                                className={`absolute bottom-1 left-1 text-xs font-bold ${discColor === 'green' ? 'text-green-100' : discColor === 'yellow' ? 'text-yellow-400' : 'text-loss'}`}
                                title={`Étoile discipline (sur 5): ${noteMoy} – ${discTitle}`}
                              >
                                ★ {noteMoy}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              });
            })()}
            </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200/50 border border-green-200/50/50 rounded"></div>
              <span className="text-xs text-gray-300">WIN</span>
            </div>
            <div className="flex items-center gap-1">
<div className="w-3 h-3 bg-loss/60 border border-loss/50 rounded"></div>
                <span className="text-xs text-gray-300">LOSS</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500/60 border border-blue-400/50 rounded"></div>
              <span className="text-xs text-gray-300">BREAK</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-700 border border-gray-600 rounded"></div>
              <span className="text-xs text-gray-300">NO TRADE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-400 rounded"></div>
              <span className="text-xs text-gray-300">Today</span>
            </div>
          </div>

          {/* Solde du compte pour journal perso (pas sur TPLN model) */}
          {selectedChannel.id === 'trading-journal' && selectedAccount && selectedAccount !== 'Tous les comptes' && (() => {
            const account = tradingAccounts.find(acc => acc.account_name === selectedAccount);
            const currentBalance = calculateAccountBalance();
            const initialBalance = account?.initial_balance || 0;
            const minimumBalance = account?.minimum_balance || 0;
            const pnl = calculateTotalPnLTradesForAccount();
            
            // DD max - utiliser une valeur du compte si disponible, sinon 1250 par défaut
            // Pour l'instant, on utilise 1250 par défaut, mais on peut ajouter un champ max_drawdown plus tard
            // On peut stocker temporairement dans localStorage jusqu'à ce qu'on ajoute le champ dans la DB
            const savedMaxDrawdown = localStorage.getItem(`maxDrawdown_${selectedAccount}`);
            const maxDrawdown = savedMaxDrawdown ? parseFloat(savedMaxDrawdown) : 1250;
            
            // Calculer les pertes depuis le solde initial
            // Si currentBalance >= initialBalance, on n'a PAS perdu, donc jauge à 0
            let drawdownPercentage = 0;
            let losses = 0;
            
            if (initialBalance > 0 && currentBalance < initialBalance) {
              // On a perdu de l'argent
              losses = initialBalance - currentBalance;
              // Calculer le pourcentage : plus on perd, plus la jauge avance vers la droite
              // La jauge avance progressivement : si on perd 50$ sur un DD max de 100$, on est à 50%
              drawdownPercentage = maxDrawdown > 0 
                ? Math.min(100, (losses / maxDrawdown) * 100)
                : 0;
            }
            // Sinon, drawdownPercentage reste à 0 (pas de pertes ou solde initial non défini)
            
            return (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Solde</h4>
                      <p className="text-xs text-gray-400">{selectedAccount}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        currentBalance >= initialBalance 
                          ? 'text-green-100' : 'text-red-100'
                      }`}>
                        ${currentBalance.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Balance initiale: ${initialBalance.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Stop-loss: ${minimumBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Jauge de drawdown maximum */}
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">DD Max</span>
                    <span className="text-sm font-bold text-white">{drawdownPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden">
                    {/* Barre de progression rouge */}
                    {drawdownPercentage > 0 && (
                      <div 
                        className="absolute left-0 top-0 h-full bg-red-800/70 transition-all duration-300 rounded-full"
                        style={{ width: `${drawdownPercentage}%` }}
                      />
                    )}
                    {/* Indicateur rouge circulaire - seulement si on a des pertes */}
                    {drawdownPercentage > 0 && (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-700 rounded-full border-2 border-white shadow-lg z-10"
                        style={{ left: `calc(${Math.max(0, drawdownPercentage)}% - 8px)` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-white font-medium">${losses.toFixed(2)}</span>
                    <span className="text-white font-medium">${maxDrawdown.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Graphique PnL cumulé pour journal perso desktop - sous le calendrier (pas sur TPLN model) */}
          {!isMobile && selectedChannel.id === 'trading-journal' && dailyPnLChartData.length > 0 && (
            <div className="mt-4">
              <DailyPnLChart 
                data={dailyPnLChartData} 
                height={450} 
                initialBalance={selectedAccount && selectedAccount !== 'Tous les comptes' ? (tradingAccounts.find(acc => acc.account_name === selectedAccount)?.initial_balance ?? (() => { try { const s = localStorage.getItem('accountBalances'); return s ? JSON.parse(s)[selectedAccount] : undefined; } catch { return undefined; } })()) : undefined} 
              />
            </div>
          )}

          {/* Analyse des pertes pour les signaux - sous le calendrier */}
          {selectedChannel.id !== 'trading-journal' && selectedChannel.id !== 'user-management' && (() => {
            const monthSignals = allSignalsForStats.filter(signal => {
              const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
              return signalDate.getMonth() === currentDate.getMonth() && 
                     signalDate.getFullYear() === currentDate.getFullYear();
            });
            
            const lossSignals = monthSignals.filter(s => s.status === 'LOSS');
            
            if (lossSignals.length === 0) return null;
            
            const lossByReason: { [key: string]: { count: number, totalPnl: number } } = {};
            
            lossSignals.forEach(signal => {
              const reason = (signal as any).loss_reason || 'non_specifiee';
              console.log('🔍 [ADMIN LOSS] Signal:', { id: signal.id, loss_reason: reason, status: signal.status });
              if (!lossByReason[reason]) {
                lossByReason[reason] = { count: 0, totalPnl: 0 };
              }
              lossByReason[reason].count++;
              if (signal.pnl) {
                const pnlValue = typeof signal.pnl === 'string' ? parseFloat(signal.pnl.replace(/[^0-9.-]/g, '')) : signal.pnl;
                lossByReason[reason].totalPnl += Math.abs(pnlValue);
              }
            });
            
            const sortedReasons = Object.entries(lossByReason)
              .filter(([reason]) => reason !== 'non_specifiee')
              .map(([reason, data]) => ({
                reason,
                count: data.count,
                percentage: Math.round((data.count / lossSignals.length) * 100)
              }))
              .sort((a, b) => b.count - a.count);
            
            const totalLossPnl = lossSignals.reduce((total, signal) => {
              if (signal.pnl) {
                const pnlValue = typeof signal.pnl === 'string' ? parseFloat(signal.pnl.replace(/[^0-9.-]/g, '')) : signal.pnl;
                return total + Math.abs(pnlValue);
              }
              return total;
            }, 0);
            
                return (
              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <h4 className="text-base font-medium text-loss mb-4">📊 Analyse des Pertes</h4>
                <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total pertes:</span>
                    <span className="text-loss font-medium">{lossSignals.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">P&L total pertes:</span>
                    <span className="text-loss font-medium">${Math.round(totalLossPnl)}</span>
                      </div>
                  {sortedReasons.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-2">Raisons des pertes:</div>
                      <div className="space-y-2">
                        {sortedReasons.map((reason) => (
                          <div key={reason.reason} className="flex justify-between text-sm">
                            <span className="text-gray-300">{getCustomLossReasonLabel(reason.reason)}</span>
                            <span className="text-loss font-medium">{reason.count} ({reason.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Ajoute des raisons aux pertes pour voir l'analyse
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
        </div>

        {/* Panneau des statistiques */}
        <div className="w-full lg:w-80 bg-gray-800 rounded-xl p-4 md:p-6" style={{ paddingTop: (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? 'calc(1rem + 1cm)' : '1rem' }}>
          {/* Métriques principales */}
          <div className="space-y-2 mb-8">
            {/* Mois / Jour - uniquement Journal perso et TPLN model */}
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStatsPeriod('mois')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${statsPeriod === 'mois' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Mois
                </button>
                <button
                  type="button"
                  onClick={() => setStatsPeriod('jour')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${statsPeriod === 'jour' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Jour
                </button>
              </div>
            )}
            {/* PnL (Journal perso - tous comptes ou compte sélectionné) */}
            {selectedChannel.id === 'trading-journal' && selectedAccount && (() => {
              // Si un jour est sélectionné (modal ouvert), afficher le PnL de ce jour
              const isDaySelected = showTradesModal && selectedTradesDate != null;
              const tradesForDay = isDaySelected && selectedTradesDate ? getTradesForDate(selectedTradesDate) : [];
              const dayPnl = Math.round(tradesForDay.reduce((sum, t) => sum + parsePnL(t.pnl || '0'), 0));
              
              // Sinon, utiliser le PnL du mois affiché dans le calendrier
              const monthTrades = getThisMonthTrades();
              const monthPnl = Math.round(monthTrades.reduce((total, trade) => total + parsePnL(trade.pnl || '0'), 0));
              
              const displayPnl = isDaySelected ? dayPnl : monthPnl;
              const scopeLabel = selectedAccount === 'Tous les comptes' ? ' (tous comptes)' : '';
              const displayLabel = isDaySelected ? `PnL (ce jour)${scopeLabel}` : `PnL${scopeLabel}`;
              
              // Debug
              if (isDaySelected && selectedTradesDate) {
                console.log('🔍 [ADMIN PnL] Jour sélectionné:', selectedTradesDate.toLocaleDateString(), 'Trades:', tradesForDay.length, 'PnL:', dayPnl);
              }
              
              return (
                <div className={`border rounded-lg p-4 border ${
                  displayPnl >= 0 ? 'bg-green-200/20 border-green-200/30' : 'bg-loss/20 border-loss/30'
                }`}>
                  <div className={`text-sm mb-1 ${
                    displayPnl >= 0 ? 'text-green-100' : 'text-loss'
                  }`}>
                    {displayLabel}
                  </div>
                  <div className={`text-2xl font-bold ${
                    displayPnl >= 0 ? 'text-green-100' : 'text-loss'
                  }`}>
                    {displayPnl >= 0 ? '+' : ''}${displayPnl}
                  </div>
                </div>
              );
            })()}

            {/* Pnl pour TPLN model - affiche le PnL selon statsPeriod (jour/mois) ou du jour cliqué si un jour est sélectionné */}
            {selectedChannel.id === 'tpln-model' && (() => {
              // Si un jour est sélectionné (modal ouvert), afficher le PnL de ce jour
              const isDaySelected = showTradesModal && selectedTradesDate != null;
              const tradesForDay = isDaySelected && selectedTradesDate ? getTradesForDate(selectedTradesDate) : [];
              const dayPnl = Math.round(tradesForDay.reduce((sum, t) => sum + parsePnL(t.pnl || '0'), 0));
              
              // Sinon, utiliser le PnL selon statsPeriod (jour ou mois)
              const periodPnl = Math.round(calculateTotalPnLTradesForDisplay());
              
              const displayPnl = isDaySelected ? dayPnl : periodPnl;
              const displayLabel = isDaySelected 
                ? 'PnL (ce jour)' 
                : (statsPeriod === 'jour' ? 'P&L du jour' : 'P&L du mois');
              
              return (
                <div className={`border rounded-lg p-4 border ${
                  displayPnl >= 0 ? 'bg-green-200/20 border-green-200/30' : 'bg-loss/20 border-loss/30'
                }`}>
                  <div className={`text-sm mb-1 ${
                    displayPnl >= 0 ? 'text-green-100' : 'text-loss'
                  }`}>
                    {displayLabel}
                  </div>
                  <div className={`text-2xl font-bold ${
                    displayPnl >= 0 ? 'text-green-100' : 'text-loss'
                  }`}>
                    {displayPnl >= 0 ? '+' : ''}${displayPnl}
                  </div>
                </div>
              );
            })()}

            {/* Win Rate */}
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg py-1 px-4 border flex items-center justify-between">
              <div className="flex-1">
              <div className="text-sm text-blue-300 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-200">
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? calculateWinRateTradesForDisplay() : calculateWinRate()}%
                </div>
              </div>
              <div style={{ marginLeft: '-4cm' }}>
                <WinRateGauge 
                  {...((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getWinsAndLossesTradesForDisplay() : getWinsAndLosses())} 
                />
              </div>
            </div>

            {/* Profit Factor (Journal perso et TPLN model) - pas sur Journal Signaux */}
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Profit Factor
                  <div className="group relative">
                    <span className="text-gray-400 cursor-help">?</span>
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-600">
                      Ratio gains totaux<br />sur pertes totales
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? 
                    (() => {
                      const { totalWins, totalLosses } = getProfitFactorDataTradesForDisplay();
                      return totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0.00';
                    })() :
                    (() => {
                      const { totalWins, totalLosses } = getProfitFactorData();
                      return totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0.00';
                    })())
                  }
                </div>
              </div>
              <ProfitFactorGauge 
                {...((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getProfitFactorDataTradesForDisplay() : getProfitFactorData())} 
              />
            </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Trade auj</div>
                <div className="text-lg font-bold text-blue-400">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getTodayTrades().length : getTodaySignals().length}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Trade ce mois</div>
                <div className="text-lg font-bold text-white">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getThisMonthTrades().length : getThisMonthSignals().length}
                </div>
              </div>
            </div>
            
            {selectedChannel.id !== 'tpln-model' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-100">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgWinTradesForDisplay() > 0 ? `+$${calculateAvgWinTradesForDisplay()}` : '-') :
                    (calculateAvgWin() > 0 ? `+$${calculateAvgWin()}` : '-')
                  }
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-loss">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgLossTradesForDisplay() > 0 ? `-$${calculateAvgLossTradesForDisplay()}` : '-') :
                    (calculateAvgLoss() > 0 ? `-$${calculateAvgLoss()}` : '-')
                  }
                </div>
              </div>
            </div>
            )}

            {/* Perf par session (taux de réussite %): sous Avg Win - Asian/London | NY AM/NY PM */}
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Asian</div>
                  <div className="text-base font-bold text-white">
                    {getWinRateForSessionDisplay(['18h', 'Open Asian']) !== null ? `${getWinRateForSessionDisplay(['18h', 'Open Asian'])}%` : '–'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">London</div>
                  <div className="text-base font-bold text-white">
                    {getWinRateForSessionDisplay(['London']) !== null ? `${getWinRateForSessionDisplay(['London'])}%` : '–'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">NY AM</div>
                  <div className="text-base font-bold text-white">
                    {getWinRateForSessionDisplay(['NY AM']) !== null ? `${getWinRateForSessionDisplay(['NY AM'])}%` : '–'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">NY PM</div>
                  <div className="text-base font-bold text-white">
                    {getWinRateForSessionDisplay(['NY PM']) !== null ? `${getWinRateForSessionDisplay(['NY PM'])}%` : '–'}
                  </div>
                </div>
              </div>
            </div>
            )}

            {isMobile && selectedChannel.id !== 'tpln-model' && dailyPnLChartData.length > 0 && (
              <div className="mt-3">
                <DailyPnLChart 
                  data={dailyPnLChartData} 
                  height={450} 
                  initialBalance={selectedChannel.id === 'trading-journal' && selectedAccount && selectedAccount !== 'Tous les comptes' ? (tradingAccounts.find(acc => acc.account_name === selectedAccount)?.initial_balance ?? (() => { try { const s = localStorage.getItem('accountBalances'); return s ? JSON.parse(s)[selectedAccount] : undefined; } catch { return undefined; } })()) : undefined} 
                />
              </div>
            )}

            {/* Analyse des pertes - sous Avg Win/Loss (Journal perso et TPLN model) */}
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (() => {
              const lossAnalysis = getLossAnalysis();
              if (lossAnalysis.totalLosses > 0) {
                return (
                  <div className="bg-gray-700 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-loss">📊 Analyse des Pertes</h4>
                      <button
                        onClick={() => setShowLossReasonsModal(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Gérer les raisons de perte"
                      >
                        ⚙️
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total pertes:</span>
                        <span className="text-loss">{lossAnalysis.totalLosses}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">P&L total pertes:</span>
                        <span className="text-loss">${lossAnalysis.totalLossPnl}</span>
                      </div>
                      {lossAnalysis.reasons.length > 0 ? (
                        lossAnalysis.reasons.slice(0, 3).map((reason, index) => (
                          <div key={reason.reason} className="flex justify-between text-xs">
                            <span className="text-gray-400 truncate">{getCustomLossReasonLabel(reason.reason)}</span>
                            <span className="text-loss">{reason.count} ({reason.percentage}%)</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Ajoute des raisons aux pertes pour voir l'analyse
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          </div>

          {/* Résumé hebdomadaire */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h4>
            <div className="space-y-2">
              {((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? getWeeklyBreakdownTrades() : getWeeklyBreakdown()).map((weekData, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-600/50 transition-colors ${
                  weekData.isCurrentWeek 
                    ? 'bg-blue-600/20 border-blue-500/30' 
                    : 'bg-gray-700/50 border-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedWeek(weekData.weekNum);
                    setShowWeekSignalsModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-medium ${
                      weekData.isCurrentWeek ? 'text-blue-300' : 'text-gray-300'
                    }`}>
                      {weekData.week}
                    </div>
                    {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
                    <div className="text-xs text-gray-400">
                      {weekData.trades} trade{weekData.trades !== 1 ? 's' : ''}
                    </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-1" style={{ width: '84px' }}>
                      {weekData.wins === 0 && weekData.losses === 0 ? (
                        <div className="col-span-2 text-sm text-gray-500 text-center">
                          -
                      </div>
                    ) : (
                        <>
                          <div className={`text-sm py-1 rounded-lg font-bold shadow-lg border flex items-center justify-center ${weekData.wins > 0 ? 'bg-green-200/30 text-green-100 border-green-200/20' : 'bg-transparent border-transparent'}`} style={{ width: '40px', height: '28px' }}>
                            {weekData.wins > 0 ? `${weekData.wins}W` : ''}
                      </div>
                          <div className={`text-sm py-1 rounded-lg font-bold shadow-lg border flex items-center justify-center ${weekData.losses > 0 ? 'bg-loss/30 text-loss border-loss/20' : 'bg-transparent border-transparent'}`} style={{ width: '40px', height: '28px' }}>
                            {weekData.losses > 0 ? `${weekData.losses}L` : ''}
                          </div>
                        </>
                    )}
                    </div>
                    <div className={`text-xs ${
                      weekData.pnl > 0 ? 'text-green-100' : 
                      weekData.pnl < 0 ? 'text-loss' : 'text-gray-500'
                    }`} style={{ minWidth: '60px', textAlign: 'right' }}>
                      {weekData.pnl !== 0 ? `${weekData.pnl > 0 ? '+' : ''}$${weekData.pnl}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons Tous les WIN / LOSS / Tableau - tout en bas, en colonne (comme PWA) */}
          {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model' || selectedChannel.id === 'calendrier' || selectedChannel.id === 'calendar') && (
            <div className="flex flex-col gap-2 mt-6 mb-10">
              <button
                onClick={() => {
                  setWinsLossFilter('WIN');
                  setWinsLossTradeIndex(0);
                  setShowWinsLossModal(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-green-200/30 border border-green-200/40 text-green-100 hover:bg-green-200/40 transition-colors text-sm font-medium"
              >
                📈 Tous les WIN ({(selectedChannel.id === 'calendrier' || selectedChannel.id === 'calendar') ? signals.filter(s => s.status === 'WIN' && s.channel_id === 'calendrier').length : getTradesForSelectedAccount.filter(t => t.status === 'WIN').length})
              </button>
              <button
                onClick={() => {
                  setWinsLossFilter('LOSS');
                  setWinsLossTradeIndex(0);
                  setShowWinsLossModal(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-loss/30 border border-loss/50 text-loss hover:bg-loss/50 transition-colors text-sm font-medium"
              >
                📉 Tous les LOSS ({(selectedChannel.id === 'calendrier' || selectedChannel.id === 'calendar') ? signals.filter(s => s.status === 'LOSS' && s.channel_id === 'calendrier').length : getTradesForSelectedAccount.filter(t => t.status === 'LOSS').length})
              </button>
              <button
                onClick={() => {
                  setWinsLossFilter('BE');
                  setWinsLossTradeIndex(0);
                  setShowWinsLossModal(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-medium"
              >
                🔵 Tous les BE ({(selectedChannel.id === 'calendrier' || selectedChannel.id === 'calendar') ? signals.filter(s => s.status === 'BE' && s.channel_id === 'calendrier').length : getTradesForSelectedAccount.filter(t => t.status === 'BE').length})
              </button>
              <button
                onClick={() => setShowPerformanceTableModal(true)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600/50 border border-gray-500/50 text-gray-200 hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                📊 TABLEAU DE PERFORMANCE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex" style={{ paddingTop: '0px', backgroundColor: '#111827', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 min-w-56 flex-shrink-0 bg-gray-800 flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleProfileImageChange}
                className="hidden"
                accept="image/*"
              />
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  'TT'
                )}
              </div>
            </label>
            <div className="flex-1">
              {isEditingUsername ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="text-sm bg-transparent border border-blue-400 rounded px-1 py-0.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-300"
                    placeholder="Nouveau nom..."
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleUsernameEdit()}
                    onKeyDown={(e) => e.key === 'Escape' && handleUsernameCancel()}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleUsernameEdit}
                      className="text-xs bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded text-white"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleUsernameCancel}
                      className="text-xs bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-white"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <p 
                      className="text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setUsernameInput(currentUsername);
                        setIsEditingUsername(true);
                      }}
                      onTouchStart={(e) => {
                        if (usernameTimeoutRef.current) {
                          clearTimeout(usernameTimeoutRef.current);
                        }
                        usernameTimeoutRef.current = setTimeout(() => {
                          setUsernameInput(currentUsername);
                          setIsEditingUsername(true);
                          usernameTimeoutRef.current = null;
                        }, 500);
                      }}
                      onTouchEnd={(e) => {
                        if (usernameTimeoutRef.current) {
                          clearTimeout(usernameTimeoutRef.current);
                          usernameTimeoutRef.current = null;
                        }
                      }}
                      title="Appui long pour modifier"
                    >
                      {currentUsername}
                    </p>
                    <p className="text-xs text-gray-400">En ligne</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={sidebarRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ÉDUCATION</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('fondamentaux', 'fondamentaux')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>📚 Fondamentaux</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('general-chat-2', 'general-chat-2')} className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedChannel.id === 'general-chat-2' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}><span className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-center text-sm">📊</span>Indices</button>
              <button onClick={() => handleChannelChange('general-chat-3', 'general-chat-3')} className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedChannel.id === 'general-chat-3' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}><span className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-center text-sm">₿</span>Crypto</button>
              <button onClick={() => handleChannelChange('general-chat-4', 'general-chat-4')} className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedChannel.id === 'general-chat-4' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}><span className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-center text-sm">💵</span>Forex</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">
              <button onClick={() => {
                setSelectedChannel({id: 'tpln-model', name: 'tpln-model'});
                setView('calendar');
                scrollToTop();
              }} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'tpln-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📋 TPLN model</button>
              <button onClick={() => {
                // Réinitialiser selectedDate si on quitte le Trading Journal
                if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
                  setSelectedDate(null);
                }
                // Réinitialiser selectedChannel pour le calendrier
                setSelectedChannel({id: 'calendar', name: 'calendar'});
                setView('calendar');
                scrollToTop();
              }} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' && selectedChannel.id === 'calendar' ? 'bg-gray-700 text-white' : selectedChannel.id === 'tpln-model' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Journal Signaux</button>
              <button onClick={() => handleChannelChange('trading-journal', 'trading-journal')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'trading-journal' ? 'bg-gray-700 text-white' : selectedChannel.id === 'tpln-model' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📊 Journal Perso</button>
              <button onClick={() => {
                // Sauvegarder la position du scroll de la sidebar
                const scrollPos = sidebarRef.current?.scrollTop || 0;
                handleChannelChange('check-trade', 'check-trade');
                // Restaurer la position du scroll après le changement
                setTimeout(() => {
                  if (sidebarRef.current) {
                    sidebarRef.current.scrollTop = scrollPos;
                  }
                }, 0);
              }} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'check-trade' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>✅ Check Trade</button>
              <button onClick={() => handleChannelChange('livestream-premium', 'livestream-premium')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'livestream-premium' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                <div className="flex items-start gap-2">
                  <span>⭐</span>
                  <div className="flex flex-col">
                    <span>Livestream</span>
                    <span>Premium</span>
                  </div>
                </div>
              </button>
              <button onClick={() => {
                // Utiliser la fonction globale pour naviguer vers livestream
                if ((window as any).setCurrentPage) {
                  (window as any).setCurrentPage('livestream');
                }
              }} className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700">📺 Livestream</button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Statistiques</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-white">{calculateWinRate()}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">P&L Total:</span>
                <span className={calculateTotalPnL() >= 0 ? 'text-green-100' : 'text-red-100'}>
                  {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-white">{allSignalsForStats.filter(s => s.status === 'ACTIVE').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Trades:</span>
                <span className="text-white">{allSignalsForStats.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">NOTIFICATIONS</h3>
            <div className="space-y-1">
              <button 
                onClick={async () => {
                  try {
                    const sendLivestreamNotification = httpsCallable(functions, 'sendLivestreamNotification');
                    
                    // Récupérer tous les tokens FCM
                    const tokens = [];
                    const fcmTokensRef = ref(database, 'fcm_tokens');
                    const snapshot = await get(fcmTokensRef);
                    if (snapshot.exists()) {
                      const tokensData = snapshot.val();
                      Object.values(tokensData).forEach((tokenData: any) => {
                        if (tokenData.token) {
                          tokens.push(tokenData.token);
                        }
                      });
                    }
                    
                    if (tokens.length > 0) {
                      console.log('📱 Envoi notification livestream à', tokens.length, 'utilisateurs...');
                      const result = await sendLivestreamNotification({ tokens });
                      console.log('✅ Notification livestream envoyée:', result.data);
                      alert(`✅ Notification envoyée à ${result.data.successCount} utilisateurs!`);
                    } else {
                      alert('⚠️ Aucun utilisateur avec notifications activées');
                    }
                  } catch (error) {
                    console.error('❌ Erreur envoi notification livestream:', error);
                    
                    // Afficher tous les détails de l'erreur
                    let errorMessage = '❌ ERREUR DÉTAILLÉE:\n\n';
                    errorMessage += 'Message: ' + error.message + '\n';
                    errorMessage += 'Code: ' + (error.code || 'N/A') + '\n';
                    errorMessage += 'Name: ' + (error.name || 'N/A') + '\n';
                    
                    if (error.details) {
                      errorMessage += '\nDetails: ' + JSON.stringify(error.details, null, 2);
                    }
                    
                    alert(errorMessage);
                  }
                }}
                className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                🔴 Livestream
              </button>
              
              <button 
                onClick={() => setShowLivestreamModal(true)}
                className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                📝 Notif Custom
              </button>
            </div>
          </div>


          {/* Bouton déconnexion en bas de la sidebar - Desktop seulement */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <span className="text-lg">🏠</span>
              <span className="text-sm">Retour accueil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900" style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
        {/* Mobile Navigation - Fixed */}
        <div className="md:hidden bg-gray-800 border-b border-gray-700 p-3 fixed top-0 left-0 right-0 z-30" style={{ height: '60px', backgroundColor: '#1f2937' }}>
          {mobileView === 'channels' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      'TT'
                    )}
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <div>
                    <p 
                      className="text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setUsernameInput(currentUsername);
                        setIsEditingUsername(true);
                      }}
                      onTouchStart={(e) => {
                        if (usernameTimeoutRef.current) {
                          clearTimeout(usernameTimeoutRef.current);
                        }
                        usernameTimeoutRef.current = setTimeout(() => {
                          setUsernameInput(currentUsername);
                          setIsEditingUsername(true);
                          usernameTimeoutRef.current = null;
                        }, 500);
                      }}
                      onTouchEnd={(e) => {
                        if (usernameTimeoutRef.current) {
                          clearTimeout(usernameTimeoutRef.current);
                          usernameTimeoutRef.current = null;
                        }
                      }}
                      title="Appui long pour modifier"
                    >
                      {currentUsername}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setMobileView('channels')}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">
                  {view === 'calendar' && selectedChannel.id !== 'tpln-model' ? '📅 Journal Signaux' : 
                   selectedChannel.id === 'tpln-model' ? '📋 TPLN model' :
                   channels.find(c => c.id === selectedChannel.id)?.fullName || selectedChannel.name}
                </span>
              </button>

            </div>
          )}
        </div>

        {/* Mobile Content Container with Slide Animation */}
        <div className="md:hidden relative flex-1 overflow-hidden bg-gray-900" style={{ paddingTop: '60px', backgroundColor: '#111827' }}>
          {/* Channels List - Slides from left */}
          <div 
            className={`absolute inset-0 bg-gray-800 transform transition-transform duration-300 ease-in-out z-10 ${
              mobileView === 'channels' ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ backgroundColor: '#1f2937', minHeight: '100vh' }}
          >
                        <div className="p-4 space-y-6 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-base font-medium mb-3 flex items-center justify-center gap-2 text-white">
                  <span>📊</span>
                  <span>Statistiques signaux</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Win Rate:</span>
                    <span className="text-white">{calculateWinRate()}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Signaux actifs:</span>
                    <span className="text-white">{allSignalsForStats.filter(s => s.status === 'ACTIVE').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">P&L Total:</span>
                    <span className={calculateTotalPnL() >= 0 ? 'text-green-100' : 'text-red-100'}>
                      {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Total Trades:</span>
                    <span className="text-white">{allSignalsForStats.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ÉDUCATION</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['fondamentaux', 'letsgooo-model'].includes(c.id)).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        handleChannelChange(channel.id, channel.name);
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channel.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{channel.fullName}</p>
                          <p className="text-sm text-gray-400">Contenu éducatif</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">SIGNAUX</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['general-chat-2', 'general-chat-3', 'general-chat-4'].includes(c.id)).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        handleChannelChange(channel.id, channel.name);
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 text-center text-lg">{channel.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{channel.fullName}</p>
                          <p className="text-sm text-gray-400">Signaux de trading</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">TRADING HUB</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedChannel({id: 'tpln-model', name: 'tpln-model'});
                      setView('calendar');
                      setMobileView('content');
                      scrollToTop();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedChannel.id === 'tpln-model' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📋</span>
                      <div>
                        <p className="font-medium text-white">TPLN model</p>
                        <p className="text-sm text-gray-400">Calendrier et stats du modèle</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      // Réinitialiser selectedDate si on quitte le Trading Journal
                      if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') {
                        setSelectedDate(null);
                      }
                      setSelectedChannel({id: 'calendar', name: 'calendar'});
                      setView('calendar');
                      setMobileView('content');
                      scrollToTop();
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="font-medium text-white">Journal Signaux</p>
                        <p className="text-sm text-gray-400">Suivi des performances</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleChannelChange('trading-journal', 'trading-journal');
                      setMobileView('content');
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <p className="font-medium text-white">Journal Perso</p>
                        <p className="text-sm text-gray-400">Journal de trading</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleChannelChange('check-trade', 'check-trade');
                      setMobileView('content');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedChannel.id === 'check-trade' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-medium text-white">Check Trade</p>
                        <p className="text-sm text-gray-400">Checklist de trade</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleChannelChange('livestream-premium', 'livestream-premium');
                      setMobileView('content');
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⭐</span>
                      <div>
                        <p className="font-medium text-white">Livestream Premium</p>
                        <p className="text-sm text-gray-400">Stream premium</p>
                      </div>
                    </div>
                  </button>

                    <button
                      onClick={() => {
                      handleChannelChange('livestream', 'livestream');
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                      <span className="text-lg">📺</span>
                        <div>
                        <p className="font-medium text-white">Livestream</p>
                        <p className="text-sm text-gray-400">Streaming en direct</p>
                        </div>
                      </div>
                    </button>
                </div>
              </div>

              {/* Section NOTIFICATIONS */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">NOTIFICATIONS</h3>
                <div className="space-y-1">
                  <button 
                    onClick={async () => {
                      try {
                        const sendLivestreamNotification = httpsCallable(functions, 'sendLivestreamNotification');
                        
                        // Récupérer tous les tokens FCM
                        const tokens = [];
                        const fcmTokensRef = ref(database, 'fcm_tokens');
                        const snapshot = await get(fcmTokensRef);
                        if (snapshot.exists()) {
                          const tokensData = snapshot.val();
                          Object.values(tokensData).forEach((tokenData: any) => {
                            if (tokenData.token) {
                              tokens.push(tokenData.token);
                            }
                          });
                        }
                        
                        if (tokens.length > 0) {
                          console.log('📱 Envoi notification livestream à', tokens.length, 'utilisateurs...');
                          const result = await sendLivestreamNotification({ tokens });
                          console.log('✅ Notification livestream envoyée:', result.data);
                          alert(`✅ Notification envoyée à ${(result.data as any).successCount} utilisateurs!`);
                        } else {
                          alert('⚠️ Aucun utilisateur avec notifications activées');
                        }
                      } catch (error) {
                        console.error('❌ Erreur envoi notification livestream:', error);
                        
                        // Afficher tous les détails de l'erreur
                        let errorMessage = '❌ ERREUR DÉTAILLÉE:\n\n';
                        errorMessage += 'Message: ' + error.message + '\n';
                        errorMessage += 'Code: ' + (error.code || 'N/A') + '\n';
                        errorMessage += 'Name: ' + (error.name || 'N/A') + '\n';
                        
                        if (error.details) {
                          errorMessage += '\nDetails: ' + JSON.stringify(error.details, null, 2);
                        }
                        
                        alert(errorMessage);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    🔴 Livestream
                  </button>
                  
                  <button 
                    onClick={() => setShowLivestreamModal(true)}
                    className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    📝 Notif Custom
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Slides from right */}
          <div 
            className={`absolute inset-0 bg-gray-900 transform transition-transform duration-300 ease-in-out z-10 ${
              mobileView === 'content' ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ backgroundColor: '#111827', minHeight: '100vh' }}
          >
            {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model' || selectedChannel.id === 'user-management' || selectedChannel.id === 'check-trade') ? (
              <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: '0px' }}>
                {/* Header avec bouton Ajouter Trade pour Trading Journal - Desktop seulement */}
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (
                  <div className="hidden md:flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Mon Journal Perso</h1>
                      <p className="text-sm text-gray-400 mt-1">Journal tous tes trades</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          console.log('🔄 Rechargement des trades...');
                          const trades = await getPersonalTradesFromSupabase(200);
                          setPersonalTrades(prev => (trades.length > 0 ? trades : prev));
                          console.log(`✅ ${trades.length} trades rechargés depuis Supabase`);
                        }}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Recharger les trades depuis Supabase"
                      >
                        🔄 Recharger
                      </button>
                      <button 
                        onClick={() => {
                          const userId = localStorage.getItem('user_id');
                          navigator.clipboard.writeText(userId || '');
                          alert(`ID copié dans le presse-papier: ${userId || 'Aucun ID trouvé'}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Copier ton ID utilisateur"
                      >
                        📋 Copier ID
                      </button>
                      <button 
                        onClick={async () => {
                          console.log('🔍 DEBUG: Vérification Firebase...');
                          const userId = localStorage.getItem('user_id');
                          console.log('🔍 ID utilisateur:', userId);
                          
                          // Test direct Firebase
                          const { ref, get, query, orderByChild, limitToLast } = await import('firebase/database');
                          const { database } = await import('../utils/firebase-setup');
                          
                          try {
                            const tradesRef = ref(database, `personal_trades/${userId}`);
                            const q = query(tradesRef, orderByChild('created_at'), limitToLast(10));
                            const snapshot = await get(q);
                            
                            console.log('🔍 Snapshot existe:', snapshot.exists());
                            console.log('🔍 Nombre de trades:', snapshot.exists() ? Object.keys(snapshot.val() || {}).length : 0);
                            
                            if (snapshot.exists()) {
                              snapshot.forEach((childSnapshot) => {
                                console.log('📋 Trade trouvé:', childSnapshot.key, childSnapshot.val());
                              });
                            }
                          } catch (error) {
                            console.error('❌ Erreur Firebase:', error);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-200/60 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Debug Firebase"
                      >
                        🔍 Debug Firebase
                      </button>
                      <button 
                        onClick={handleAddTrade}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? '+ trade' : '+ Ajouter Trade'}
                      </button>
                      <button 
                        onClick={() => setShowFinSessionModal(true)}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Statistiques en fin de session"
                      >
                        Fin session
                      </button>
                    </div>
                  </div>
                )}
                
                  {/* Header pour le calendrier normal */}
                {view === 'calendar' && selectedChannel.id !== 'trading-journal' && (
                  <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Journal des Signaux</h1>
                      <p className="text-sm text-gray-400 mt-1">Suivi des performances des signaux</p>
                    </div>
                  </div>
                )}
                
                {selectedChannel.id === 'user-management' ? (
                  <div className="space-y-6" style={{ paddingTop: '80px' }}>
                    <div className="flex justify-between items-center border-b border-gray-600 pb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-white">Gestion Utilisateurs</h1>
                        <p className="text-sm text-gray-400 mt-1">Gérer tous les utilisateurs de la plateforme</p>
                      </div>
                      <button 
                        onClick={() => setShowUserModal(true)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        + Ajouter Utilisateur
                      </button>
                    </div>

                    {/* Liste des utilisateurs */}
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Créé le</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dernière connexion</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    user.status === 'active' ? 'bg-green-200/60 text-white' : 'bg-red-300/50 text-white'
                                  }`}>
                                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDeleteUserModal(true);
                                    }}
                                    className="text-red-100 hover:text-red-100"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  getTradingCalendar()
                )}
                
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4 w-full h-full overflow-y-auto" style={{ paddingTop: '80px', paddingBottom: '100px' }}>



                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'chatzone', ''].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                      <div></div>
                                          ) : (
                        signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              'A'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white">Admin</span>
                              <span className="text-xs text-gray-400">{signal.timestamp}</span>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-2xl md:max-w-2xl max-w-full">
                              <div className="space-y-3">
                                {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-200/60' : 'bg-gray-500'}`}></div>
                                  <h3 className="font-bold text-white text-lg">
                                    Signal {signal.type} {signal.symbol} {signal.referenceNumber || ''} – {signal.timeframe}
                                  </h3>
                                </div>
                                
                                {/* Détails du signal */}
                                <div className="space-y-2">
                                  {signal.entry !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Entrée : {signal.entry} USD</span>
                                    </div>
                                  )}
                                  {signal.stopLoss !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Stop Loss : {signal.stopLoss} USD</span>
                                    </div>
                                  )}
                                  {signal.takeProfit !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Take Profit : {signal.takeProfit} USD</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Ratio R:R */}
                                {signal.entry !== 'N/A' && signal.takeProfit !== 'N/A' && signal.stopLoss !== 'N/A' && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                    <span className="text-red-100 text-sm">🎯</span>
                                    <span className="text-white text-sm">
                                      Ratio R:R : ≈ {calculateRiskReward(signal.entry, signal.takeProfit, signal.stopLoss)}
                                    </span>
                                  </div>
                                )}

                                {/* Message de fermeture */}
                                {signal.closeMessage && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                    <span className="text-yellow-400 text-sm">🔒</span>
                                    <span className="text-yellow-400 text-sm font-medium">
                                      {signal.closeMessage}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {signal.image && (
                              <div className="mt-2">
                                <img 
                                  src={URL.createObjectURL(signal.image)} 
                                  alt="Signal screenshot"
                                  className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                                />
                              </div>
                            )}

                            {signal.closure_image && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-400 mb-1">📸 Photo de clôture:</div>
                                <img 
                                  src={URL.createObjectURL(signal.closure_image)} 
                                  alt="Closure screenshot"
                                  className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                                />
                              </div>
                            )}

                            {/* Boutons WIN/LOSS/BE pour clôturer les signaux */}
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'WIN' ? 'ACTIVE' : 'WIN')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'WIN' 
                                    ? 'bg-green-200/60 text-white shadow-lg shadow-green-200/20' 
                                    : 'bg-gray-600 hover:bg-green-200/60 text-gray-300 hover:text-white'
                                }`}
                              >
                                ✅ WIN
                              </button>
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'LOSS' ? 'ACTIVE' : 'LOSS')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'LOSS' 
                                    ? 'bg-red-300/50 text-white shadow-lg shadow-red-500/20' 
                                    : 'bg-gray-600 hover:bg-red-300/50 text-gray-300 hover:text-white'
                                }`}
                              >
                                ❌ LOSS
                              </button>
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'BE' ? 'ACTIVE' : 'BE')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'BE' 
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white'
                                }`}
                              >
                                ⚖️ BE
                              </button>
                            </div>

                            {/* Réactions emoji */}
                            <div className="flex items-center gap-2 mt-3">
                              <button 
                                onClick={() => handleReaction(signal.id, '🔥')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                🔥 {signal.reactions?.filter(r => r === '🔥').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '💎')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                💎 {signal.reactions?.filter(r => r === '💎').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '🚀')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                🚀 {signal.reactions?.filter(r => r === '🚀').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '👏')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                👏 {signal.reactions?.filter(r => r === '👏').length || 0}
                              </button>
                            </div>






                          </div>
                        </div>
                      ))
                    )}
                  </div>
                
                ) : selectedChannel.id === 'profit-loss' ? (
                  <div className="flex flex-col h-full w-full">
                    <ProfitLoss channelId="profit-loss" currentUserId="admin" />
                  </div>
                ) : selectedChannel.id === 'chatzone' ? (
                  <div className="flex flex-col h-full w-full">
                    <ChatZone onUnreadCountChange={() => {}} isActive={true} />
                  </div>
                ) : ['fondamentaux', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                                        {/* Messages de chat */}
                    <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 ${selectedChannel.id === 'fondamentaux' ? '' : 'pb-32'}`}>
                      
                      {/* Header Fondamentaux */}
                      {selectedChannel.id === 'fondamentaux' && (
                        <div className="mb-4">
                          <h1 className="text-xl md:text-2xl font-bold text-white">📚 Fondamentaux</h1>
                          <p className="text-sm text-gray-400 mt-1">Guide complet du trading - 16 pages</p>
                        </div>
                      )}
                      
                      {/* Galerie verticale pour Fondamentaux */}
                      {selectedChannel.id === 'fondamentaux' && (
                        <div className="w-full space-y-6">
                          {Array.from({ length: 16 }, (_, i) => i + 1).map((pageNum) => (
                            <div key={pageNum} className="w-full flex flex-col items-center">
                              <div className="text-center mb-2">
                                <span className="text-sm font-medium text-gray-400">Page {pageNum}/16</span>
                              </div>
                              <img 
                                src={`/fondamentaux/page-${pageNum}.jpg`}
                                alt={`Page ${pageNum}`}
                                className="w-full max-w-3xl rounded-lg shadow-lg border border-gray-700"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(chatMessages[selectedChannel.id] || []).length > 0 && (
                        (chatMessages[selectedChannel.id] || []).map((message, messageIndex) => (
                          <div key={message.id} id={`message-${message.id}`} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                              {message.author_avatar ? (
                                <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                              ) : message.author === currentUsername ? (
                                'A'
                              ) : (
                                'TT'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                {message.text && (
                                  <div className="text-white">
                                    {message.text.includes('🎥 **Session Trading Live') ? (
                                      <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-purple-400">🎥</span>
                                          <span className="font-semibold text-purple-300">Session Trading Live - QUALITÉ HAUTE</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-400">🔗</span>
                                            <a 
                                              href="https://admintrading.app.100ms.live/meeting/kor-inbw-yiz"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                              Rejoignez la room
                                            </a>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-100">⏱️</span>
                                            <span className="text-green-100">Latence: ~100ms</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-orange-400">📊</span>
                                            <span className="text-orange-300">Partage d'écran 1080p activé</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-yellow-400">🎯</span>
                                            <span className="text-yellow-300">Qualité optimisée pour le trading</span>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => window.open('https://admintrading.app.100ms.live/meeting/kor-inbw-yiz', '_blank')}
                                          className="mt-3 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm font-medium w-full"
                                        >
                                          👆 Cliquez pour rejoindre instantanément
                                        </button>
                                      </div>
                                    ) : (() => {
                                      const signalData = formatSignalMessage(message.text);
                                      if (signalData) {
                                        // Trouver le signal correspondant
                                        const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                        const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                        const currentSignal = signals.find(s => s.id === signalId);
                                        const isClosed = currentSignal && ['WIN', 'LOSS', 'BE'].includes(currentSignal.status);
                                        
                                        return (
                                          <div>
                                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                                              {signalData.status === 'CLOSED' || signalData.status === 'WIN' || signalData.status === 'LOSS' ? (
                                                <div className="mb-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs">📊</span>
                                                    <span className="text-sm font-semibold text-gray-300">SIGNAL FERMÉ</span>
                                                    {signalData.status === 'LOSS' && signalId && (
                                                      <button
                                                        onClick={() => {
                                                          // Trouver le signal d'origine (message actif avec le même signalId)
                                                          const messages = chatMessages[selectedChannel.id] || [];
                                                          const originalSignalIndex = messages.findIndex((msg, idx) => {
                                                            if (idx >= messageIndex) return false;
                                                            const msgSignalData = formatSignalMessage(msg.text);
                                                            return msgSignalData && msgSignalData.signalId === signalId && 
                                                                   msgSignalData.status !== 'CLOSED' && 
                                                                   msgSignalData.status !== 'WIN' && 
                                                                   msgSignalData.status !== 'LOSS';
                                                          });
                                                          
                                                          if (originalSignalIndex !== -1) {
                                                            const originalMessage = messages[originalSignalIndex];
                                                            const element = document.getElementById(`message-${originalMessage.id}`);
                                                            if (element) {
                                                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                              // Highlight temporaire
                                                              element.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                                                              setTimeout(() => {
                                                                element.style.backgroundColor = '';
                                                              }, 2000);
                                                            }
                                                          }
                                                        }}
                                                        className="ml-auto text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="Remonter au signal d'origine"
                                                      >
                                                        ⬆️
                                                      </button>
                                                    )}
                                                  </div>
                                                  <div className="text-sm">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className={signalData.status === 'WIN' ? 'text-green-100' : 'text-red-100'}>
                                                        {signalData.status === 'WIN' ? '🟢 GAGNANT' : '🔴 PERDANT'}
                                                      </span>
                                                    </div>
                                                    {signalData.pnl && (
                                                      <div className="text-gray-300">
                                                        P&L: <span className={signalData.pnl.includes('-') ? 'text-red-100' : 'text-green-100'}>{signalData.pnl}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                      </div>
                                    ) : (
                                                <div className="space-y-2">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-lg">🚀</span>
                                                    <span className="font-bold text-white">
                                                      {signalData.type} {signalData.symbol}
                                                    </span>
                                                    {signalData.timeframe && (
                                                      <span className="text-sm text-gray-400">{signalData.timeframe}</span>
                                                    )}
                                                  </div>
                                                  {signalData.entry && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                      <span className="text-gray-400">📊</span>
                                                      <span className="text-white">Entry: {signalData.entry}</span>
                                                    </div>
                                                  )}
                                                  {signalData.rr && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                      <span className="text-gray-400">🎯</span>
                                                      <span className="text-white">R:R ≈ {signalData.rr}</span>
                                                    </div>
                                                  )}
                                                  {signalData.timeframe && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                      <span className="text-gray-400">⏰</span>
                                                      <span className="text-white">{signalData.timeframe}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Boutons WIN/LOSS/BE pour clôturer les signaux */}
                                            {signalId && (
                                              <div className="mt-3 pt-3 border-t border-gray-600">
                                                <div className="flex items-center gap-1.5 justify-center">
                                                  <button
                                                    onClick={() => handleSignalStatusFromMessage(message.text, 'WIN')}
                                                    disabled={isClosed && currentSignal?.status !== 'WIN'}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 flex-1 ${
                                                      isClosed && currentSignal?.status === 'WIN'
                                                        ? 'bg-green-200/60 text-white shadow-lg shadow-green-200/20'
                                                        : isClosed
                                                        ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'bg-gray-600 hover:bg-green-200/60 text-gray-300 hover:text-white'
                                                    }`}
                                                  >
                                                    ✅ WIN
                                                  </button>
                                                  <button
                                                    onClick={() => handleSignalStatusFromMessage(message.text, 'LOSS')}
                                                    disabled={isClosed && currentSignal?.status !== 'LOSS'}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 flex-1 ${
                                                      isClosed && currentSignal?.status === 'LOSS'
                                                        ? 'bg-red-300/50 text-white shadow-lg shadow-red-500/20'
                                                        : isClosed
                                                        ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'bg-gray-600 hover:bg-red-300/50 text-gray-300 hover:text-white'
                                                    }`}
                                                  >
                                                    ❌ LOSS
                                                  </button>
                                                  <button
                                                    onClick={() => handleSignalStatusFromMessage(message.text, 'BE')}
                                                    disabled={isClosed && currentSignal?.status !== 'BE'}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 flex-1 ${
                                                      isClosed && currentSignal?.status === 'BE'
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                                        : isClosed
                                                        ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white'
                                                    }`}
                                                  >
                                                    ⚖️ BE
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      return <p className="whitespace-pre-wrap">{message.text}</p>;
                                    })()}
                                  </div>
                                )}
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    {true ? (
                                      <div className="relative flex flex-col items-center">
                                        <img 
                                          src={message.attachment_data} 
                                          alt="Attachment"
                                          className="mt-2 max-w-[200px] max-h-32 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            const newWindow = window.open();
                                            newWindow!.document.write(`<img src="${message.attachment_data}" style="max-width: 100%; height: auto;" />`);
                                            newWindow!.document.title = 'Image en grand';
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <span>📎</span>
                                        <span className="text-sm">Pièce jointe</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Réactions aux messages - HORS du cadre gris */}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                    (messageReactions[message.id]?.users || []).includes('Admin')
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="ml-1">
                                    {messageReactions[message.id]?.fire || 0}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Barre de message */}
                    <div className="border-t border-gray-700 p-2 md:p-4 fixed bottom-0 left-0 right-0 bg-gray-800 z-30 md:left-64" style={{ backgroundColor: '#1f2937' }}>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Tapez votre message..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <label className="cursor-pointer flex-shrink-0">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                          <span className="bg-gray-600 hover:bg-gray-500 p-1.5 md:p-2 rounded-lg text-gray-300 hover:text-white text-sm md:text-base">
                            📎
                          </span>
                        </label>
                        <button
                          onClick={handleCreateSignal}
                          className="bg-green-600 hover:bg-green-700 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium flex-shrink-0"
                        >
                          + Signal
                        </button>
                        <button
                          onClick={handleSendMessage}
                          className="bg-blue-600 hover:bg-blue-700 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-white text-xs md:text-sm flex-shrink-0"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedChannel.id === 'chat-communaute' ? (
                  <ChatCommunauteAdmin />
                ) : selectedChannel.id === 'livestream' ? (
                  <div className="flex flex-col h-full bg-gray-900">
                    {/* Interface Livestream Desktop */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                      {/* Zone de stream */}
                      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                        <div className="h-full flex flex-col items-center justify-center p-8">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-300/50 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Livestream Trading</h2>
                            <p className="text-gray-400">Session de trading en direct</p>
                            
                            {/* Iframe 100ms */}
                            <div className="w-full max-w-7xl relative">
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector('iframe[src*="100ms.live"]') as HTMLIFrameElement;
                                  if (iframe && iframe.requestFullscreen) {
                                    iframe.requestFullscreen();
                                  }
                                }}
                                className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                📺 Plein écran
                              </button>
                              <iframe
                                src="https://admintrading.app.100ms.live/meeting/kor-inbw-yiz"
                                width="100%"
                                height="1200px"
                                style={{ border: 'none', borderRadius: '8px' }}
                                allow="camera; microphone; display-capture; fullscreen"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat live */}
                      <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                          <h3 className="font-semibold text-white">💬 Chat Live</h3>
                          <p className="text-xs text-gray-400">Commentaires en direct</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {(chatMessages['livestream'] || []).length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                            </div>
                          ) : (
                            (chatMessages['livestream'] || []).map((message) => (
                              <div key={message.id} className="flex items-start gap-2">
                                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">T</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">{message.author}</span>
                                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                                  </div>
                                  <div className="bg-gray-700 rounded-lg p-2">
                                    <p className="text-white text-sm">{message.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Barre de message pour le chat live */}
                        <div className="p-4 border-t border-gray-700">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Commenter le stream..."
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <button
                              onClick={handleSendMessage}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm"
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedChannel.id === 'chatzone' ? (
                  <div className="flex flex-col h-full w-full">
                    <ChatZone onUnreadCountChange={() => {}} isActive={true} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">Bienvenue sur Admin</div>
                    <div className="text-gray-500 text-xs mt-1">Plateforme de trading en cours de développement</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Content Area */}
        <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden">
          {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model' || selectedChannel.id === 'user-management' || selectedChannel.id === 'check-trade') ? (
            getTradingCalendar()
          ) : (
            <div className="p-4 md:p-6 space-y-4 w-full" style={{ paddingTop: '80px' }}>

              {/* Affichage des signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'chatzone', ''].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                    <div></div>
                  ) : (
                    signals
                      .filter(signal => signal.channel_id === selectedChannel.id)
                      .reverse()
                      .map((signal) => (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">Admin</span>
                            <span className="text-xs text-gray-400">{signal.timestamp}</span>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-full md:max-w-2xl">
                            <div className="space-y-3">
                              {/* Header avec titre et indicateur */}
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-200/60' : 'bg-gray-500'}`}></div>
                                <h3 className="font-bold text-white text-lg">
                                  Signal {signal.type} {signal.symbol} {signal.referenceNumber || ''} – {signal.timeframe}
                                </h3>
                              </div>
                              
                              {/* Détails du signal */}
                              <div className="space-y-2">
                                {signal.entry !== 'N/A' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Entrée : {signal.entry} USD</span>
                                  </div>
                                )}
                                {signal.stopLoss !== 'N/A' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Stop Loss : {signal.stopLoss} USD</span>
                                  </div>
                                )}
                                {signal.takeProfit !== 'N/A' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Take Profit : {signal.takeProfit} USD</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Ratio R:R */}
                              {signal.entry !== 'N/A' && signal.takeProfit !== 'N/A' && signal.stopLoss !== 'N/A' && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                  <span className="text-red-100 text-sm">🎯</span>
                                  <span className="text-white text-sm">
                                    Ratio R:R : ≈ {calculateRiskReward(signal.entry, signal.takeProfit, signal.stopLoss)}
                                  </span>
                                </div>
                              )}

                              {/* P&L - affiché dans tous les salons sauf calendrier */}
                              {selectedChannel.id !== 'calendrier' && signal.pnl && (
                                <div className="pt-2 border-t border-gray-600">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">P&L:</span>
                                    <span className={`text-sm font-bold ${
                                      parseFloat(signal.pnl) >= 0 ? 'text-green-100' : 'text-red-100'
                                    }`}>
                                      {parseFloat(signal.pnl) >= 0 ? '+' : ''}{signal.pnl}$
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Message de fermeture */}
                              {signal.closeMessage && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                  <span className="text-yellow-400 text-sm">🔒</span>
                                  <span className="text-yellow-400 text-sm font-medium">
                                    {signal.closeMessage}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {signal.image && (
                            <div className="mt-2">
                              <img 
                                src={URL.createObjectURL(signal.image)} 
                                alt="Signal screenshot"
                                className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                              />
                            </div>
                          )}

                          {signal.closure_image && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-400 mb-1">📸 Photo de clôture:</div>
                              <img 
                                src={URL.createObjectURL(signal.closure_image)} 
                                alt="Closure screenshot"
                                className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'WIN' ? 'ACTIVE' : 'WIN')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'WIN' 
                                  ? 'bg-green-200/60 text-white shadow-lg shadow-green-200/20' 
                                  : 'bg-gray-600 hover:bg-green-200/60 text-gray-300 hover:text-white'
                              }`}
                            >
                              ✅ WIN
                            </button>
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'LOSS' ? 'ACTIVE' : 'LOSS')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'LOSS' 
                                  ? 'bg-red-300/50 text-white shadow-lg shadow-red-500/20' 
                                  : 'bg-gray-600 hover:bg-red-300/50 text-gray-300 hover:text-white'
                              }`}
                            >
                              ❌ LOSS
                            </button>
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'BE' ? 'ACTIVE' : 'BE')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'BE' 
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                  : 'bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white'
                              }`}
                            >
                              ⚖️ BE
                            </button>
                          </div>

                          {/* Réactions emoji */}
                          <div className="flex items-center gap-2 mt-3">
                            <button 
                              onClick={() => handleReaction(signal.id, '🔥')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              🔥 {signal.reactions?.filter(r => r === '🔥').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '💎')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              💎 {signal.reactions?.filter(r => r === '💎').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '🚀')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              🚀 {signal.reactions?.filter(r => r === '🚀').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '👏')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              👏 {signal.reactions?.filter(r => r === '👏').length || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                </div>
              ) : selectedChannel.id === '' ? (
                <div className="flex flex-col h-full">
                  {/* Interface Livestream Desktop */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                    {/* Zone de stream */}
                    <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                      {!isLiveStreaming ? (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-300/50 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Aucun stream en cours</h2>
                            <p className="text-gray-400">Commencez votre session de trading en direct</p>
                            
                            {/* Formulaire de démarrage */}
                            <div className="space-y-3 max-w-md mx-auto">
                              <input
                                type="text"
                                placeholder="Titre du stream (ex: Session TradingView - EURUSD)"
                                value={streamTitle}
                                onChange={(e) => setStreamTitle(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                              <textarea
                                placeholder="Description (optionnel)"
                                value={streamDescription}
                                onChange={(e) => setStreamDescription(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleStartStream}
                                  className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium"
                                >
                                  🎥 Démarrer Stream
                                </button>
                                <button
                                  onClick={handleShareScreen}
                                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                                >
                                  📺 Partager Écran
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col">
                          {/* Header du stream */}
                          <div className="bg-gray-800 p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-white">{streamTitle}</h3>
                                <p className="text-sm text-gray-400">{streamDescription}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-red-100">
                                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium">EN DIRECT</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  <span className="text-sm">{viewerCount} spectateurs</span>
                                </div>
                                <button
                                  onClick={handleStopStream}
                                  className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm text-white"
                                >
                                  Arrêter
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Zone de vidéo */}
                          <div className="flex-1 bg-black flex items-center justify-center">
                            <div className="text-center text-gray-400">
                              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                </svg>
                              </div>
                              <p className="text-sm">Stream en cours...</p>
                              <p className="text-xs mt-1">Partagez votre écran TradingView</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat live */}
                    <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="font-semibold text-white">💬 Chat Live</h3>
                        <p className="text-xs text-gray-400">{viewerCount} spectateurs en ligne</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {(chatMessages[''] || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-sm">Aucun message</div>
                            <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                          </div>
                        ) : (
                          (chatMessages[''] || []).map((message) => (
                            <div key={message.id} className="flex items-start gap-2">
                              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white text-sm">{message.author}</span>
                                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-2">
                                  <p className="text-white text-sm">{message.text}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Barre de message pour le chat live */}
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Commenter le stream..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm"
                          >
                            Envoyer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                              ) : selectedChannel.id === 'profit-loss' ? (
                  <div className="flex flex-col h-full w-full">
                    <ProfitLoss channelId="profit-loss" currentUserId="admin" />
                  </div>
                ) : ['fondamentaux', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {(chatMessages[selectedChannel.id] || []).length > 0 && (
                      (chatMessages[selectedChannel.id] || []).map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {message.author === currentUsername && profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : message.author_avatar ? (
                              <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              'A'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                              <button
                                onClick={() => handleDeleteMessage(message.id, selectedChannel.id)}
                                className="ml-auto text-red-100 hover:text-red-100 transition-colors"
                                title="Supprimer ce message"
                              >
                                🗑️
                              </button>
                            </div>
                            <div 
                              className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words"
                              data-signal-id={message.text.includes('[SIGNAL_ID:') ? message.text.match(/\[SIGNAL_ID:([^\]]+)\]/)?.[1] : undefined}
                              id={`message-${message.id}`}
                            >
                                <div className="text-white">
                                      {(() => {
                                    const signalData = formatSignalMessage(message.text);
                                    if (signalData) {
                                      return (
                                        <div>
                                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                                            {signalData.status === 'CLOSED' || signalData.status === 'WIN' || signalData.status === 'LOSS' ? (
                                              <div className="mb-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <span className="text-xs">📊</span>
                                                  <span className="text-sm font-semibold text-gray-300">SIGNAL FERMÉ</span>
                                                </div>
                                                <div className="text-sm">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className={signalData.status === 'WIN' ? 'text-green-100' : 'text-red-100'}>
                                                      {signalData.status === 'WIN' ? '🟢 GAGNANT' : '🔴 PERDANT'}
                                                    </span>
                                                    {signalData.pnl && (
                                                      <span className={`text-sm ${signalData.pnl.includes('-') ? 'text-red-100' : 'text-green-100'}`}>
                                                        P&L: {signalData.pnl}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {signalData.status === 'LOSS' && signalData.signalId && (
                                                    <div className="mt-2 pt-2 border-t border-gray-600">
                                                      <button
                                          onClick={() => {
                                                          const currentSignalId = signalData.signalId;
                                                          console.log('🔍 Flèche cliquée - signalId:', currentSignalId);
                                                          
                                                          // Chercher le signal d'origine dans les messages
                                                          const channelMessages = (chatMessages[selectedChannel.id] || []);
                                                          const originalMessage = channelMessages.find((msg) => {
                                                            const msgSignalData = formatSignalMessage(msg.text);
                                                            return msgSignalData && 
                                                                   msgSignalData.signalId === currentSignalId && 
                                                                   msgSignalData.status !== 'CLOSED' && 
                                                                   msgSignalData.status !== 'WIN' && 
                                                                   msgSignalData.status !== 'LOSS' &&
                                                                   msg.id !== message.id;
                                                          });
                                                          
                                                          console.log('🔍 Message original trouvé:', originalMessage);
                                            
                                            if (originalMessage) {
                                                            const element = document.getElementById(`message-${originalMessage.id}`);
                                                            console.log('🔍 Élément trouvé par ID:', element);
                                                            if (element) {
                                                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                              element.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                                              setTimeout(() => {
                                                                element.style.backgroundColor = '';
                                                              }, 2000);
                                            } else {
                                                              // Fallback : chercher par data-signal-id
                                                              const fallbackElement = document.querySelector(`[data-signal-id="${currentSignalId}"]`);
                                                              console.log('🔍 Élément fallback trouvé:', fallbackElement);
                                                              if (fallbackElement) {
                                                                const messageContainer = fallbackElement.closest('[id^="message-"]') || fallbackElement.parentElement;
                                                                if (messageContainer) {
                                                                  (messageContainer as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                  (messageContainer as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                                                                  setTimeout(() => {
                                                                    (messageContainer as HTMLElement).style.backgroundColor = '';
                                                                  }, 2000);
                                                                }
                                                              }
                                                            }
                                                          } else {
                                                            console.log('❌ Aucun message original trouvé');
                                                          }
                                                        }}
                                                        className="flex items-center gap-1 text-white hover:text-gray-300 transition-colors text-sm font-medium cursor-pointer"
                                                        title="Remonter au signal d'origine"
                                                      >
                                                        <span className="text-lg">⬆️</span>
                                                        <span>Voir le signal d'origine</span>
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-lg">🚀</span>
                                                  <span className="font-bold text-white">
                                                    {signalData.type} {signalData.symbol}
                                                  </span>
                                                  {signalData.timeframe && (
                                                    <span className="text-sm text-gray-400">{signalData.timeframe}</span>
                                                  )}
                                                </div>
                                                {signalData.entry && (
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400">📊</span>
                                                    <span className="text-white">Entry: {signalData.entry}</span>
                                                  </div>
                                                )}
                                                {signalData.rr && (
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400">🎯</span>
                                                    <span className="text-white">R:R ≈ {signalData.rr}</span>
                                                  </div>
                                                )}
                                                {signalData.timeframe && (
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400">⏰</span>
                                                    <span className="text-white">{signalData.timeframe}</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return message.text;
                                  })()}
                                </div>
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    {true ? (
                                      <div className="relative flex flex-col items-center">
                                        <img 
                                          src={message.attachment_data} 
                                          alt="Attachment"
                                          className="mt-2 max-w-xs max-h-48 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setSelectedImage(message.attachment_data)}
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <span>📎</span>
                                        <span className="text-sm">Pièce jointe</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Boutons WIN/LOSS/BE pour les messages de signal (pas pour les messages de fermeture) */}
                                {message.text.includes('[SIGNAL_ID:') && !message.text.includes('SIGNAL FERMÉ') && (() => {
                                  // Extraire l'ID du signal pour vérifier son statut
                                  const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                  const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                  const currentSignal = signals.find(s => s.id === signalId);
                                  const isClosed = currentSignal && ['WIN', 'LOSS', 'BE'].includes(currentSignal.status);
                                  
                                  return (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Résultat du signal:</span>
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'WIN')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'WIN'
                                              ? 'bg-green-200/60 text-white border-2 border-green-200/50 shadow-lg scale-105' // Bouton WIN actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-green-200/20 hover:bg-green-200/30 text-green-100 border border-green-200/30 hover:scale-105' // Bouton WIN normal
                                          }`}
                                        >
                                          🟢 WIN
                                        </button>
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'LOSS')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'LOSS'
                                              ? 'bg-red-300/50 text-white border-2 border-red-400 shadow-lg scale-105' // Bouton LOSS actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-red-400/20 hover:bg-red-400/30 text-red-100 border border-red-400/30 hover:scale-105' // Bouton LOSS normal
                                          }`}
                                        >
                                          🔴 LOSS
                                        </button>
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'BE')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'BE'
                                              ? 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg scale-105' // Bouton BE actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border border-blue-400/30 hover:scale-105' // Bouton BE normal
                                          }`}
                                        >
                                          🔵 BE
                                        </button>
                                      </div>
                                      {isClosed && (
                                        <div className="mt-2 text-xs text-gray-400">
                                          <span 
                                            className="cursor-pointer text-blue-400 hover:text-blue-300 underline"
                                            onClick={() => {
                                              // Trouver le message original du signal
                                              const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                              if (originalMessage) {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                // Surligner temporairement
                                                originalMessage.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                }, 3000);
                                              }
                                            }}
                                          >
                                            Signal {currentSignal?.referenceNumber || ''} fermé avec {currentSignal?.pnl ? `P&L: ${currentSignal.pnl}` : 'aucun P&L'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              {/* Réactions aux messages - HORS du cadre gris */}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                    (messageReactions[message.id]?.users || []).includes('Admin')
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="ml-1">
                                    {messageReactions[message.id]?.fire || 0}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Barre de message */}
                  <div className="border-t border-gray-700 p-2 md:p-4 fixed bottom-0 left-0 right-0 bg-gray-800 z-10 md:left-64 md:right-0" style={{ backgroundColor: '#1f2937' }}>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Tapez votre message..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <label className="cursor-pointer flex-shrink-0">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <span className="bg-gray-600 hover:bg-gray-500 p-1.5 md:p-2 rounded-lg text-gray-300 hover:text-white text-sm md:text-base">
                          📎
                        </span>
                      </label>
                      <button
                        onClick={handleCreateSignal}
                        className="bg-green-600 hover:bg-green-700 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium flex-shrink-0"
                      >
                        + Signal
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-white text-xs md:text-sm flex-shrink-0"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedChannel.id === 'chatzone' ? (
                <div className="flex flex-col h-full w-full">
                  <ChatZone />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">Bienvenue sur Admin</div>
                  <div className="text-gray-500 text-xs mt-1">Plateforme de trading en cours de développement</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de signal */}
      {showSignalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Créer un signal</h2>
                <button 
                  onClick={() => setShowSignalModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Zone de collage TradingView */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">📋 Coller données TradingView</label>
                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className={`text-xs px-2 py-1 rounded ${debugMode ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      {debugMode ? '🔧 Debug ON' : '🔧 Debug OFF'}
                    </button>
                  </div>
                  <div
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[80px] flex items-center justify-center cursor-pointer"
                    onPaste={handleTradingViewPaste}
                    onDrop={(e) => {
                      e.preventDefault();
                      const text = e.dataTransfer.getData('text');
                      if (text) {
                        // Simuler un événement de collage
                        const fakeEvent = {
                          preventDefault: () => {},
                          clipboardData: {
                            getData: (type: string) => {
                              if (type === 'text/html') return '';
                              if (type === 'text') return text;
                              return '';
                            }
                          }
                        } as React.ClipboardEvent<HTMLDivElement>;
                        handleTradingViewPaste(fakeEvent);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {isPasteActive ? (
                      <div className="text-blue-400">🔄 Traitement en cours...</div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-400 mb-1">📋 Cliquez ici et collez (Ctrl+V)</div>
                        <div className="text-xs text-gray-500">ou glissez-déposez du texte</div>
                      </div>
                    )}
                  </div>
                  {error && (
                    <p className="text-xs text-red-100 mt-1">{error}</p>
                  )}
                  {debugMode && pasteDebug && (
                    <div className="text-xs text-gray-400 mt-1 bg-gray-900 p-2 rounded">
                      <div className="font-semibold">Debug:</div>
                      <pre className="whitespace-pre-wrap text-xs">{pasteDebug}</pre>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Collez directement depuis TradingView (Risk/Reward tool)</p>
                </div>

                {/* Type de signal */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSignalData({...signalData, type: 'BUY'})}
                      className={`px-3 py-2 rounded text-sm ${signalData.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📈 BUY
                    </button>
                    <button
                      onClick={() => setSignalData({...signalData, type: 'SELL'})}
                      className={`px-3 py-2 rounded text-sm ${signalData.type === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📉 SELL
                    </button>
                  </div>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbole</label>
                  <input
                    type="text"
                    value={signalData.symbol}
                    onChange={(e) => setSignalData({...signalData, symbol: e.target.value})}
                    placeholder="BTCUSD, EURUSD, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Timeframe */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                  <input
                    type="text"
                    value={signalData.timeframe}
                    onChange={(e) => setSignalData({...signalData, timeframe: e.target.value})}
                    placeholder="1 min, 5 min, 1H, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'entrée</label>
                  <input
                    type="text"
                    value={signalData.entry}
                    onChange={(e) => setSignalData({...signalData, entry: e.target.value})}
                    placeholder="103474.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
                  <input
                    type="text"
                    value={signalData.takeProfit}
                    onChange={(e) => setSignalData({...signalData, takeProfit: e.target.value})}
                    placeholder="104626.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="text"
                    value={signalData.stopLoss}
                    onChange={(e) => setSignalData({...signalData, stopLoss: e.target.value})}
                    placeholder="102862.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={signalData.description}
                    onChange={(e) => setSignalData({...signalData, description: e.target.value})}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Capture d'écran</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSignalData({...signalData, image: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
               
                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSignalModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSignalSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                  >
                    Créer le signal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

              {/* Modal pour ajouter un utilisateur */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Ajouter un utilisateur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                    placeholder="email@exemple.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                    placeholder="Mot de passe"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={createUser}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation suppression */}
        {showDeleteUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Confirmer la suppression</h3>
              <p className="text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.email}</strong> ?
                Cette action est irréversible.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un trade */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">{editingTrade ? 'Modifier le trade' : 'Ajouter un trade'}</h2>
                <button 
                  onClick={() => { setSelectedAccounts([]); setEditingTrade(null); setShowTradeModal(false); }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Zone de collage TradingView */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">📋 Coller données TradingView</label>
                  <div
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[80px] flex items-center justify-center cursor-pointer"
                    onPaste={handleTradingViewPasteTrade}
                    onDrop={(e) => {
                      e.preventDefault();
                      const text = e.dataTransfer.getData('text');
                      if (text) {
                        const fakeEvent = {
                          preventDefault: () => {},
                          clipboardData: {
                            getData: (type: string) => {
                              if (type === 'text/html') return '';
                              if (type === 'text') return text;
                              return '';
                            }
                          }
                        } as React.ClipboardEvent<HTMLDivElement>;
                        handleTradingViewPasteTrade(fakeEvent);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="text-center">
                      <div className="text-gray-400 mb-1">📋 Cliquez ici et collez (Ctrl+V)</div>
                      <div className="text-xs text-gray-500">ou glissez-déposez du texte</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Collez directement depuis TradingView</p>
                </div>

                {/* Compte destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Comptes (sélectionner plusieurs)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded p-3">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes('Tous les comptes')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allAccounts = ['TPLN model', ...(tradingAccounts.length > 0 ? tradingAccounts.map(a => a.account_name) : ['Compte Principal'])];
                            setSelectedAccounts(allAccounts);
                          } else {
                            setSelectedAccounts([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">📊 Tous les comptes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes('TPLN model')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccounts([...selectedAccounts.filter(a => a !== 'Tous les comptes'), 'TPLN model']);
                          } else {
                            setSelectedAccounts(selectedAccounts.filter(a => a !== 'TPLN model'));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">📋 TPLN model</span>
                    </label>
                    {tradingAccounts.map((account) => (
                      <label key={account.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.account_name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAccounts([...selectedAccounts.filter(a => a !== 'Tous les comptes'), account.account_name]);
                            } else {
                              setSelectedAccounts(selectedAccounts.filter(a => a !== account.account_name));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">{account.account_name}</span>
                      </label>
                    ))}
                    {tradingAccounts.length === 0 && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes('Compte Principal')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAccounts([...selectedAccounts.filter(a => a !== 'Tous les comptes'), 'Compte Principal']);
                            } else {
                              setSelectedAccounts(selectedAccounts.filter(a => a !== 'Compte Principal'));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Compte Principal</span>
                      </label>
                    )}
                  </div>
                  {selectedAccounts.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedAccounts.length} compte{selectedAccounts.length > 1 ? 's' : ''} sélectionné{selectedAccounts.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Type de trade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTradeData({...tradeData, type: 'BUY'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📈 BUY
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, type: 'SELL'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.type === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📉 SELL
                    </button>
                  </div>
                </div>

                {/* Session */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session</label>
                  <select
                    value={tradeData.session}
                    onChange={(e) => setTradeData({...tradeData, session: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">— Choisir —</option>
                    <option value="18h">18h</option>
                    <option value="Open Asian">Open Asian</option>
                    <option value="London">London</option>
                    <option value="NY AM">NY AM</option>
                    <option value="NY PM">NY PM</option>
                  </select>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbole *</label>
                  <input
                    type="text"
                    value={tradeData.symbol}
                    onChange={(e) => setTradeData({...tradeData, symbol: e.target.value})}
                    placeholder="BTC, ETH, NQ1!, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'entrée *</label>
                  <input
                    type="text"
                    value={tradeData.entry}
                    onChange={(e) => setTradeData({...tradeData, entry: e.target.value})}
                    placeholder="45000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Exit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix de sortie *</label>
                  <input
                    type="text"
                    value={tradeData.exit}
                    onChange={(e) => setTradeData({...tradeData, exit: e.target.value})}
                    placeholder="46000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="text"
                    value={tradeData.stopLoss}
                    onChange={(e) => setTradeData({...tradeData, stopLoss: e.target.value})}
                    placeholder="44000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* PnL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">P&L *</label>
                  <input
                    type="text"
                    value={tradeData.pnl}
                    onChange={(e) => setTradeData({...tradeData, pnl: e.target.value})}
                    placeholder="+500 ou -200"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Résultat</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'WIN'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'WIN' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ✅ WIN
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'LOSS'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'LOSS' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ❌ LOSS
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'BE'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'BE' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ⚖️ BE
                    </button>
                  </div>
                </div>

                {/* Raisons du stop-loss ou du BE (plusieurs raisons possibles) */}
                {(tradeData.status === 'LOSS' || tradeData.status === 'BE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {tradeData.status === 'LOSS' ? 'Raisons du Stop-Loss' : 'Raisons du BE'}
                    </label>
                    <div className="space-y-2">
                      {(tradeData.lossReasons.length === 0 ? [''].slice(0, 1) : [...tradeData.lossReasons, '']).map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            value={tradeData.lossReasons[index] ?? ''}
                            onChange={(e) => {
                              const newReasons = [...tradeData.lossReasons];
                              if (index >= newReasons.length) newReasons.push('');
                              if (e.target.value) {
                                newReasons[index] = e.target.value;
                              } else {
                                newReasons.splice(index, 1);
                              }
                              setTradeData({ ...tradeData, lossReasons: newReasons.filter(Boolean) });
                            }}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                          >
                            <option value="">{index === 0 ? 'Sélectionner une raison...' : 'Autre raison...'}</option>
                            {customLossReasons.map(reason => (
                              <option key={reason.value} value={reason.value}>
                                {reason.emoji} {reason.label}
                              </option>
                            ))}
                          </select>
                          {(index > 0 || (tradeData.lossReasons[index] && tradeData.lossReasons.length > 1)) && (
                            <button
                              type="button"
                              onClick={() => {
                                const newReasons = tradeData.lossReasons.filter((_, i) => i !== index);
                                setTradeData({ ...tradeData, lossReasons: newReasons });
                              }}
                              className="text-red-100 hover:text-red-100 px-2 shrink-0"
                              title="Supprimer cette raison"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTradeData({ ...tradeData, lossReasons: [...tradeData.lossReasons, ''] })}
                      className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      + Ajouter une raison
                    </button>
                    {tradeData.lossReasons.filter(Boolean).length > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        Raisons sélectionnées: {tradeData.lossReasons.filter(Boolean).map(r => {
                          const obj = customLossReasons.find(x => x.value === r);
                          return obj ? `${obj.emoji} ${obj.label}` : r;
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={tradeData.notes}
                    onChange={(e) => setTradeData({...tradeData, notes: e.target.value})}
                    placeholder="Notes sur le trade..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image 1</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setTradeData({...tradeData, image1: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image 2</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setTradeData({...tradeData, image2: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
               
                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setSelectedAccounts([]); setEditingTrade(null); setShowTradeModal(false); }}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleTradeSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                  >
                    {editingTrade ? 'Modifier le trade' : 'Ajouter le trade'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fin session - 4 stats psy */}
      {showFinSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">🧠 LES 4 STATS PSY ESSENTIELLES (fin de session)</h2>
                <button onClick={() => setShowFinSessionModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Session</label>
                <select
                  value={finSessionSelectedSession}
                  onChange={(e) => setFinSessionSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="18h">18h</option>
                  <option value="Open Asian">Open Asian</option>
                  <option value="London">London</option>
                  <option value="NY AM">NY AM</option>
                  <option value="NY PM">NY PM</option>
                </select>
              </div>
              {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') && (() => {
                const accountOptions = ['Compte Principal', 'TPLN model', ...tradingAccounts.filter((a: UserAccount) => a.account_name !== 'TPLN' && a.account_name !== 'TPLN model').map((a: UserAccount) => a.account_name)];
                const uniqueOptions = Array.from(new Set(accountOptions));
                return (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Comptes (mêmes stats enregistrées pour chaque compte coché)</label>
                    <div className="flex flex-wrap gap-3">
                      {uniqueOptions.map((name) => (
                        <label key={name} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={finSessionSelectedAccounts.includes(name)}
                            onChange={() => setFinSessionSelectedAccounts(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name])}
                            className="rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-white">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-6">
                {/* 1. Respect du plan */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-gray-600 text-gray-300 text-sm font-bold flex items-center justify-center">1</span>
                    <span className="font-medium text-white">Respect du plan</span>
                    <span className="text-yellow-400">⭐⭐⭐</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1"><strong>Question :</strong> <em>Ai-je respecté mon plan du début à la fin ?</em></p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(['Oui', 'Non', 'Partiel'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFinSessionRespectPlan(opt)}
                        className={`px-3 py-1.5 rounded text-sm ${finSessionRespectPlan === opt ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">👍 Stat n°1 absolue. Un trader peut perdre en respectant → journée réussie.</p>
                </div>
                {/* 2. Qualité des décisions */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-gray-600 text-gray-300 text-sm font-bold flex items-center justify-center">2</span>
                    <span className="font-medium text-white">Qualité des décisions</span>
                    <span className="text-yellow-400">⭐⭐</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1"><strong>Question :</strong> <em>Mes trades étaient-ils pris par lecture ou par émotion ?</em></p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(['Lecture', 'Mixte', 'Émotion'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFinSessionQualiteDecisions(opt)}
                        className={`px-3 py-1.5 rounded text-sm ${finSessionQualiteDecisions === opt ? (opt === 'Émotion' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : opt === 'Émotion' ? 'bg-gray-600 text-red-100 hover:bg-gray-500' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {finSessionQualiteDecisions === 'Émotion' && <p className="text-sm text-red-100 font-medium">⚠️ Alerte : émotion détectée.</p>}
                  <p className="text-xs text-gray-400">👍 Si &quot;émotion&quot; apparaît → alerte.</p>
                </div>
                {/* 3. Gestion après erreur */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-gray-600 text-gray-300 text-sm font-bold flex items-center justify-center">3</span>
                    <span className="font-medium text-white">Gestion après erreur</span>
                    <span className="text-yellow-400">⭐⭐⭐</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1"><strong>Question :</strong> <em>Après une erreur (SL, entrée ratée), ai-je gardé le contrôle ?</em></p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(['Oui', 'Non'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFinSessionGestionErreur(opt)}
                        className={`px-3 py-1.5 rounded text-sm ${finSessionGestionErreur === opt ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">👍 C&apos;est LA stat qui prédit la régularité future.</p>
                </div>
                {/* 4. Niveau de pression ressenti */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-gray-600 text-gray-300 text-sm font-bold flex items-center justify-center">4</span>
                    <span className="font-medium text-white">Niveau de pression ressenti</span>
                    <span className="text-yellow-400">⭐⭐</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-1"><strong>Auto-note :</strong> 1 = très calme → 5 = très tendu</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFinSessionPression(n)}
                        className={`w-10 h-10 rounded text-sm font-bold ${finSessionPression === n ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Tu veux voir : pression ≤ 3 les bons jours, pression maîtrisée même les jours rouges.</p>
                </div>
                {/* 5. Max Drawdown (DD) */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded bg-gray-600 text-gray-300 text-sm font-bold flex items-center justify-center">5</span>
                    <span className="font-medium text-white">Max Drawdown (DD)</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">Drawdown max de la session ($, ex: -50)</p>
                  <input
                    type="number"
                    placeholder="-50"
                    value={finSessionMaxDrawdown}
                    onChange={(e) => setFinSessionMaxDrawdown(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowFinSessionModal(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white text-sm">
                  Fermer
                </button>
                <button
                  onClick={async () => {
                    if (finSessionRespectPlan && finSessionQualiteDecisions && finSessionGestionErreur && finSessionPression !== '') {
                      const accountsToSave = (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? finSessionSelectedAccounts : ['Compte Principal'];
                      if (accountsToSave.length === 0) {
                        alert('Sélectionne au moins un compte.');
                        return;
                      }
                      const maxDd = finSessionMaxDrawdown.trim() === '' ? undefined : parseFloat(finSessionMaxDrawdown);
                      const payload = { respectPlan: finSessionRespectPlan, qualiteDecisions: finSessionQualiteDecisions, gestionErreur: finSessionGestionErreur, pression: finSessionPression, sessionType: finSessionSelectedSession, ...(maxDd != null && !Number.isNaN(maxDd) && { maxDrawdown: maxDd }) };
                      let allOk = true;
                      let firstError: string | null = null;
                      for (const acc of accountsToSave) {
                        const result = await saveFinSessionForDate(new Date(), { ...payload, account: acc });
                        if (!result.ok) { allOk = false; firstError = result.message ?? result.reason ?? 'Erreur'; }
                      }
                      if (allOk) {
                        const fromServer = await getFinSessionStatsFromSupabase();
                        setFinSessionCache(fromServer);
                        setShowFinSessionModal(false);
                        alert(`Stats enregistrées pour ${accountsToSave.length} compte(s) (sauvegardées en ligne).`);
                      } else alert(firstError === 'non_connecte' ? 'Tu n’es pas connecté. Déconnecte-toi puis reconnecte-toi (Supabase).' : `Erreur enregistrement. ${firstError ?? 'Vérifie ta connexion ou réessaie.'}`);
                    } else {
                      alert('Remplis les 4 stats pour enregistrer.');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm"
                >
                  Enregistrer ({finSessionSelectedSession})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des Trades */}
      {showTradesModal && selectedTradesDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Trades du {selectedTradesDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setShowTradesModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Stats fin de session pour ce jour (en haut) */}
              {(() => {
                const fs = getFinSessionForDate(selectedTradesDate);
                if (!fs) return null;
                const dateKey = getDateKey(selectedTradesDate);
                return (
                  <div className="mb-6 p-4 bg-gray-700/70 rounded-lg border border-gray-600 relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">🧠 Stats fin de session</h3>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Supprimer ces stats fin de session pour ce jour ?')) {
                            const acc = getEffectiveAccountForFinSession();
                            const ok = await deleteFinSessionStatFromSupabase(dateKey, acc);
                            if (ok) setFinSessionCache(prev => { const next = { ...prev }; delete next[getFinSessionCacheKey(dateKey, acc)]; return next; });
                          }
                        }}
                        className="text-gray-400 hover:text-white p-1 rounded"
                        title="Supprimer ces stats"
                        aria-label="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-400">Respect du plan:</span> <span className="text-white font-medium">{fs.respectPlan}</span></div>
                      <div><span className="text-gray-400">Qualité décisions:</span> <span className={fs.qualiteDecisions === 'Émotion' ? 'text-red-100 font-medium' : 'text-white font-medium'}>{fs.qualiteDecisions}</span></div>
                      <div><span className="text-gray-400">Gestion après erreur:</span> <span className="text-white font-medium">{fs.gestionErreur}</span></div>
                      <div><span className="text-gray-400">Pression (1-5):</span> <span className="text-white font-medium">{fs.pression}</span></div>
                      {fs.maxDrawdown != null && <div className="col-span-2"><span className="text-gray-400">Max Drawdown (DD):</span> <span className={fs.maxDrawdown < 0 ? 'text-red-100 font-medium' : 'text-white font-medium'}>{fs.maxDrawdown}$</span></div>}
                    </div>
                  </div>
                );
              })()}

              {/* PnL total pour ce jour */}
              {(() => {
                const tradesForDay = getTradesForDate(selectedTradesDate);
                const totalPnL = tradesForDay.reduce((total, trade) => {
                  if (trade.pnl) {
                    return total + parsePnL(trade.pnl);
                  }
                  return total;
                }, 0);
                
                if (tradesForDay.length > 0) {
                  return (
                    <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">PnL total pour ce jour:</span>
                        <span className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-4">
                {getTradesForDate(selectedTradesDate).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Aucun trade pour cette date
                  </div>
                ) : (
                  getTradesForDate(selectedTradesDate).map((trade) => (
                  <div key={trade.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trade.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {trade.type}
                        </span>
                        <span className="text-lg font-bold text-white">{trade.symbol}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          (trade.pnl && parseFloat(trade.pnl) >= 0) ? 'text-green-100' : 'text-red-100'
                        }`}>
                          {(trade.pnl && parseFloat(trade.pnl) >= 0) ? '+' : ''}{trade.pnl || '0'}$
                        </span>
                        <button
                          onClick={async () => {
                            setShowTradesModal(false);
                            await handleEditTrade(trade);
                          }}
                          className="px-3 py-1 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white"
                          title="Modifier ce trade"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Supprimer ce trade ?')) {
                              const tradesToDelete = selectedAccount === 'Tous les comptes'
                                ? personalTrades.filter(t => t.date === trade.date && t.symbol === trade.symbol && t.entry === trade.entry && t.exit === trade.exit && t.pnl === trade.pnl)
                                : [trade];
                              for (const t of tradesToDelete) {
                                const success = await deletePersonalTrade(t.id);
                                if (success) setPersonalTrades(prev => prev.filter(x => x.id !== t.id));
                              }
                            }
                          }}
                          className="text-red-100 hover:text-red-100 text-xl font-bold"
                          title="Supprimer ce trade"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-400">Entry:</span>
                        <span className="text-white ml-2">{trade.entry}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Exit:</span>
                        <span className="text-white ml-2">{trade.exit}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Stop Loss:</span>
                        <span className="text-white ml-2">{trade.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          trade.status === 'WIN' ? 'bg-green-600 text-white' :
                          trade.status === 'LOSS' ? 'bg-red-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {trade.status}
                        </span>
                      </div>
                    </div>

                    {trade.notes && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Notes:</span>
                        <p className="text-white mt-1">{trade.notes}</p>
                      </div>
                    )}

                    {/* Images */}
                    {(trade.image1 || trade.image2) && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Images:</span>
                        <div className="mt-2 space-y-3 flex flex-col items-center">
                          {trade.image1 && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image 1:</span>
                              <div className="mt-1">
                                <img 
                                  src={trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1} 
                                  alt="Trade image 1" 
                                  className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                  onClick={() => setSelectedImage(trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1)}
                                />
                              </div>
                            </div>
                          )}
                          {trade.image2 && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image 2:</span>
                              <div className="mt-1">
                                <img 
                                  src={trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2} 
                                  alt="Trade image 2" 
                                  className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                  onClick={() => setSelectedImage(trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Ajouté le {trade.timestamp}</span>
                    </div>
                  </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowTradesModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tous les WIN / Tous les LOSS - Journal perso, TPLN model, et Journal Signaux */}
      {showWinsLossModal && winsLossFilter && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowWinsLossModal(false)}>
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {(() => {
              // Pour le calendrier (signaux) ou les trades (journal perso/TPLN)
              const isSignalsMode = selectedChannel.id === 'calendrier';
              const filteredItems = isSignalsMode 
                ? signals.filter(s => s.status === winsLossFilter && s.channel_id === 'calendrier')
                : getTradesForSelectedAccount.filter(t => t.status === winsLossFilter);
              const currentItem = filteredItems[winsLossTradeIndex];
              
              if (!currentItem) {
                return (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-white">
                        {winsLossFilter === 'WIN' ? '📈 Tous les WIN' : winsLossFilter === 'LOSS' ? '📉 Tous les LOSS' : '🔵 Tous les BE'}
                      </h2>
                      <button onClick={() => setShowWinsLossModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                    </div>
                    <div className="text-center py-12 text-gray-400">Aucun {isSignalsMode ? 'signal' : 'trade'} {winsLossFilter === 'WIN' ? 'gagnant' : winsLossFilter === 'LOSS' ? 'perdant' : 'break-even'}</div>
                  </div>
                );
              }
              
              // Image: pour les signaux, utiliser image ou closure_image; pour les trades, utiliser image1 ou image2
              const imgSrc = isSignalsMode 
                ? (currentItem as any).image || (currentItem as any).closure_image
                : (currentItem as any).image1 || (currentItem as any).image2;
              const imgUrl = imgSrc ? (typeof imgSrc === 'string' ? imgSrc : URL.createObjectURL(imgSrc as any)) : null;
              
              return (
                <>
                  <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">
                      {winsLossFilter === 'WIN' ? '📈 Tous les WIN' : winsLossFilter === 'LOSS' ? '📉 Tous les LOSS' : '🔵 Tous les BE'} ({winsLossTradeIndex + 1}/{filteredItems.length})
                    </h2>
                    <button onClick={() => setShowWinsLossModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4 p-4 overflow-hidden">
                    <button
                      onClick={() => setWinsLossTradeIndex(i => (i <= 0 ? filteredItems.length - 1 : i - 1))}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-2xl text-white"
                    >
                      ←
                    </button>
                    <div className="flex-1 flex flex-col items-center min-w-0">
                      <div className="space-y-4">
                        {imgUrl ? (
                          <img src={imgUrl} alt={isSignalsMode ? "Signal" : "Trade"} className="max-w-full max-h-[60vh] object-contain rounded-lg border border-gray-600" />
                        ) : (
                          <div className="w-96 h-96 flex items-center justify-center bg-gray-700 rounded-lg text-gray-500">Pas d'image</div>
                        )}
                        {isSignalsMode && (currentItem as any).closure_image && (currentItem as any).image && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">📸 Photo de clôture:</div>
                            <img src={URL.createObjectURL((currentItem as any).closure_image)} alt="Closure" className="max-w-full max-h-[60vh] object-contain rounded-lg border border-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-center">
                        <span className="text-lg font-bold text-white">{currentItem.symbol}</span>
                        <span className={`ml-2 text-lg font-bold ${currentItem.pnl && parseFloat(currentItem.pnl) >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                          {(currentItem.pnl && parseFloat(currentItem.pnl) >= 0 ? '+' : '')}{currentItem.pnl || '0'}$
                        </span>
                        <span className="ml-2 text-gray-400 text-sm">{isSignalsMode ? new Date((currentItem as any).timestamp).toLocaleDateString() : (currentItem as any).date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setWinsLossTradeIndex(i => (i >= filteredItems.length - 1 ? 0 : i + 1))}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-2xl text-white"
                    >
                      →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Tableau de performance */}
      {showPerformanceTableModal && (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model' || selectedChannel.id === 'calendrier') && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPerformanceTableModal(false)}>
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white">Tableau de performance</h2>
              <button onClick={() => setShowPerformanceTableModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="overflow-auto p-4">
              {monthlyPerformanceDataAdmin.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucune donnée</p>
              ) : (
                <table className={`w-full text-left border-collapse ${window.matchMedia('(display-mode: standalone)').matches ? 'text-xs' : ''}`}>
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className={`py-2 text-gray-400 font-medium ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1' : 'pr-4'}`}>Mois</th>
                      <th className={`py-2 text-gray-400 font-medium text-right ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1 w-10' : 'pr-4'}`}>Trades</th>
                      <th className={`py-2 text-gray-400 font-medium text-right ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1' : 'pr-4'}`}>P&L ($)</th>
                      <th className={`py-2 text-gray-400 font-medium text-right ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1 whitespace-nowrap' : 'pr-4'}`}>WR</th>
                      <th className={`py-2 text-gray-400 font-medium text-right ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1' : 'pr-4'}`}>PF</th>
                      <th className={`py-2 text-gray-400 font-medium text-right ${window.matchMedia('(display-mode: standalone)').matches ? 'pr-1' : ''}`}>Max DD ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPerformanceDataAdmin.map(row => {
                      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
                      return (
                        <tr key={row.monthKey} className="border-b border-gray-700">
                          <td className={`py-2 text-white ${isPWA ? 'pr-1' : 'pr-4'}`}>{row.monthLabel}</td>
                          <td className={`py-2 text-white text-right ${isPWA ? 'pr-1 w-10' : 'pr-4'}`}>{row.trades}</td>
                          <td className={`py-2 text-right font-medium ${row.pnl >= 0 ? 'text-green-100' : 'text-red-100'} ${isPWA ? 'pr-1' : 'pr-4'}`}>
                            {row.pnl >= 0 ? '+' : ''}{row.pnl.toFixed(0)}
                          </td>
                          <td className={`py-2 text-white text-right ${isPWA ? 'pr-1 whitespace-nowrap' : 'pr-4'}`}>{row.wr}{isPWA ? '\u00A0%' : ' %'}</td>
                          <td className={`py-2 text-white text-right ${isPWA ? 'pr-1 whitespace-nowrap' : 'pr-4'}`}>{row.pf === Infinity ? '∞' : row.pf.toFixed(1)}</td>
                          <td className={`py-2 text-right text-red-100 ${isPWA ? 'pr-1' : ''}`}>{row.maxDdPnl != null ? `$${row.maxDdPnl}` : '–'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal des Signaux */}
      {showSignalsModal && selectedSignalsDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Signaux du {selectedSignalsDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setShowSignalsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const signalsForDate = getSignalsForDate(selectedSignalsDate);
                  console.log('🔍 [POPUP ADMIN] Signaux trouvés:', signalsForDate.length);
                  signalsForDate.forEach(signal => {
                    console.log('🔍 [POPUP ADMIN] Signal individuel:', {
                      id: signal.id,
                      symbol: signal.symbol,
                      image: signal.image,
                      attachment_data: signal.attachment_data,
                      closure_image: signal.closure_image,
                      closure_image_type: signal.closure_image_type,
                      closure_image_name: signal.closure_image_name,
                      ALL_KEYS: Object.keys(signal)
                    });
                  });
                  return signalsForDate;
                })().map((signal) => (
                  <div key={signal.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 relative">
                    {/* Bouton supprimer */}
                    <button
                      onClick={async () => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce signal ?')) {
                          try {
                            const signalRef = ref(database, `signals/${signal.id}`);
                            await remove(signalRef);
                            
                            // Mettre à jour l'état local
                            setAllSignalsForStats(prev => prev.filter(s => s.id !== signal.id));
                            setSignals(prev => prev.filter(s => s.id !== signal.id));
                            
                            console.log('✅ Signal supprimé:', signal.id);
                          } catch (error) {
                            console.error('❌ Erreur suppression signal:', error);
                            alert('Erreur lors de la suppression');
                          }
                        }
                      }}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-colors"
                    >
                      ×
                    </button>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          signal.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {signal.type}
                        </span>
                        <span className="text-lg font-bold text-white">{signal.symbol}</span>
                        <span className="text-sm text-gray-400">{signal.timeframe}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        signal.status === 'WIN' ? 'bg-green-600 text-white' :
                        signal.status === 'LOSS' ? 'bg-red-600 text-white' :
                        signal.status === 'BE' ? 'bg-blue-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {signal.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-400">Entry:</span>
                        <span className="text-white ml-2">{signal.entry}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Take Profit:</span>
                        <span className="text-white ml-2">{signal.takeProfit}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Stop Loss:</span>
                        <span className="text-white ml-2">{signal.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Channel:</span>
                        <span className="text-white ml-2">
                          {channels.find(ch => ch.id === signal.channel_id)?.fullName || signal.channel_id}
                        </span>
                      </div>
                    </div>

                    {signal.pnl && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">P&L:</span>
                        <span className={`ml-2 font-bold ${
                          signal.pnl.includes('+') || signal.pnl.includes('GAGNANT') ? 'text-green-100' : 
                          signal.pnl.includes('-') || signal.pnl.includes('PERDANT') ? 'text-red-100' : 
                          'text-yellow-400'
                        }`}>
                          {signal.pnl}
                        </span>
                      </div>
                    )}

                    {signal.description && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Description:</span>
                        <p className="text-white mt-1">{signal.description}</p>
                      </div>
                    )}

                    {(signal.attachment_data || signal.closure_image) && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Images du signal:</span>
                        <div className="mt-2 space-y-3 flex flex-col items-center">
                          {signal.attachment_data && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image de création:</span>
                              <div className="mt-1">
                                <img 
                                  src={signal.attachment_data} 
                                  alt="Signal screenshot"
                                  className="max-w-xs max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                  onClick={() => setSelectedImage(signal.attachment_data)}
                                />
                              </div>
                            </div>
                          )}
                          {signal.closure_image && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image de fermeture:</span>
                              <div className="mt-1">
                                <img 
                                  src={signal.closure_image} 
                                  alt="Signal closure screenshot"
                                  className="max-w-xs max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                  onClick={() => setSelectedImage(signal.closure_image)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Créé le {signal.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowSignalsModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Popup Image avec Zoom */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setSelectedImage(null);
            resetImageView();
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200 cursor-grab active:cursor-grabbing"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transformOrigin: 'center center'
              }}
              onClick={handleImageClick}
              onMouseDown={handleImageDragStart}
              onMouseMove={handleImageDrag}
              onMouseUp={handleImageDragEnd}
              onMouseLeave={handleImageDragEnd}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                handleImageZoom(delta);
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            {/* Contrôles de zoom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageZoom(-0.2);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm font-bold"
                disabled={imageZoom <= 0.5}
              >
                −
              </button>
              <span className="text-white text-sm px-2 py-1 bg-white/20 rounded">
                {Math.round(imageZoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageZoom(0.2);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm font-bold"
                disabled={imageZoom >= 5}
              >
                +
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetImageView();
                }}
                className="bg-blue-500/50 hover:bg-blue-500/70 text-white px-3 py-1 rounded text-sm"
              >
                🔄 Reset
              </button>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => {
                setSelectedImage(null);
                resetImageView();
              }}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-all"
            >
              ×
            </button>

            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-2 rounded-lg">
              <div>🖱️ Clic pour zoomer</div>
              <div>🔄 Molette pour zoomer</div>
              <div>✋ Glisser quand zoomé</div>
              <div>📱 Pinch pour zoomer (mobile)</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un compte */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter un nouveau compte</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Nom du compte</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Ex: Compte Demo"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Balance initiale ($)</label>
              <input
                type="number"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                placeholder="Ex: 10000"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Balance actuelle ($) <span className="text-gray-500 text-xs">(optionnel)</span></label>
              <input
                type="number"
                value={newAccountCurrentBalance}
                onChange={(e) => setNewAccountCurrentBalance(e.target.value)}
                placeholder="Ex: 12500 (si tu as déjà tradé)"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
              <p className="text-xs text-gray-500 mt-1">Si tu as déjà commencé à trader avec ce compte, indique ton solde actuel</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Balance minimum ($)</label>
              <input
                type="number"
                value={newAccountMinimum}
                onChange={(e) => setNewAccountMinimum(e.target.value)}
                placeholder="Ex: 5000 (seuil d'arrêt)"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddAccount}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Créer le compte
              </button>
              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  setNewAccountName('');
                  setNewAccountBalance('');
                  setNewAccountCurrentBalance('');
                  setNewAccountMinimum('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notification admin */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">📢 Envoyer une notification</h3>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationMessage('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Message à envoyer</label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Tapez votre message ici..."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:border-blue-500"
                maxLength={200}
              />
              <div className="text-xs text-gray-400 mt-1">
                {notificationMessage.length}/200 caractères
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSendNotification}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Envoyer
              </button>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationMessage('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal de notification livestream personnalisée */}
      {showLivestreamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">🔴 Notification Livestream</h3>
              <button
                onClick={() => {
                  setShowLivestreamModal(false);
                  setLivestreamMessage('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Message de notification</label>
              <textarea
                value={livestreamMessage}
                onChange={(e) => setLivestreamMessage(e.target.value)}
                placeholder="Exemple: 📈 Nouveau signal BTC en cours ! Entrée à 45,000$ - TP: 47,500$ - SL: 43,500$"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:border-red-500 placeholder-gray-400"
                maxLength={200}
              />
              <div className="text-xs text-gray-400 mt-1">
                {livestreamMessage.length}/200 caractères
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSendLivestreamNotification}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Envoyer
              </button>
              <button
                onClick={() => {
                  setShowLivestreamModal(false);
                  setLivestreamMessage('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des raisons de perte */}
      {showLossReasonsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">⚙️ Gérer les raisons de perte</h3>
                <button
                  onClick={() => {
                    setShowLossReasonsModal(false);
                    setEditingIndex(null);
                    setNewReason({ value: '', emoji: '', label: '' });
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Formulaire d'ajout/édition */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  {editingIndex !== null ? '✏️ Modifier la raison' : '➕ Ajouter une raison'}
                </h4>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Nom de la raison"
                    value={newReason.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewReason({...newReason, label, value});
                    }}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!newReason.label.trim()) {
                        alert('Entre un nom');
                        return;
                      }
                      
                      if (editingIndex !== null) {
                        if (!newReason.label.trim()) {
                          alert('Entre un nom');
                          return;
                        }
                        const updated = [...customLossReasons];
                        updated[editingIndex] = newReason;
                        setCustomLossReasons(updated);
                        localStorage.setItem('customLossReasons', JSON.stringify(updated));
                        setEditingIndex(null);
                      } else {
                        if (!newReason.value || !newReason.label) {
                          alert('Remplis le nom');
                          return;
                        }
                        const updated = [...customLossReasons, newReason];
                        setCustomLossReasons(updated);
                        localStorage.setItem('customLossReasons', JSON.stringify(updated));
                      }
                      
                      setNewReason({ value: '', emoji: '', label: '' });
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
                  >
                    {editingIndex !== null ? '✓ Modifier' : '+ Ajouter'}
                  </button>
                  {editingIndex !== null && (
                    <button
                      onClick={() => {
                        setEditingIndex(null);
                        setNewReason({ value: '', emoji: '', label: '' });
                      }}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des raisons */}
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Raisons actuelles ({customLossReasons.length}) :</h4>
                {customLossReasons.map((reason, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-2xl">{reason.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{reason.label}</div>
                      <div className="text-xs text-gray-400 font-mono">{reason.value}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNewReason(reason);
                          setEditingIndex(index);
                        }}
                        className="text-blue-400 hover:text-blue-300 px-3 py-1 text-sm"
                        title="Modifier le nom"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer "${reason.label}" ?`)) {
                            const updated = customLossReasons.filter((_, i) => i !== index);
                            setCustomLossReasons(updated);
                            localStorage.setItem('customLossReasons', JSON.stringify(updated));
                            setEditingIndex(null);
                            setNewReason({ value: '', emoji: '', label: '' });
                          }
                        }}
                        className="text-red-100 hover:text-red-100 px-3 py-1 text-sm"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Réinitialiser aux raisons par défaut ?')) {
                      setCustomLossReasons(LOSS_REASONS);
                      localStorage.setItem('customLossReasons', JSON.stringify(LOSS_REASONS));
                      setEditingIndex(null);
                      setNewReason({ value: '', emoji: '', label: '' });
                    }
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white font-medium"
                >
                  🔄 Réinitialiser
                </button>
                <button
                  onClick={() => {
                    setShowLossReasonsModal(false);
                    setEditingIndex(null);
                    setNewReason({ value: '', emoji: '', label: '' });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Signaux/Trades de la semaine */}
      {showWeekSignalsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" key={`week-modal-${selectedAccount}-${selectedWeek}`}>
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? 'Trades de la Semaine' : 'Signaux de la Semaine'} {selectedWeek}
                </h2>
                <button
                  onClick={() => setShowWeekSignalsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'tpln-model') ? (
                  // Affichage des trades pour le journal perso
                  (() => {
                    // Utiliser la même logique que getWeeklyBreakdownTrades
                    const currentMonth = currentDate.getMonth();
                    const currentYear = currentDate.getFullYear();
                    
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
                    
                    // Ajuster pour que lundi soit 0
                    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
                    
                    // Calculer les jours de la semaine
                    const weekStartDay = (selectedWeek - 1) * 7 - adjustedFirstDay + 1;
                    const weekEndDay = Math.min(selectedWeek * 7 - adjustedFirstDay, lastDayOfMonth.getDate());
                    
                    const weekStart = new Date(currentYear, currentMonth, weekStartDay);
                    const weekEnd = new Date(currentYear, currentMonth, weekEndDay);
                    // Ajouter 23h59 pour inclure toute la journée
                    weekEnd.setHours(23, 59, 59, 999);
                    
                    console.log(`🔍 Modal - Recherche trades pour semaine ${selectedWeek} [ADMIN]:`, weekStart.toDateString(), 'à', weekEnd.toDateString());
                    
                    const weekTrades = personalTrades.filter(trade => {
                      const tradeDate = new Date(trade.date);
                      const isDateMatch = tradeDate >= weekStart && 
                             tradeDate <= weekEnd &&
                             tradeDate.getMonth() === currentMonth &&
                             tradeDate.getFullYear() === currentYear;
                      
                      // Filtrer par compte sélectionné
                      const tradeAccount = trade.account || 'Compte Principal';
                      const isAccountMatch = selectedAccount === 'Tous les comptes' || tradeAccount === selectedAccount;
                      
                      console.log(`🔍 Modal - Trade ${trade.date} (${tradeDate.toDateString()}) dans semaine ${selectedWeek} [ADMIN]?`, isDateMatch, 'compte:', isAccountMatch);
                      return isDateMatch && isAccountMatch;
                    });
                    
                    console.log(`✅ Modal - Trades trouvés pour semaine ${selectedWeek} [ADMIN]:`, weekTrades.length);

                    return weekTrades.length > 0 ? (
                      weekTrades.map((trade) => (
                        <div key={trade.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                trade.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {trade.type}
                              </span>
                              <span className="text-lg font-bold text-white">{trade.symbol}</span>
                              <span className="text-sm text-gray-400">{trade.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                trade.status === 'WIN' ? 'bg-green-600 text-white' :
                                trade.status === 'LOSS' ? 'bg-red-600 text-white' :
                                trade.status === 'BE' ? 'bg-blue-600 text-white' :
                                'bg-yellow-600 text-white'
                              }`}>
                                {trade.status}
                              </span>
                              <button
                                onClick={() => handleEditTrade(trade)}
                                className="px-3 py-1 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white"
                                title="Modifier ce trade"
                              >
                                Modifier
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-400">Entry:</span>
                              <span className="text-white ml-2">{trade.entry}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">Exit:</span>
                              <span className="text-white ml-2">{trade.exit}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">Stop Loss:</span>
                              <span className="text-white ml-2">{trade.stopLoss}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">PnL:</span>
                              <span className={`ml-2 font-bold ${
                                trade.pnl && trade.pnl.includes('-') ? 'text-red-100' : 'text-green-100'
                              }`}>
                                {trade.pnl || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {trade.notes && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-400">Notes:</span>
                              <p className="text-white mt-1">{trade.notes}</p>
                            </div>
                          )}

                          {/* Affichage des images */}
                          {(trade.image1 || trade.image2) && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-400">Images:</span>
                              <div className="mt-2 space-y-3 flex flex-col items-center">
                                {trade.image1 && (
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500">📸 Image 1:</span>
                                    <div className="mt-1">
                                      <img 
                                        src={trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1}
                                        alt="Trade image 1"
                                        className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                        onClick={() => setSelectedImage(trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1)}
                                      />
                                    </div>
                                  </div>
                                )}
                                {trade.image2 && (
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500">📸 Image 2:</span>
                                    <div className="mt-1">
                                      <img 
                                        src={trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2}
                                        alt="Trade image 2"
                                        className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                        onClick={() => setSelectedImage(trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Créé le {trade.timestamp}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-lg mb-2">📊</div>
                        <div className="text-gray-300 text-lg font-medium">Aucun trade pour cette semaine</div>
                        <div className="text-gray-500 text-sm mt-1">Tes trades apparaîtront ici quand tu les ajouteras</div>
                      </div>
                    );
                  })()
                ) : (
                  // Affichage des signaux pour les autres canaux
                  (() => {
                    // Utiliser la même logique que getWeeklyBreakdown (lignes du calendrier)
                    const currentMonth = currentDate.getMonth();
                    const currentYear = currentDate.getFullYear();
                    
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                    const daysInMonth = lastDayOfMonth.getDate();
                    const firstDayWeekday = firstDayOfMonth.getDay();
                    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
                    
                    // Calculer les jours de la semaine en fonction de la ligne du calendrier
                    const weekStartIndex = (selectedWeek - 1) * 7;
                    const weekEndIndex = selectedWeek * 7 - 1;
                    
                    const weekDays: number[] = [];
                    for (let i = weekStartIndex; i <= weekEndIndex; i++) {
                      const dayNumber = i - adjustedFirstDay + 1;
                      if (dayNumber >= 1 && dayNumber <= daysInMonth) {
                        weekDays.push(dayNumber);
                      }
                    }
                    
                    const weekSignals = allSignalsForStats.filter(signal => {
                      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                      if (isNaN(signalDate.getTime())) {
                        return false;
                      }
                      
                      const signalDay = signalDate.getDate();
                      return signalDate.getMonth() === currentMonth &&
                             signalDate.getFullYear() === currentYear &&
                             weekDays.includes(signalDay);
                    });

                    return weekSignals.length > 0 ? (
                      weekSignals.map((signal) => (
                        <div key={signal.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                signal.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {signal.type}
                              </span>
                              <span className="text-lg font-bold text-white">{signal.symbol}</span>
                              <span className="text-sm text-gray-400">{signal.timeframe}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              signal.status === 'WIN' ? 'bg-green-600 text-white' :
                              signal.status === 'LOSS' ? 'bg-red-600 text-white' :
                              signal.status === 'BE' ? 'bg-blue-600 text-white' :
                              'bg-yellow-600 text-white'
                            }`}>
                              {signal.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-400">Entry:</span>
                              <span className="text-white ml-2">{signal.entry}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">Take Profit:</span>
                              <span className="text-white ml-2">{signal.takeProfit}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">Stop Loss:</span>
                              <span className="text-white ml-2">{signal.stopLoss}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">PnL:</span>
                              <span className={`ml-2 font-bold ${
                                signal.pnl && signal.pnl.includes('-') ? 'text-red-100' : 'text-green-100'
                              }`}>
                                {signal.pnl || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {signal.description && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-400">Description:</span>
                              <p className="text-white mt-1 whitespace-pre-wrap">{signal.description}</p>
                            </div>
                          )}

                          {(signal.attachment_data || signal.closure_image) && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-400 block mb-2">Images:</span>
                              <div className="flex flex-wrap gap-3">
                                {signal.attachment_data && (
                                  <img 
                                    src={signal.attachment_data} 
                                    alt="Signal"
                                    className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                    onClick={() => setSelectedImage(signal.attachment_data)}
                                  />
                                )}
                                {signal.closure_image && (
                                  <img 
                                    src={signal.closure_image}
                                    alt="Closure"
                                    className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                    onClick={() => setSelectedImage(signal.closure_image)}
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Envoyé le {signal.timestamp}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-lg mb-2">📊</div>
                        <div className="text-gray-300 text-lg font-medium">Aucun signal pour cette semaine</div>
                        <div className="text-gray-500 text-sm mt-1">Les signaux apparaîtront ici quand ils seront publiés</div>
                      </div>
                    );
                  })()
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowWeekSignalsModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
                
                