/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/https");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

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
        logger.error(`Erreur envoi notification pour token ${token}:`, error);
        responses.push({ success: false, error: error.message });
        failureCount++;
      }
    }
    
    logger.info(`Notification envoyée: ${successCount} succès, ${failureCount} échecs`);
    
    return {
      success: true,
      successCount,
      failureCount,
      responses
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
    const { tokens } = request.data;
    
    if (!tokens || !Array.isArray(tokens)) {
      throw new Error("Tokens requis");
    }

    const messaging = getMessaging();
    
    const notificationTitle = '🔴 Livestream Start 5 min';
    const notificationBody = 'Le livestream démarre dans 5 minutes !';
    
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
