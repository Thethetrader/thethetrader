/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();

// Configuration globale pour v2
setGlobalOptions({ 
  maxInstances: 10,
  region: 'us-central1',
  cors: [
    'https://tradingpourlesnuls.com',
    'https://www.tradingpourlesnuls.com',
    'http://localhost:5173',
    'http://localhost:4173'
  ]
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Fonction pour envoyer des notifications push
exports.sendNotification = onCall(async (request) => {
  try {
    const { signal, tokens } = request.data;
    
    if (!signal || !tokens || !Array.isArray(tokens)) {
      throw new Error("Données manquantes: signal et tokens requis");
    }

    const messaging = getMessaging();
    
    // Préparer le message de notification
    // IMPORTANT: tous les champs dans "data" doivent être des strings
    const notificationTitle = `Signal Trade`;
    const notificationBody = `${signal.type} ${signal.symbol} - Entrée: ${signal.entry} | TP: ${signal.takeProfit} | SL: ${signal.stopLoss}`;
    
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        signalId: String(signal.id || ''),
        channelId: String(signal.channel_id || ''),
        type: 'new_signal',
        symbol: String(signal.symbol || ''),
        signalType: String(signal.type || '')
      },
      tokens: tokens, // Array de tokens FCM
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'signals'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/FAVICON.png',
          badge: '/FAVICON.png'
        }
      }
    };

    // Envoyer les notifications une par une pour éviter l'API batch
    const responses = [];
    let successCount = 0;
    let failureCount = 0;
    
    logger.info(`Tentative d'envoi de ${tokens.length} notifications`);
    logger.info(`Signal: ${signal.type} ${signal.symbol} - Entry: ${signal.entry}`);
    
    for (const token of tokens) {
      try {
        const singleMessage = {
          notification: message.notification,
          data: message.data,
          token: token,
          android: message.android,
          apns: message.apns,
          webpush: message.webpush
        };
        
        logger.info(`Envoi notification à token: ${token.substring(0, 20)}...`);
        const response = await messaging.send(singleMessage);
        logger.info(`✅ Notification envoyée avec succès. MessageId: ${response}`);
        responses.push({ success: true, messageId: response, token: token.substring(0, 20) + '...' });
        successCount++;
        
      } catch (error) {
        logger.error(`❌ Erreur envoi notification pour token ${token.substring(0, 20)}...:`, error);
        logger.error(`❌ Code erreur: ${error.code}, Message: ${error.message}`);
        
        // Si le token est invalide, on devrait le supprimer de la base de données
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          logger.warn(`⚠️ Token invalide détecté, devrait être supprimé de la base de données`);
        }
        
        responses.push({ 
          success: false, 
          error: error.message,
          errorCode: error.code,
          token: token.substring(0, 20) + '...'
        });
        failureCount++;
      }
    }
    
    logger.info(`📊 Résultat final: ${successCount} succès, ${failureCount} échecs sur ${tokens.length} tokens`);
    
    return {
      success: successCount > 0,
      successCount,
      failureCount,
      totalTokens: tokens.length,
      responses: responses.slice(0, 10) // Limiter les réponses pour éviter des payloads trop gros
    };
    
  } catch (error) {
    logger.error("Erreur envoi notification:", error);
    throw new Error(`Erreur envoi notification: ${error.message}`);
  }
});

