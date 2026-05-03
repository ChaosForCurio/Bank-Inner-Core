import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSX_w-LDE7ZbZQwrxaG9ymU_kGRN1Se6M",
  authDomain: "chat-ai-34217.firebaseapp.com",
  projectId: "chat-ai-34217",
  storageBucket: "chat-ai-34217.firebasestorage.app",
  messagingSenderId: "720193222419",
  appId: "1:720193222419:web:3c14c814c9e92a31e54ce6",
  measurementId: "G-WHG9FDN4ND"
};

// Initialize Firebase (SSR friendly)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

// Analytics is client-side only
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, db, analytics, ref, onValue };
