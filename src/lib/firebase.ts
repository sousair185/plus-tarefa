import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCfl9R2hOEq0PVWFroMbd7vta-vJnn6cKg",
  authDomain: "lista-de-tarefas-348c9.firebaseapp.com",
  projectId: "lista-de-tarefas-348c9",
  storageBucket: "lista-de-tarefas-348c9.firebasestorage.app",
  messagingSenderId: "1006738955380",
  appId: "1:1006738955380:web:ae955060496d4cf337c521",
  measurementId: "G-T9R6FVYVWJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);