// Fonction pour envoyer des notifications de clôture de signal
exports.sendClosureNotification = onCall(async (request) => {
  try {
    const { signal, tokens } = request.data;
    
    if (!signal || !tokens || !Array.isArray(tokens)) {
      throw new Error("Données manquantes: signal et tokens requis");
    }

    const messaging = getMessaging();
    
    // Préparer le message de notification pour la clôture
    const statusEmoji = signal.status === 'WIN' ? '🟢' : signal.status === 'LOSS' ? '🔴' : '🔵';
    const statusText = signal.status === 'WIN' ? 'GAGNANT' : signal.status === 'LOSS' ? 'PERDANT' : 'BREAK-EVEN';
    const notificationTitle = `Signal Clôturé - ${statusText}`;
    const notificationBody = `${signal.symbol} - ${signal.status !== 'BE' && signal.pnl ? `P&L: ${signal.pnl}` : 'Break-Even'}`;
    
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        signalId: String(signal.id || ''),
        channelId: String(signal.channel_id || ''),
        type: 'signal_closed',
        symbol: String(signal.symbol || ''),
        status: String(signal.status || ''),
        pnl: String(signal.pnl || '')
      },
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'signals'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/FAVICON.png',
          badge: '/FAVICON.png'
        }
      }
    };

    // Envoyer les notifications une par une
    const responses = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const token of tokens) {
      try {
        const singleMessage = {
          notification: message.notification,
          data: message.data,
          token: token,
          android: message.android,
          apns: message.apns,
          webpush: message.webpush
        };
        
        const response = await messaging.send(singleMessage);
        responses.push({ success: true, messageId: response });
        successCount++;
        
      } catch (error) {
        logger.error(`Erreur envoi notification clôture pour token ${token}:`, error);
        responses.push({ success: false, error: error.message });
        failureCount++;
      }
    }
    
    logger.info(`Notification clôture envoyée: ${successCount} succès, ${failureCount} échecs`);
    
    return {
      success: true,
      successCount,
      failureCount,
      responses
    };
    
  } catch (error) {
    logger.error("Erreur envoi notification clôture:", error);
    throw new Error(`Erreur envoi notification clôture: ${error.message}`);
  }
});

// Fonction pour envoyer une notification de livestream
exports.sendLivestreamNotification = onCall(async (request) => {
  try {
    const { tokens, customMessage } = request.data;
    
    if (!tokens || !Array.isArray(tokens)) {
      throw new Error("Tokens requis");
    }

    const messaging = getMessaging();
    
    // Utiliser le message personnalisé s'il est fourni, sinon utiliser le message par défaut
    const notificationTitle = customMessage ? '📢 TPLN' : '🔴 Livestream';
    const notificationBody = customMessage || 'Le livestream démarre dans 5 minutes !';
    
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        type: 'livestream_start',
        channelId: 'video'
      },
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'livestream'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/FAVICON.png',
          badge: '/FAVICON.png'
        }
      }
    };

    // Envoyer les notifications une par une
    const responses = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const token of tokens) {
      try {
        const singleMessage = {
          notification: message.notification,
          data: message.data,
          token: token,
          android: message.android,
          apns: message.apns,
          webpush: message.webpush
        };
        
        const response = await messaging.send(singleMessage);
        responses.push({ success: true, messageId: response });
        successCount++;
        
      } catch (error) {
        logger.error(`Erreur envoi notification livestream pour token ${token}:`, error);
        responses.push({ success: false, error: error.message });
        failureCount++;
      }
    }
    
    logger.info(`Notification livestream envoyée: ${successCount} succès, ${failureCount} échecs`);
    
    return {
      success: true,
      successCount,
      failureCount,
      responses
    };
    
  } catch (error) {
    logger.error("Erreur envoi notification livestream:", error);
    throw new Error(`Erreur envoi notification livestream: ${error.message}`);
  }
});

exports.sendHomeFeedNotification = onCall(async (request) => {
  try {
    const { tokens, title, body } = request.data;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) throw new Error("Tokens requis");

    const messaging = getMessaging();
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      try {
        await messaging.send({
          notification: { title: title || '📢 Nouvelle publication', body: body || '' },
          data: { type: 'home_feed' },
          token,
          android: { priority: 'high', notification: { sound: 'default', channelId: 'home_feed' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          webpush: { notification: { title: title || '📢 Nouvelle publication', body: body || '', icon: '/FAVICON.png' } },
        });
        successCount++;
      } catch (e) {
        logger.error(`Erreur token ${token}:`, e.message);
        failureCount++;
      }
    }

    logger.info(`HomeFeed notif: ${successCount} succès, ${failureCount} échecs`);
    return { success: true, successCount, failureCount };
  } catch (error) {
    logger.error("Erreur sendHomeFeedNotification:", error);
    throw new Error(error.message);
  }
});
