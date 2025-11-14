import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyAkooeomw80N2p89zUaSB5L2AwoB-SSpKg",
  authDomain: "tradingpourlesnuls-e7da4.firebaseapp.com",
  databaseURL: "https://tradingpourlesnuls-e7da4-default-rtdb.firebaseio.com",
  projectId: "tradingpourlesnuls-e7da4",
  storageBucket: "tradingpourlesnuls-e7da4.appspot.com",
  messagingSenderId: "742975995598",
  appId: "1:742975995598:web:a873ce4b7b3fb5af899a9f",
  measurementId: "G-4SVCDJXSYN"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 