// Script pour supprimer tous les signaux et messages de Firebase Realtime Database
// Usage: node clear-all-firebase-data.js

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAkooeomw80N2p89zUaSB5L2AwoB-SSpKg",
  authDomain: "tradingpourlesnuls-e7da4.firebaseapp.com",
  databaseURL: "https://tradingpourlesnuls-e7da4-default-rtdb.firebaseio.com",
  projectId: "tradingpourlesnuls-e7da4",
  storageBucket: "tradingpourlesnuls-e7da4.appspot.com",
  messagingSenderId: "742975995598",
  appId: "1:742975995598:web:a873ce4b7b3fb5af899a9f",
  measurementId: "G-4SVCDJXSYN"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app, firebaseConfig.databaseURL);

async function clearAllData() {
  try {
    console.log('🔍 Vérification des données existantes...');
    
    // Compter les signaux
    const signalsRef = ref(database, 'signals');
    const signalsSnapshot = await get(signalsRef);
    const signalsCount = signalsSnapshot.exists() ? Object.keys(signalsSnapshot.val()).length : 0;
    console.log(`📊 ${signalsCount} signaux trouvés`);
    
    // Compter les messages
    const messagesRef = ref(database, 'messages');
    const messagesSnapshot = await get(messagesRef);
    const messagesCount = messagesSnapshot.exists() ? Object.keys(messagesSnapshot.val()).length : 0;
    console.log(`📊 ${messagesCount} messages trouvés`);
    
    if (signalsCount === 0 && messagesCount === 0) {
      console.log('✅ Aucune donnée à supprimer.');
      return;
    }
    
    console.log('\n🗑️  Suppression en cours...');
    
    // Supprimer tous les signaux
    if (signalsCount > 0) {
      await remove(signalsRef);
      console.log(`✅ ${signalsCount} signaux supprimés`);
    }
    
    // Supprimer tous les messages
    if (messagesCount > 0) {
      await remove(messagesRef);
      console.log(`✅ ${messagesCount} messages supprimés`);
    }
    
    console.log('\n✨ Terminé ! Toutes les données ont été supprimées.');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    process.exit(1);
  }
}

clearAllData().then(() => {
  process.exit(0);
});
